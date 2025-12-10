const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('fileAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data)
});
