
const { contextBridge, ipcRenderer } = require("electron");

// Expose 'api' as before
contextBridge.exposeInMainWorld("api", {
  showContextMenu: () => ipcRenderer.send("show-context-menu"),
  onSetBackgroundImage: (callback) => ipcRenderer.on('set-background-image', (event, filePath) => callback(filePath)),
  openPopup: () => ipcRenderer.send("open-popup")
});

// Expose 'electronAPI' with OnDeviceAdd
contextBridge.exposeInMainWorld("electronAPI", {
  OnDeviceAdd: (callback) => ipcRenderer.on('device-add', (event, data) => callback(data))
});

// Expose deviceAPI for popup.js
contextBridge.exposeInMainWorld("deviceAPI", {
  addDevice: (device) => ipcRenderer.send('add-device', device)
});