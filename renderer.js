// Create a debug panel to show console messages
function createDebugPanel() {
  const debugPanel = document.createElement('div');
  debugPanel.id = 'debug-panel';
  debugPanel.style.position = 'fixed';
  debugPanel.style.bottom = '10px';
  debugPanel.style.right = '10px';
  debugPanel.style.width = '400px';
  debugPanel.style.height = '200px';
  debugPanel.style.background = 'rgba(0, 0, 0, 0.8)';
  debugPanel.style.color = 'white';
  debugPanel.style.fontSize = '12px';
  debugPanel.style.fontFamily = 'monospace';
  debugPanel.style.padding = '10px';
  debugPanel.style.overflow = 'auto';
  debugPanel.style.zIndex = '10000';
  debugPanel.style.border = '1px solid #333';
  debugPanel.style.borderRadius = '5px';

  const title = document.createElement('div');
  title.textContent = 'DEBUG CONSOLE (Click to hide)';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '5px';
  title.style.cursor = 'pointer';
  title.onclick = () => debugPanel.style.display = 'none';

  debugPanel.appendChild(title);
  document.body.appendChild(debugPanel);

  // Override console.log to also show in debug panel
  const originalLog = console.log;
  const originalError = console.error;

  console.log = function(...args) {
    originalLog.apply(console, args);
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    addDebugMessage('LOG: ' + message);
  };

  console.error = function(...args) {
    originalError.apply(console, args);
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    addDebugMessage('ERROR: ' + message, true);
  };

  function addDebugMessage(message, isError = false) {
    const msgDiv = document.createElement('div');
    msgDiv.textContent = new Date().toLocaleTimeString() + ' - ' + message;
    msgDiv.style.marginBottom = '2px';
    if (isError) msgDiv.style.color = '#ff6b6b';
    debugPanel.appendChild(msgDiv);
    debugPanel.scrollTop = debugPanel.scrollHeight;
  }

  return debugPanel;
}

