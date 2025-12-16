// --- Background image logic ---
window.api.onSetBackgroundImage((filePath) => {
  document.body.style.backgroundImage = `url('${filePath}')`;
});

// --- Device icon logic ---
function getIconForState(type, state) {
  // type: device type, state: 'ON', 'OFF', 'OFFLINE'
  if (state === 'ON') return `./imgs/enabled.ico`;
  if (state === 'OFF') return `./imgs/disabled.ico`;
  return `./imgs/offline.ico`;
}


function createDeviceButton(device, position) {
  const container = document.getElementById('device-buttons') || document.body;
  const btn = document.createElement('button');
  btn.id = `btn-${device.name}`;
  btn.dataset.state = 'OFFLINE';
  btn.alt = device.name;
  btn.title = device.name;
  btn.className = 'draggable';
  btn.dataset.deviceInfo = JSON.stringify(device);
  if (position) {
    btn.style.position = 'absolute';
    btn.style.left = position.left;
    btn.style.top = position.top;
  }
  const img = document.createElement('img');
  img.id = device.name;
  img.src = getIconForState(device.type, 'OFFLINE');
  img.width = 128;
  img.height = 128;
  btn.appendChild(img);
  container.appendChild(btn);
  makeDraggable(btn);
  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showDeviceContextMenu(device, btn, e);
  });
}

// Listen for 'device-add' event from main process
window.electronAPI.OnDeviceAdd((data) => {
  data.forEach(device => {
    createDeviceButton(device);
  });
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
    { label: 'Információ', action: () => showDeviceInfo(device) }
  ];
  actions.forEach(item => {
    const entry = document.createElement('div');
    entry.textContent = item.label;
    entry.style.padding = '8px 16px';
    entry.style.cursor = 'pointer';
    entry.addEventListener('mouseenter', () => entry.style.background = '#eee');
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

// --- Relay control simulation ---
function controlRelay(device, turnOn) {
  const btn = document.getElementById(`btn-${device.name}`);
  if (!btn) return;
  btn.dataset.state = turnOn ? 'ON' : 'OFF';
  const img = btn.querySelector('img');
  if (img) {
    img.src = getIconForState(device.type, turnOn ? 'ON' : 'OFF');
  }
  // TODO: send relay control to backend if needed
}

// --- Show device info popup (stub) ---
function showDeviceInfo(device) {
  // TODO: open popup window with device info
  alert(`Device info:\nName: ${device.name}\nIP: ${device.ip}\nType: ${device.type}`);
}

// --- Drag and drop logic ---
function makeDraggable(element) {
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
  document.addEventListener('mouseup', () => {
    if (isDragging) isDragging = false;
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
  const result = await window.projectAPI.saveIconPositions(positions);
  // Optionally show a notification or log
}

// Expose for preload.js to call
window.saveIconPositions = saveIconPositions;

async function loadIconPositions() {
  const positions = await window.projectAPI.loadIconPositions();
  Object.entries(positions).forEach(([id, pos]) => {
    const btn = document.getElementById(id);
    if (btn && pos.left && pos.top) {
      btn.style.position = 'absolute';
      btn.style.left = pos.left;
      btn.style.top = pos.top;
    }
  });
}



// --- Routine menu stubs ---
async function addRoutine() {
  // Example: add a dummy routine and save
  let routines = await window.projectAPI.loadRoutines();
  routines.push({ name: 'New Routine', type: 'onoff', time: '12:00' });
  await window.projectAPI.saveRoutines(routines);
  alert('Routine added!');
}
async function editRoutines() {
  // Example: load and show routines
  let routines = await window.projectAPI.loadRoutines();
  alert('Routines:\n' + JSON.stringify(routines, null, 2));
}
// --- Load icon positions on startup ---
window.addEventListener('DOMContentLoaded', () => {
  // ...existing code...
  loadIconPositions();
});

// --- DOMContentLoaded: load devices and icon positions on startup ---
window.addEventListener('DOMContentLoaded', async () => {
  // Load all devices and create buttons
  const devices = await window.electronAPI.loadAllDevices();
  if (Array.isArray(devices)) {
    devices.forEach(device => createDeviceButton(device));
  }
  loadIconPositions();
});
