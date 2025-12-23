// deviceNetwork.js - Network communication module for Shelly device control

const http = require('http');
const https = require('https');

// Device communication configuration
const DEVICE_TIMEOUT = 5000; // 5 seconds timeout
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 1000; // 1 second between retries

// Shelly device credentials (can be configured per device)
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = '';

/**
 * Check device status by making HTTP request to Shelly device
 * @param {Object} device - Device object with ip, name, type
 * @returns {Promise<string>} - 'ON', 'OFF', or 'OFFLINE'
 */
async function checkDeviceStatus(device) {
  try {
    console.log(`[deviceNetwork] Checking status for ${device.name} (${device.ip})`);
    const response = await makeShellyRequest(device.ip, '/status', 'GET', device.auth);
    const status = parseShellyStatus(response);
    console.log(`[deviceNetwork] ${device.name} status: ${status}`);
    return status;
  } catch (error) {
    console.error(`[deviceNetwork] Failed to check status for ${device.name}:`, error.message);
    return 'OFFLINE';
  }
}

/**
 * Control device relay (turn on/off) using Shelly API
 * @param {Object} device - Device object with ip, name, type
 * @param {boolean} turnOn - true to turn on, false to turn off
 * @returns {Promise<boolean>} - true if successful
 */
async function controlDeviceRelay(device, turnOn) {
  try {
    console.log(`[deviceNetwork] Controlling relay for ${device.name} (${device.ip}): turn=${turnOn ? 'on' : 'off'}`);

    // For Shelly Gen 3 Plug S, use RPC API
    const endpoint = '/rpc/Switch.Set';
    const postData = JSON.stringify({
      id: 0,
      on: turnOn
    });

    const response = await makeShellyRequest(device.ip, endpoint, 'POST', device.auth, 1, postData);
    console.log(`[deviceNetwork] Control response:`, response);

    // Parse response to verify success
    const result = JSON.parse(response);
    const success = result.result && result.result.was_on !== undefined;

    if (success) {
      console.log(`[deviceNetwork] ${device.name} successfully turned ${turnOn ? 'ON' : 'OFF'}`);
    }

    return success;
  } catch (error) {
    console.error(`[deviceNetwork] Failed to control relay for ${device.name}:`, error.message);
    throw error;
  }
}

/**
 * Make HTTP request to Shelly device with authentication
 * @param {string} ip - Device IP address
 * @param {string} path - API endpoint path
 * @param {string} method - HTTP method (GET, POST)
 * @param {Object} auth - Authentication object {username, password}
 * @param {number} attempt - Current attempt number (for retry logic)
 * @returns {Promise<string>} - Response body
 */
function makeShellyRequest(ip, path, method, auth = null, attempt = 1) {
  return new Promise((resolve, reject) => {
    const username = auth?.username || DEFAULT_USERNAME;
    const password = auth?.password || DEFAULT_PASSWORD;

    const options = {
      hostname: ip,
      port: 80,
      path: path,
      method: method,
      timeout: DEVICE_TIMEOUT,
      headers: {
        'User-Agent': 'GUI-Mate/1.0',
        'Content-Type': 'application/json'
      },
      auth: username && password ? `${username}:${password}` : undefined
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      // Retry logic
      if (attempt < RETRY_ATTEMPTS) {
        setTimeout(() => {
          makeShellyRequest(ip, path, method, auth, attempt + 1)
            .then(resolve)
            .catch(reject);
        }, RETRY_DELAY);
      } else {
        reject(error);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Parse Shelly device status response
 * @param {string} response - Raw JSON response from Shelly device
 * @returns {string} - 'ON', 'OFF', or 'OFFLINE'
 */
function parseShellyStatus(response) {
  try {
    const data = JSON.parse(response);

    // Shelly devices return status with relays array
    if (data.relays && Array.isArray(data.relays) && data.relays.length > 0) {
      return data.relays[0].ison ? 'ON' : 'OFF';
    }

    // Fallback for direct ison property
    if (data.ison !== undefined) {
      return data.ison ? 'ON' : 'OFF';
    }

    return 'OFFLINE';
  } catch (error) {
    console.error('Error parsing Shelly response:', error);
    return 'OFFLINE';
  }
}

/**
 * Test device connectivity using Shelly API
 * @param {Object} device - Device object
 * @returns {Promise<boolean>} - true if device is reachable
 */
async function testDeviceConnectivity(device) {
  try {
    await makeShellyRequest(device.ip, '/shelly', 'GET', device.auth);
    return true;
  } catch {
    return false;
  }
}

/**
 * Discover Shelly devices on the network
 * @returns {Promise<Array>} - Array of discovered devices
 */
async function discoverDevices() {
  const discoveredDevices = [];
  const promises = [];

  // Get local IP to determine network range
  const localIP = require('os').networkInterfaces();
  let networkPrefix = '192.168.1.'; // Default fallback

  // Try to find a local IP to determine network
  for (const iface of Object.values(localIP)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        const parts = addr.address.split('.');
        networkPrefix = `${parts[0]}.${parts[1]}.${parts[2]}.`;
        break;
      }
    }
  }

  console.log(`[deviceNetwork] Scanning network range: ${networkPrefix}1-254`);

  // Scan common IP range (adjust as needed)
  for (let i = 1; i <= 254; i++) {
    const ip = `${networkPrefix}${i}`;
    promises.push(checkDeviceAtIP(ip));
  }

  // Wait for all checks to complete
  const results = await Promise.allSettled(promises);

  // Collect successful discoveries
  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      discoveredDevices.push(result.value);
    }
  });

  console.log(`[deviceNetwork] Discovered ${discoveredDevices.length} devices`);
  return discoveredDevices;
}

/**
 * Check if a Shelly device exists at the given IP
 * @param {string} ip - IP address to check
 * @returns {Promise<Object|null>} - Device info or null
 */
async function checkDeviceAtIP(ip) {
  try {
    // Try to get device info from /shelly endpoint
    const response = await makeShellyRequest(ip, '/shelly', 'GET', null, 1); // Short timeout
    const deviceInfo = JSON.parse(response);

    if (deviceInfo && deviceInfo.id) {
      return {
        name: deviceInfo.name || `Shelly ${deviceInfo.type || 'Device'}`,
        type: deviceInfo.type || 'Shelly Device',
        ip: ip,
        id: deviceInfo.id
      };
    }
  } catch (error) {
    // Device not found or not responding, silently continue
  }
  return null;
}

module.exports = {
  checkDeviceStatus,
  controlDeviceRelay,
  testDeviceConnectivity,
  discoverDevices
};