// --- Loading Indicators ---
function showLoadingOverlay(message = 'Loading...') {
  hideLoadingOverlay(); // Remove any existing overlay

  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.className = 'loading-overlay';

  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';

  const text = document.createElement('div');
  text.className = 'loading-text';
  text.textContent = message;

  overlay.appendChild(spinner);
  overlay.appendChild(text);
  document.body.appendChild(overlay);

  return overlay;
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function showDeviceLoadingIndicator(deviceName) {
  const btn = document.getElementById(`btn-${deviceName}`);
  if (!btn) return;

  // Remove existing indicator
  hideDeviceLoadingIndicator(deviceName);

  const indicator = document.createElement('div');
  indicator.id = `loading-${deviceName}`;
  indicator.className = 'device-loading-indicator';
  btn.appendChild(indicator);

  return indicator;
}

function hideDeviceLoadingIndicator(deviceName) {
  const indicator = document.getElementById(`loading-${deviceName}`);
  if (indicator) {
    indicator.remove();
  }
}

// --- Configuration Validation ---
function validateIPAddress(ip) {
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

function validateDeviceName(name) {
  return name && name.trim().length > 0 && name.length <= 50;
}

function validateDeviceType(type) {
  return type && type.trim().length > 0;
}

function showValidationError(element, message) {
  // Remove existing validation message
  hideValidationError(element);

  element.classList.add('validation-error');
  element.classList.remove('validation-success');

  const messageDiv = document.createElement('div');
  messageDiv.className = 'validation-message';
  messageDiv.textContent = message;
  element.parentNode.appendChild(messageDiv);
}

function showValidationSuccess(element) {
  // Remove existing validation message
  hideValidationError(element);

  element.classList.add('validation-success');
  element.classList.remove('validation-error');
}

function hideValidationError(element) {
  element.classList.remove('validation-error', 'validation-success');
  const message = element.parentNode.querySelector('.validation-message');
  if (message) {
    message.remove();
  }
}

function validateDeviceConfig(device) {
  const errors = [];

  if (!validateDeviceName(device.name)) {
    errors.push('Device name is required and must be 50 characters or less');
  }

  if (!validateDeviceType(device.type)) {
    errors.push('Device type is required');
  }

  if (!validateIPAddress(device.ip)) {
    errors.push('Valid IPv4 address is required');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

function validateDeviceConfig(device) {
  const errors = [];

  if (!validateDeviceName(device.name)) {
    errors.push('Device name is required and must be 50 characters or less');
  }

  if (!validateDeviceType(device.type)) {
    errors.push('Device type is required');
  }

  if (!validateIPAddress(device.ip)) {
    errors.push('Valid IPv4 address is required');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// --- Device Discovery ---
async function discoverDevices() {
  console.log('Starting device discovery...');
  showLoadingOverlay('Discovering devices on network...');

  try {
    const discoveredDevices = await window.deviceAPI.discoverDevices();
    console.log('Discovered devices:', discoveredDevices);

    if (discoveredDevices && discoveredDevices.length > 0) {
      showDiscoveryPanel(discoveredDevices);
    } else {
      showNotification('No Shelly devices found on the network', true);
    }
  } catch (error) {
    console.error('Error during device discovery:', error);
    showNotification('Failed to discover devices: ' + error.message, true);
  } finally {
    hideLoadingOverlay();
  }
}

function showDiscoveryPanel(devices) {
  // Remove existing panel
  hideDiscoveryPanel();

  const panel = document.createElement('div');
  panel.id = 'discovery-panel';
  panel.className = 'discovery-panel';

  const title = document.createElement('h3');
  title.textContent = 'Discovered Devices';
  panel.appendChild(title);

  devices.forEach(device => {
    const deviceDiv = document.createElement('div');
    deviceDiv.className = 'discovery-device';

    const info = document.createElement('span');
    info.textContent = `${device.name || 'Unknown Device'} (${device.ip}) - ${device.type || 'Shelly Device'}`;
    deviceDiv.appendChild(info);

    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add';
    addBtn.onclick = () => addDiscoveredDevice(device);
    deviceDiv.appendChild(addBtn);

    panel.appendChild(deviceDiv);
  });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.marginTop = '15px';
  closeBtn.style.padding = '8px 16px';
  closeBtn.onclick = hideDiscoveryPanel;
  panel.appendChild(closeBtn);

  document.body.appendChild(panel);
}

function hideDiscoveryPanel() {
  const panel = document.getElementById('discovery-panel');
  if (panel) {
    panel.remove();
  }
}

async function addDiscoveredDevice(device) {
  try {
    // Check if device already exists
    const existingDevices = await window.electronAPI.loadAllDevices();
    const exists = existingDevices.some(d => d.ip === device.ip);

    if (exists) {
      showNotification('Device already exists in your configuration', true);
      return;
    }

    // Add the device
    await window.deviceAPI.addDevice(device);
    showNotification(`Added ${device.name || device.ip} to your devices`);

    // Refresh the device list
    location.reload();
  } catch (error) {
    console.error('Error adding discovered device:', error);
    showNotification('Failed to add device', true);
  }
}

async function addDiscoveredDevice(device) {
  try {
    // Check if device already exists
    const existingDevices = await window.electronAPI.loadAllDevices();
    const exists = existingDevices.some(d => d.ip === device.ip);

    if (exists) {
      showNotification('Device already exists in your configuration', true);
      return;
    }

    // Add the device
    await window.deviceAPI.addDevice(device);
    showNotification(`Added ${device.name || device.ip} to your devices`);

    // Refresh the device list
    location.reload();
  } catch (error) {
    console.error('Error adding discovered device:', error);
    showNotification('Failed to add device', true);
  }
}

// --- Advanced Scaling Options ---
function createScalingControls() {
  const controls = document.createElement('div');
  controls.id = 'scaling-controls';
  controls.className = 'scaling-controls';

  const title = document.createElement('h4');
  title.textContent = 'Advanced Scaling';
  controls.appendChild(title);

  // Scale factor slider
  const scaleLabel = document.createElement('label');
  scaleLabel.textContent = 'Icon Scale: ';
  controls.appendChild(scaleLabel);

  const scaleSlider = document.createElement('input');
  scaleSlider.type = 'range';
  scaleSlider.min = '0.5';
  scaleSlider.max = '2.0';
  scaleSlider.step = '0.1';
  scaleSlider.value = '1.0';
  scaleSlider.className = 'scaling-slider';
  controls.appendChild(scaleSlider);

  const scaleValue = document.createElement('span');
  scaleValue.className = 'scaling-value';
  scaleValue.textContent = '1.0x';
  controls.appendChild(scaleValue);

  // Spacing slider
  const spacingLabel = document.createElement('label');
  spacingLabel.textContent = 'Icon Spacing: ';
  controls.appendChild(document.createElement('br'));
  controls.appendChild(spacingLabel);

  const spacingSlider = document.createElement('input');
  spacingSlider.type = 'range';
  spacingSlider.min = '0';
  spacingSlider.max = '50';
  spacingSlider.step = '5';
  spacingSlider.value = '0';
  spacingSlider.className = 'scaling-slider';
  controls.appendChild(spacingSlider);

  const spacingValue = document.createElement('span');
  spacingValue.className = 'scaling-value';
  spacingValue.textContent = '0px';
  controls.appendChild(spacingValue);

  // Apply button
  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply';
  applyBtn.style.marginTop = '10px';
  applyBtn.style.width = '100%';
  controls.appendChild(document.createElement('br'));
  controls.appendChild(applyBtn);

  // Event listeners
  scaleSlider.addEventListener('input', () => {
    scaleValue.textContent = scaleSlider.value + 'x';
  });

  spacingSlider.addEventListener('input', () => {
    spacingValue.textContent = spacingSlider.value + 'px';
  });

  applyBtn.addEventListener('click', () => {
    applyAdvancedScaling(parseFloat(scaleSlider.value), parseInt(spacingSlider.value));
    controls.classList.remove('show');
  });

  document.body.appendChild(controls);
  return controls;
}

function applyAdvancedScaling(scale, spacing) {
  const buttons = document.querySelectorAll('.draggable');
  buttons.forEach(btn => {
    const img = btn.querySelector('img');
    if (img) {
      img.style.transform = `scale(${scale})`;
      img.style.margin = `${spacing}px`;
    }
  });

  showNotification(`Applied scaling: ${scale}x scale, ${spacing}px spacing`);
}

function toggleScalingControls() {
  let controls = document.getElementById('scaling-controls');
  if (!controls) {
    controls = createScalingControls();
  }

  controls.classList.toggle('show');
}

// --- Device icon logic ---
function getIconForState(type, state) {
  // type: device type, state: 'ON', 'OFF', 'OFFLINE'
  if (state === 'ON') return './imgs/enabled.png';
  if (state === 'OFF') return './imgs/disabled.png';
  return './imgs/offline.png';
}

// Create a colored div instead of image for testing
function createDeviceIcon(device, state) {
  const iconDiv = document.createElement('div');
  iconDiv.style.width = '128px';
  iconDiv.style.height = '128px';
  iconDiv.style.borderRadius = '8px';
  iconDiv.style.display = 'flex';
  iconDiv.style.alignItems = 'center';
  iconDiv.style.justifyContent = 'center';
  iconDiv.style.fontSize = '12px';
  iconDiv.style.fontWeight = 'bold';
  iconDiv.style.color = 'white';
  iconDiv.textContent = device.name;

  if (state === 'ON') {
    iconDiv.style.backgroundColor = '#18995F'; // Green
  } else if (state === 'OFF') {
    iconDiv.style.backgroundColor = '#991818'; // Red
  } else {
    iconDiv.style.backgroundColor = '#586064'; // Gray
  }

  return iconDiv;
}


async function createDeviceButton(device, position) {
  console.log('createDeviceButton called for device:', device.name);
  const container = document.getElementById('device-buttons') || document.body;
  console.log('Container found:', container.id || 'body');

  const btn = document.createElement('button');
  btn.id = `btn-${device.name}`;
  btn.dataset.state = 'OFFLINE';
  btn.alt = device.name;
  btn.title = device.name;
  btn.className = 'draggable';
  btn.dataset.deviceInfo = JSON.stringify(device);

  // Add inline styles to ensure visibility
  btn.style.position = 'absolute';
  btn.style.zIndex = '1000';
  btn.style.border = '2px solid blue';
  btn.style.background = 'rgba(255, 255, 255, 0.8)';

  console.log('Button created with ID:', btn.id);

  // Always try to get saved position if not provided
  if (!position) {
    const positions = await window.projectAPI.loadIconPositions();
    position = positions[btn.id];
    console.log('Loaded positions:', positions);
    console.log('Position for button:', btn.id, position);
  }
  if (position && position.left && position.top) {
    btn.style.position = 'absolute';
    btn.style.left = position.left;
    btn.style.top = position.top;
    // Lock icons that have saved positions
    btn.classList.add('locked');
    console.log('Button positioned and locked at:', position.left, position.top);
  } else {
    // Default position if no saved position
    const defaultLeft = 50 + (Array.from(document.querySelectorAll('.draggable')).length * 150);
    const defaultTop = 100;
    btn.style.position = 'absolute';
    btn.style.left = `${defaultLeft}px`;
    btn.style.top = `${defaultTop}px`;
    console.log('Button positioned at default location:', defaultLeft, defaultTop);
  }

  const img = document.createElement('img');
  img.id = device.name;
  img.src = getIconForState(device.type, 'OFFLINE');
  img.width = 128;
  img.height = 128;
  img.style.borderRadius = '8px';
  img.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
  img.onerror = () => {
    console.error('Failed to load image:', img.src, 'for device:', device.name);
    // Fallback: create a colored div if image fails
    const fallbackDiv = document.createElement('div');
    fallbackDiv.style.width = '128px';
    fallbackDiv.style.height = '128px';
    fallbackDiv.style.borderRadius = '8px';
    fallbackDiv.style.backgroundColor = '#9E9E9E'; // Gray for offline
    fallbackDiv.style.display = 'flex';
    fallbackDiv.style.alignItems = 'center';
    fallbackDiv.style.justifyContent = 'center';
    fallbackDiv.style.fontSize = '12px';
    fallbackDiv.style.fontWeight = 'bold';
    fallbackDiv.style.color = 'white';
    fallbackDiv.textContent = device.name;
    btn.appendChild(fallbackDiv);
  };
  img.onload = () => {
    console.log('Successfully loaded image:', img.src, 'for device:', device.name);
  };
  btn.appendChild(img);

  container.appendChild(btn);
  console.log('Button appended to container, img src:', img.src);

  // Apply current scaling mode
  applyScaling(btn);

  makeDraggable(btn);
  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showDeviceContextMenu(device, btn, e);
  });

  console.log('Device button creation completed for:', device.name);
}

// Listen for 'device-add' event from main process
window.electronAPI.OnDeviceAdd((data) => {
  data.forEach(device => {
    createDeviceButton(device);
  });
});

// Listen for device removal
window.api.onDeviceRemoved = (callback) => ipcRenderer.on('device-removed', (event, deviceName) => callback(deviceName));
window.api.onDeviceRemoved((deviceName) => {
  const btn = document.getElementById(`btn-${deviceName}`);
  if (btn) {
    btn.remove();
  }
});

// Listen for device updates
window.api.onDeviceUpdated = (callback) => ipcRenderer.on('device-updated', (event, data) => callback(data));
window.api.onDeviceUpdated(({ oldName, newDevice }) => {
  const btn = document.getElementById(`btn-${oldName}`);
  if (btn) {
    // Update button ID and attributes
    btn.id = `btn-${newDevice.name}`;
    btn.alt = newDevice.name;
    btn.title = newDevice.name;
    btn.dataset.deviceInfo = JSON.stringify(newDevice);

    // Update image if needed
    const img = btn.querySelector('img');
    if (img) {
      img.id = newDevice.name;
    }
  }
});

// Listen for scaling mode changes
window.api.onScalingModeChange = (callback) => ipcRenderer.on('set-scaling-mode', (event, mode) => callback(mode));
window.api.onScalingModeChange((mode) => {
  setScalingMode(mode);
});

// Listen for routine menu actions from main process
window.api.onAddRoutineRequest(() => {
  addRoutine();
});

window.api.onEditRoutinesRequest(() => {
  editRoutines();
});

window.api.onSaveIconPositionsRequest(() => {
  saveIconPositions();
});

window.api.onDiscoverDevicesRequest(() => {
  discoverDevices();
});

window.api.onToggleScalingControls(() => {
  toggleScalingControls();
});

// --- Context menu for device actions ---
function showDeviceContextMenu(device, btn, event) {
  let menu = document.getElementById('device-context-menu');
  if (menu) menu.remove();
  menu = document.createElement('div');
  menu.id = 'device-context-menu';
  menu.style.position = 'absolute';
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.style.background = '#fff';
  menu.style.border = '1px solid #ccc';
  menu.style.zIndex = 10000;
  menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  menu.style.padding = '0';
  menu.style.minWidth = '120px';
  const actions = [
    { label: 'Bekapcsolás', action: () => controlRelay(device, true) },
    { label: 'Kikapcsolás', action: () => controlRelay(device, false) },
    { label: 'Információ', action: () => showDeviceInfo(device) },
    { label: 'Szerkesztés', action: () => window.api.openEditPopup(device) },
    { label: 'Eltávolítás', action: () => removeDevice(device), danger: true }
  ];
  actions.forEach(item => {
    const entry = document.createElement('div');
    entry.textContent = item.label;
    entry.style.padding = '8px 16px';
    entry.style.cursor = 'pointer';
    if (item.danger) {
      entry.style.color = '#d32f2f';
      entry.style.fontWeight = 'bold';
    }
    entry.addEventListener('mouseenter', () => entry.style.background = item.danger ? '#ffebee' : '#eee');
    entry.addEventListener('mouseleave', () => entry.style.background = '#fff');
    entry.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.remove();
      item.action();
    });
    menu.appendChild(entry);
  });
  document.body.appendChild(menu);
  setTimeout(() => {
    document.addEventListener('click', function handler() {
      menu.remove();
      document.removeEventListener('click', handler);
    });
  }, 0);
}

// --- Automatic device status refresh ---
let statusRefreshInterval;

function startDeviceStatusRefresh() {
  // Clear any existing interval
  if (statusRefreshInterval) {
    clearInterval(statusRefreshInterval);
  }

  // Start polling every 5 seconds instead of 1 second
  statusRefreshInterval = setInterval(async () => {
    await refreshAllDeviceStatuses();
  }, 5000);
}

function stopDeviceStatusRefresh() {
  if (statusRefreshInterval) {
    clearInterval(statusRefreshInterval);
    statusRefreshInterval = null;
  }
}

async function refreshAllDeviceStatuses() {
  const devices = await window.electronAPI.loadAllDevices();
  if (!Array.isArray(devices)) return;

  for (const device of devices) {
    await refreshDeviceStatus(device);
  }
}

async function refreshDeviceStatus(device) {
  try {
    // Show loading indicator
    showDeviceLoadingIndicator(device.name);

    // Use real network call to check device status
    const result = await window.deviceAPI.checkDeviceStatus(device);
    const newState = result.success ? result.status : 'OFFLINE';

    // Update UI if state changed
    updateDeviceState(device, newState);
  } catch (error) {
    console.error(`Error refreshing status for device ${device.name}:`, error);
    updateDeviceState(device, 'OFFLINE');
  } finally {
    // Hide loading indicator
    hideDeviceLoadingIndicator(device.name);
  }
}

function updateDeviceState(device, newState) {
  console.log(`updateDeviceState called for ${device.name} with state: ${newState}`);
  const btn = document.getElementById(`btn-${device.name}`);
  if (!btn) {
    console.error(`Button not found for device: ${device.name}`);
    return;
  }

  const currentState = btn.dataset.state;
  if (currentState === newState) {
    console.log(`State unchanged for ${device.name}: ${currentState}`);
    return; // No change needed
  }

  // Update button state
  btn.dataset.state = newState;
  console.log(`Updated button dataset.state to: ${newState}`);

  // Update icon - try img first, then fallback div
  const img = btn.querySelector('img');
  console.log(`Found img element:`, !!img);
  if (img) {
    const newSrc = getIconForState(device.type, newState);
    console.log(`Updating ${device.name} icon to: ${newSrc}`);
    img.src = newSrc;
  } else {
    console.log(`No img element found for ${device.name}, checking for fallback div`);
    // Check for fallback div
    const fallbackDiv = btn.querySelector('div');
    if (fallbackDiv) {
      console.log(`Updating fallback div color for ${device.name}`);
      if (newState === 'ON') {
        fallbackDiv.style.backgroundColor = '#4CAF50'; // Green
      } else if (newState === 'OFF') {
        fallbackDiv.style.backgroundColor = '#f44336'; // Red
      } else {
        fallbackDiv.style.backgroundColor = '#9E9E9E'; // Gray
      }
    }
  }
}

// --- Relay control ---
async function controlRelay(device, turnOn) {
  console.log(`Attempting to control relay for ${device.name}: turn ${turnOn ? 'ON' : 'OFF'}`);
  try {
    // Show loading indicator
    showDeviceLoadingIndicator(device.name);

    // Update UI immediately for responsive feel
    updateDeviceState(device, turnOn ? 'ON' : 'OFF');
    console.log(`UI updated to ${turnOn ? 'ON' : 'OFF'} state`);

    // Send actual control command to device
    console.log('Calling window.deviceAPI.controlDeviceRelay...');
    const result = await window.deviceAPI.controlDeviceRelay(device, turnOn);
    console.log('Control result:', result);

    if (!result.success) {
      console.error('Failed to control relay:', result.error);
      showNotification(`Failed to control ${device.name}: ${result.error}`, true);
      // Revert UI state on failure
      updateDeviceState(device, 'OFFLINE');
    } else {
      showNotification(`${device.name} turned ${turnOn ? 'ON' : 'OFF'}`);
    }
  } catch (error) {
    console.error('Error controlling relay:', error);
    showNotification(`Failed to control ${device.name}`, true);
    updateDeviceState(device, 'OFFLINE');
  } finally {
    // Hide loading indicator
    hideDeviceLoadingIndicator(device.name);
  }
}

// --- Show device info popup (stub) ---
function showDeviceInfo(device) {
  const authInfo = device.auth ?
    `\nUsername: ${device.auth.username}\nPassword: ${device.auth.password ? '***' : 'Not set'}` :
    '\nNo authentication configured';

  alert(`Device info:\nName: ${device.name}\nIP: ${device.ip}\nType: ${device.type}${authInfo}`);
}

// --- Remove device ---
async function removeDevice(device) {
  if (confirm(`Are you sure you want to remove the device "${device.name}"?`)) {
    try {
      const result = await window.deviceAPI.removeDevice(device.name);
      if (result.success) {
        showNotification(`Device "${device.name}" removed successfully`);
      } else {
        showNotification(`Failed to remove device: ${result.error}`, true);
      }
    } catch (error) {
      showNotification('Error removing device', true);
      console.error('Error removing device:', error);
    }
  }
}

// --- Scaling mode management ---
let currentScalingMode = 'fixed'; // Default to fixed scaling

function setScalingMode(mode) {
  currentScalingMode = mode;
  showNotification(`Scaling mode set to: ${mode}`);

  // Apply scaling to all device icons
  document.querySelectorAll('.draggable').forEach(btn => {
    applyScaling(btn);
  });
}

function applyScaling(element) {
  const img = element.querySelector('img');
  if (!img) return;

  if (currentScalingMode === 'dynamic') {
    // Dynamic scaling based on window size
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const scaleFactor = Math.min(windowWidth / 1920, windowHeight / 1080); // Base on 1920x1080
    const newSize = Math.max(64, Math.min(256, 128 * scaleFactor)); // Between 64px and 256px

    img.style.width = `${newSize}px`;
    img.style.height = `${newSize}px`;
  } else {
    // Fixed scaling (default 128x128)
    img.style.width = '128px';
    img.style.height = '128px';
  }
}

// Listen for window resize to apply dynamic scaling
window.addEventListener('resize', () => {
  if (currentScalingMode === 'dynamic') {
    document.querySelectorAll('.draggable').forEach(btn => {
      applyScaling(btn);
    });
  }
});

// --- Drag and drop logic ---
function makeDraggable(element) {
  // Check if icons are locked
  if (element.classList.contains('locked')) {
    return; // Don't make draggable if locked
  }

  let isDragging = false;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;
  element.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const style = window.getComputedStyle(element);
    startLeft = parseInt(style.left) || 0;
    startTop = parseInt(style.top) || 0;
    element.style.position = 'absolute';
    element.style.zIndex = 1000;
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    element.style.left = (startLeft + deltaX) + 'px';
    element.style.top = (startTop + deltaY) + 'px';
  });
  document.addEventListener('mouseup', async () => {
    if (isDragging) {
      isDragging = false;
      await saveIconPositions();
    }
  });
}

