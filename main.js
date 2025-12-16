

const { app, BrowserWindow,dialog,ipcMain,shell, Menu } = require('electron/main');
const path = require('path');
const fs = require('fs');
const fsPromise = fs.promises;

// Expose a handler to load all devices for renderer
ipcMain.handle('load-all-devices', async () => {
  try {
    return readDevices();
  } catch (e) {
    return [];
  }
});
// --- Icon positions save/load ---
ipcMain.handle('save-icon-positions', async (event, positions) => {
  try {
    const posFile = path.join(__dirname, 'icon_positions.json');
    fs.writeFileSync(posFile, JSON.stringify(positions, null, 2), 'utf-8');
    return { success: true };
  } catch (e) {
    console.error('Error saving icon positions:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('load-icon-positions', async () => {
  try {
    const posFile = path.join(__dirname, 'icon_positions.json');
    if (fs.existsSync(posFile)) {
      const data = fs.readFileSync(posFile, 'utf-8');
      return JSON.parse(data);
    }
    return {};
  } catch (e) {
    console.error('Error loading icon positions:', e);
    return {};
  }
});

// --- Routine save/load (stubs) ---
ipcMain.handle('save-routines', async (event, routines) => {
  try {
    const file = path.join(__dirname, 'routines.json');
    fs.writeFileSync(file, JSON.stringify(routines, null, 2), 'utf-8');
    return { success: true };
  } catch (e) {
    console.error('Error saving routines:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('load-routines', async () => {
  try {
    const file = path.join(__dirname, 'routines.json');
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (e) {
    console.error('Error loading routines:', e);
    return [];
  }
});

// Path to devices.json
const devicesFile = path.join(__dirname, 'devices.json');

// Helper to read devices.json
function readDevices() {
  try {
    if (fs.existsSync(devicesFile)) {
      const data = fs.readFileSync(devicesFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) { console.error(e); }
  return [];
}

// Helper to write devices.json
function writeDevices(devices) {
  try {
    fs.writeFileSync(devicesFile, JSON.stringify(devices, null, 2), 'utf-8');
  } catch (e) { console.error(e); }
}

// Listen for add-device from popup
ipcMain.on('add-device', (event, device) => {
  console.log('Received add-device event:', device);
  const devices = readDevices();
  devices.push(device);
  writeDevices(devices);
  console.log('Device written to file');
  // Notify all renderer windows to add device button
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(win => {
    win.webContents.send('device-add', [device]);
  });
});

let mainWindow;
let popupWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile('index.html')
 
}

// Function to handle adding new devices
function onDeviceAdd() {
  // Example device for menu action
  const newDevice = {
    name: "Smart Light",
    ip: "192.168.1.100",
    type: "Light"
  };
  // Save to devices.json
  const devices = readDevices();
  devices.push(newDevice);
  writeDevices(devices);
  // Notify renderer to add device button
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send('device-add', [newDevice]);
  }

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
          createPopup();
          // After popup closes and device is added, save icon positions in renderer
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            windows[0].webContents.send('save-icon-positions-request');
          }
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


function createPopup() {
  popupWindow = new BrowserWindow({
    width: 300,
    height: 400,
    parent: mainWindow,      // keeps popup on top
    modal: true,             // locks parent window until closed
    show: false,             // hide until ready
    autoHideMenuBar: true,             // set false for frameless popup
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  popupWindow.loadFile("popup.html");

  popupWindow.once("ready-to-show", () => {
    popupWindow.show();
  });
}


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
		},
  {
      label: 'information',
      click: () => { 
        DeviceInfo();
        shell.openExternal('https://example.com'); 
      }

    }
	]);
  
	menu.popup({
    window: BrowserWindow.fromWebContents(event.sender)
  });

});

  ipcMain.on("open-popup", () => {
    createPopup();
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