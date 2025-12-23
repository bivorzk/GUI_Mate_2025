const { contextBridge, ipcRenderer } = require("electron");

// Expose 'api' as before
contextBridge.exposeInMainWorld("api", {
  showContextMenu: () => ipcRenderer.send("show-context-menu"),
  onSetBackgroundImage: (callback) => ipcRenderer.on('set-background-image', (event, filePath) => callback(filePath)),
  openPopup: () => ipcRenderer.send("open-popup"),
  openEditPopup: (device) => ipcRenderer.send("open-edit-popup", device),
  onAddRoutineRequest: (callback) => ipcRenderer.on('add-routine-request', (event) => callback()),
  onEditRoutinesRequest: (callback) => ipcRenderer.on('edit-routines-request', (event) => callback()),
  onSaveIconPositionsRequest: (callback) => ipcRenderer.on('save-icon-positions-request', (event) => callback()),
  onDeviceRemoved: (callback) => ipcRenderer.on('device-removed', (event, deviceName) => callback(deviceName)),
  onDeviceUpdated: (callback) => ipcRenderer.on('device-updated', (event, data) => callback(data)),
  onScalingModeChange: (callback) => ipcRenderer.on('set-scaling-mode', (event, mode) => callback(mode)),
  onDiscoverDevicesRequest: (callback) => ipcRenderer.on('discover-devices-request', (event) => callback()),
  onToggleScalingControls: (callback) => ipcRenderer.on('toggle-scaling-controls', (event) => callback())
});

// Expose 'electronAPI' with OnDeviceAdd
contextBridge.exposeInMainWorld("electronAPI", {
  OnDeviceAdd: (callback) => ipcRenderer.on('device-add', (event, data) => callback(data)),
  loadAllDevices: () => ipcRenderer.invoke('load-all-devices')
});

// Expose deviceAPI for popup.js
contextBridge.exposeInMainWorld("deviceAPI", {
  addDevice: (device) => ipcRenderer.send('add-device', device),
  checkDeviceStatus: (device) => ipcRenderer.invoke('check-device-status', device),
  controlDeviceRelay: (device, turnOn) => ipcRenderer.invoke('control-device-relay', device, turnOn),
  testConnectivity: (device) => ipcRenderer.invoke('test-device-connectivity', device),
  removeDevice: (deviceName) => ipcRenderer.invoke('remove-device', deviceName),
  updateDevice: (oldDeviceName, updatedDevice) => ipcRenderer.invoke('update-device', oldDeviceName, updatedDevice),
  discoverDevices: () => ipcRenderer.invoke('discover-devices')
});

// Expose icon position and routine APIs
contextBridge.exposeInMainWorld("projectAPI", {
  saveIconPositions: (positions) => ipcRenderer.invoke('save-icon-positions', positions),
  loadIconPositions: () => ipcRenderer.invoke('load-icon-positions'),
  saveRoutines: (routines) => ipcRenderer.invoke('save-routines', routines),
  loadRoutines: () => ipcRenderer.invoke('load-routines'),
  getRoutines: () => ipcRenderer.invoke('get-routines'),
  addRoutine: (routine) => ipcRenderer.invoke('add-routine', routine),
  updateRoutine: (routineId, updates) => ipcRenderer.invoke('update-routine', routineId, updates),
  removeRoutine: (routineId) => ipcRenderer.invoke('remove-routine', routineId)
});