// --- Save/load icon positions (stubs) ---
async function saveIconPositions() {
  const positions = {};
  document.querySelectorAll('.draggable').forEach(btn => {
    positions[btn.id] = {
      left: btn.style.left,
      top: btn.style.top
    };
  });
  try {
    const result = await window.projectAPI.saveIconPositions(positions);
    // Lock icons after saving positions
    document.querySelectorAll('.draggable').forEach(btn => {
      btn.classList.add('locked');
    });
    showNotification('Icon positions saved and locked successfully.');
    return result;
  } catch (err) {
    showNotification('Failed to save icon positions.', true);
    console.error('Error saving icon positions:', err);
  }
}

// Expose for preload.js to call
window.saveIconPositions = saveIconPositions;

// --- Notification helper ---
function showNotification(message, isError = false) {
  let notif = document.getElementById('save-notification');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'save-notification';
    notif.style.position = 'fixed';
    notif.style.bottom = '20px';
    notif.style.right = '20px';
    notif.style.padding = '12px 24px';
    notif.style.background = isError ? '#ffcccc' : '#ccffcc';
    notif.style.color = '#333';
    notif.style.border = '1px solid #888';
    notif.style.borderRadius = '6px';
    notif.style.zIndex = 10001;
    notif.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    document.body.appendChild(notif);
  }
  notif.textContent = message;
  notif.style.background = isError ? '#ffcccc' : '#ccffcc';
  notif.style.display = 'block';
  setTimeout(() => {
    notif.style.display = 'none';
  }, 2000);
}

