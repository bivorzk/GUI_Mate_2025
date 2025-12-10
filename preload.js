const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  showContextMenu: () => ipcRenderer.send("show-context-menu"),
  onSetBackgroundImage: (callback) => ipcRenderer.on('set-background-image', (event, filePath) => callback(filePath))
});