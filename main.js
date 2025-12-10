const { app, BrowserWindow,dialog,ipcMain,shell } = require('electron/main')
const path = require('path')
const fs = require('fs')
const fsPromise = fs.promises;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')
 
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
 });

 ipcMain.handle('select-background-image', async (event) => {
   const result = await dialog.showOpenDialog({
     properties: ['openFile'],
     filters: [
       { name: 'Select picture', extensions: ['jpg'] }
     ]
   });
   if (result.canceled || result.filePaths.length === 0) {
     return null;
   }
   return result.filePaths[0];
 });