async function loadIconPositions() {
  const positions = await window.projectAPI.loadIconPositions();
  Object.entries(positions).forEach(([id, pos]) => {
    const btn = document.getElementById(id);
    if (btn && pos.left && pos.top) {
      btn.style.position = 'absolute';
      btn.style.left = pos.left;
      btn.style.top = pos.top;
      // Lock icons that have saved positions
      btn.classList.add('locked');
    }
  });
}



// --- Routine menu functions ---
async function addRoutine() {
  // For now, create a simple routine. In a real app, this would open a dialog
  const routine = {
    name: 'New Routine',
    type: 'onoff',
    deviceName: 'Smart Light', // Should be selected from available devices
    time: '12:00',
    days: [1, 2, 3, 4, 5], // Monday to Friday
    action: true // Turn ON
  };

  try {
    const result = await window.projectAPI.addRoutine(routine);
    if (result.success) {
      showNotification('Routine added successfully');
    } else {
      showNotification(`Failed to add routine: ${result.error}`, true);
    }
  } catch (error) {
    showNotification('Error adding routine', true);
    console.error('Error adding routine:', error);
  }
}

async function editRoutines() {
  try {
    const result = await window.projectAPI.getRoutines();
    if (result.success) {
      const routinesText = result.routines.map(r =>
        `${r.name}: ${r.time} - ${r.action ? 'ON' : 'OFF'} (${r.deviceName})`
      ).join('\n');
      alert(`Current Routines:\n${routinesText || 'No routines configured'}`);
    } else {
      showNotification(`Failed to load routines: ${result.error}`, true);
    }
  } catch (error) {
    showNotification('Error loading routines', true);
    console.error('Error loading routines:', error);
  }
}
window.addEventListener('DOMContentLoaded', () => {
  // Add Save Positions button if not present
  if (!document.getElementById('save-positions-btn')) {
    const btn = document.createElement('button');
    btn.id = 'save-positions-btn';
    btn.textContent = 'Save Positions';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.left = '20px';
    btn.style.zIndex = 10001;
    btn.addEventListener('click', saveIconPositions);
    document.body.appendChild(btn);
  }
});

