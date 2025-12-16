

const { contextBridge, ipcRenderer } = require("electron");

// Expose 'api' as before
contextBridge.exposeInMainWorld("api", {
  showContextMenu: () => ipcRenderer.send("show-context-menu"),
  onSetBackgroundImage: (callback) => ipcRenderer.on('set-background-image', (event, filePath) => callback(filePath)),
  openPopup: () => ipcRenderer.send("open-popup")
});

// Expose 'electronAPI' with OnDeviceAdd
contextBridge.exposeInMainWorld("electronAPI", {
  OnDeviceAdd: (callback) => ipcRenderer.on('device-add', (event, data) => callback(data)),
  loadAllDevices: () => ipcRenderer.invoke('load-all-devices')
});

// Expose deviceAPI for popup.js
contextBridge.exposeInMainWorld("deviceAPI", {
  addDevice: (device) => ipcRenderer.send('add-device', device)
});

// Expose icon position and routine APIs
contextBridge.exposeInMainWorld("projectAPI", {
  saveIconPositions: (positions) => ipcRenderer.invoke('save-icon-positions', positions),
  loadIconPositions: () => ipcRenderer.invoke('load-icon-positions'),
  saveRoutines: (routines) => ipcRenderer.invoke('save-routines', routines),
  loadRoutines: () => ipcRenderer.invoke('load-routines')
});