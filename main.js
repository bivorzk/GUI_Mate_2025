const { app, BrowserWindow,dialog,ipcMain,shell, Menu } = require('electron/main')
const path = require('path')
const fs = require('fs')
const fsPromise = fs.promises;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
 
}
// Adds a menu bar with options to select background image and other settings
const menuBar = [
  {
    label: 'Settings',
    submenu: [
      { 
        label: 'Choose Background Image',
        click: async () => {
          try {
            const result = await dialog.showOpenDialog({
              properties: ['openFile'],
              filters: [
                { name: 'Select picture', extensions: ['jpg'] }
              ]
            });
            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];
              const windows = BrowserWindow.getAllWindows();
              if (windows.length > 0) {
                windows[0].webContents.send('set-background-image', filePath.replace(/\\/g, "/"));
              }
            }
          } catch (error) {
            console.error('Error selecting background image:', error);
          }
        }
      },
      { 
        label: 'Add New Device',
        click: () => {
          console.log('Add New Device clicked');
        }
      },
      {
        label: 'Save Icon Positions',
        click: () => {
          console.log('Save Icon Positions clicked');

        }
      },
      {
        label: 'Dynmaic Icon Positions',
        click: () => {
          console.log('Dynamic Icon Positions clicked');
        }
      }
    ]
  },
  {
    label: 'Rutin',
    submenu: [
      {
        label: 'Add On/Off Timer Rutin',
        click: () => {
          console.log('On/Off Timer Rutin clicked');
        }
      },
      {
        label: 'Edit Rutins',
        click: () => {
          console.log('Edit Rutins clicked');
        }
      }
    ]
  }
];

// Set the application menu
const menu = Menu.buildFromTemplate(menuBar)
Menu.setApplicationMenu(menu)


ipcMain.on('show-context-menu', (event) => {
	event.preventDefault();


	const menu = Menu.buildFromTemplate([
		{
			label: 'Option 1',
			click: () => { console.log('Option 1 clicked'); }
		},
		{
			label: 'Option 2',
			click: () => { console.log('Option 2 clicked'); }
		}
	]);
  
	menu.popup({
    window: BrowserWindow.fromWebContents(event.sender)
  });

});


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