// --- DOMContentLoaded: load devices and icon positions on startup ---
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded fired - waiting for APIs...');
});

// Use window.onload instead to ensure preload script has run
window.addEventListener('load', async () => {
  console.log('Window load fired - loading devices...');

  // Create debug panel to show console messages
  createDebugPanel();

  // Test debug panel
  console.log('DEBUG PANEL TEST: This should appear in the debug panel');

  // Check if APIs are available
  console.log('window.electronAPI available:', !!window.electronAPI);
  console.log('window.projectAPI available:', !!window.projectAPI);
  console.log('window.deviceAPI available:', !!window.deviceAPI);

  if (!window.electronAPI || !window.electronAPI.loadAllDevices) {
    console.error('electronAPI.loadAllDevices not available');
    return;
  }

  // Show loading overlay while loading devices
  showLoadingOverlay('Loading devices...');

  // Add a test element to verify DOM is working
  const testDiv = document.createElement('div');
  testDiv.textContent = 'TEST: Window loaded successfully';
  testDiv.style.position = 'fixed';
  testDiv.style.top = '10px';
  testDiv.style.left = '10px';
  testDiv.style.background = 'red';
  testDiv.style.color = 'white';
  testDiv.style.padding = '5px';
  testDiv.style.zIndex = '9999';
  document.body.appendChild(testDiv);

  try {
    const devices = await window.electronAPI.loadAllDevices();
    console.log('Loaded devices:', devices);

    if (Array.isArray(devices)) {
      console.log(`Creating buttons for ${devices.length} devices`);
      for (const device of devices) {
        console.log('Creating button for device:', device.name);
        await createDeviceButton(device);
      }
      console.log('All device buttons created');

      // Log all draggable elements after creation
      setTimeout(() => {
        const draggables = document.querySelectorAll('.draggable');
        console.log('Draggable elements found:', draggables.length);
        draggables.forEach((el, index) => {
          console.log(`Button ${index}:`, el.id, el.style.left, el.style.top, el.offsetWidth, el.offsetHeight);
        });
      }, 1000);

      // Update test div to show device count
      testDiv.textContent = `TEST: ${devices.length} devices loaded`;
    } else {
      console.error('Devices is not an array:', devices);
      testDiv.textContent = 'TEST: Devices not an array';
    }

    // Hide loading overlay
    hideLoadingOverlay();
  } catch (error) {
    console.error('Error loading devices:', error);
    testDiv.textContent = 'TEST: Error loading devices';

    // Hide loading overlay even on error
    hideLoadingOverlay();
  }

  // Start automatic device status refresh
  startDeviceStatusRefresh();
});
