// Get device data from URL parameters or from opener
const urlParams = new URLSearchParams(window.location.search);
const deviceData = urlParams.get('device');

let device;
try {
    device = JSON.parse(decodeURIComponent(deviceData));
} catch (e) {
    console.error('Failed to parse device data:', e);
    window.close();
}

document.addEventListener('DOMContentLoaded', () => {
    // Pre-fill form with device data
    if (device) {
        document.getElementById('deviceName').value = device.name || '';
        document.getElementById('deviceType').value = device.type || 'Shelly Plug S';
        document.getElementById('deviceIP').value = device.ip || '';
        document.getElementById('username').value = device.auth?.username || 'admin';
        document.getElementById('password').value = device.auth?.password || '';
    }

    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', () => {
        window.close();
    });
});

document.getElementById('editForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('deviceName').value.trim();
    const type = document.getElementById('deviceType').value.trim();
    const ip = document.getElementById('deviceIP').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Clear previous validation states
    clearValidationStates();

    // Validate inputs
    let isValid = true;
    const errors = [];

    if (!name) {
        showFieldError('deviceName', 'Device name is required');
        isValid = false;
        errors.push('Device name is required');
    } else if (name.length > 50) {
        showFieldError('deviceName', 'Device name must be 50 characters or less');
        isValid = false;
        errors.push('Device name too long');
    } else {
        showFieldSuccess('deviceName');
    }

    if (!type) {
        showFieldError('deviceType', 'Device type is required');
        isValid = false;
        errors.push('Device type is required');
    } else {
        showFieldSuccess('deviceType');
    }

    const ipv4regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ip) {
        showFieldError('deviceIP', 'IP address is required');
        isValid = false;
        errors.push('IP address is required');
    } else if (!ipv4regex.test(ip)) {
        showFieldError('deviceIP', 'Please enter a valid IPv4 address');
        isValid = false;
        errors.push('Invalid IP address');
    } else {
        showFieldSuccess('deviceIP');
    }

    if (!isValid) {
        return;
    }

    // Create updated device object
    const updatedDevice = {
        name,
        type,
        ip
    };

    // Add authentication if provided
    if (username || password) {
        updatedDevice.auth = {
            username: username || 'admin',
            password: password || ''
        };
    }

    try {
        // Send update to main process
        console.log('Sending device update:', device.name, updatedDevice);
        await window.deviceAPI.updateDevice(device.name, updatedDevice);

        alert('Device updated successfully!');
        window.close();
    } catch (error) {
        console.error('Error updating device:', error);
        alert('Failed to update device: ' + error.message);
    }
});

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.add('validation-error');
    field.classList.remove('validation-success');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'validation-message';
    messageDiv.textContent = message;
    field.parentNode.appendChild(messageDiv);
}

function showFieldSuccess(fieldId) {
    const field = document.getElementById(fieldId);
    field.classList.add('validation-success');
    field.classList.remove('validation-error');

    // Remove any existing error message
    const message = field.parentNode.querySelector('.validation-message');
    if (message) {
        message.remove();
    }
}

function clearValidationStates() {
    const fields = ['deviceName', 'deviceType', 'deviceIP'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        field.classList.remove('validation-error', 'validation-success');
        const message = field.parentNode.querySelector('.validation-message');
        if (message) {
            message.remove();
        }
    });
}