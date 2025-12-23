

const { app, BrowserWindow,dialog,ipcMain,shell, Menu } = require('electron/main');
const path = require('path');
const fs = require('fs');
const fsPromise = fs.promises;
const deviceNetwork = require('./deviceNetwork');
const RoutineManager = require('./routineManager');

// Expose a handler to load all devices for renderer
ipcMain.handle('load-all-devices', async () => {
  try {
    return readDevices();
  } catch (e) {
    return [];
  }
});

// Device status checking
ipcMain.handle('check-device-status', async (event, device) => {
  try {
    const status = await deviceNetwork.checkDeviceStatus(device);
    return { success: true, status };
  } catch (error) {
    console.error('Error checking device status:', error);
    return { success: false, error: error.message, status: 'OFFLINE' };
  }
});

// Device relay control
ipcMain.handle('control-device-relay', async (event, device, turnOn) => {
  try {
    const success = await deviceNetwork.controlDeviceRelay(device, turnOn);
    return { success };
  } catch (error) {
    console.error('Error controlling device relay:', error);
    return { success: false, error: error.message };
  }
});

// Test device connectivity
ipcMain.handle('test-device-connectivity', async (event, device) => {
  try {
    const isConnected = await deviceNetwork.testDeviceConnectivity(device);
    return { success: true, connected: isConnected };
  } catch (error) {
    console.error('Error testing device connectivity:', error);
    return { success: false, error: error.message, connected: false };
  }
});

// Device discovery
ipcMain.handle('discover-devices', async () => {
  try {
    const discoveredDevices = await deviceNetwork.discoverDevices();
    return { success: true, devices: discoveredDevices };
  } catch (error) {
    console.error('Error discovering devices:', error);
    return { success: false, error: error.message, devices: [] };
  }
});

// Device removal
ipcMain.handle('remove-device', async (event, deviceName) => {
  try {
    const devices = readDevices();
    const filteredDevices = devices.filter(device => device.name !== deviceName);
    writeDevices(filteredDevices);

    // Remove icon position
    const positions = {};
    try {
      const posData = fs.readFileSync(iconPositionsFile, 'utf-8');
      const existingPositions = JSON.parse(posData);
      Object.keys(existingPositions).forEach(key => {
        if (!key.includes(deviceName)) {
          positions[key] = existingPositions[key];
        }
      });
      fs.writeFileSync(iconPositionsFile, JSON.stringify(positions, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error updating icon positions:', error);
    }

    // Notify renderer to remove device button
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(win => {
      win.webContents.send('device-removed', deviceName);
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing device:', error);
    return { success: false, error: error.message };
  }
});

// Device editing
ipcMain.handle('update-device', async (event, oldDeviceName, updatedDevice) => {
  try {
    const devices = readDevices();
    const deviceIndex = devices.findIndex(device => device.name === oldDeviceName);

    if (deviceIndex === -1) {
      return { success: false, error: 'Device not found' };
    }

    devices[deviceIndex] = updatedDevice;
    writeDevices(devices);

    // Update icon position key if device name changed
    if (oldDeviceName !== updatedDevice.name) {
      try {
        const posData = fs.readFileSync(iconPositionsFile, 'utf-8');
        const positions = JSON.parse(posData);
        const oldKey = `btn-${oldDeviceName}`;
        const newKey = `btn-${updatedDevice.name}`;

        if (positions[oldKey]) {
          positions[newKey] = positions[oldKey];
          delete positions[oldKey];
          fs.writeFileSync(iconPositionsFile, JSON.stringify(positions, null, 2), 'utf-8');
        }
      } catch (error) {
        console.error('Error updating icon positions:', error);
      }
    }

    // Notify renderer to update device
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(win => {
      win.webContents.send('device-updated', { oldName: oldDeviceName, newDevice: updatedDevice });
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating device:', error);
    return { success: false, error: error.message };
  }
});

// --- Routine management IPC handlers ---
ipcMain.handle('get-routines', async () => {
  try {
    return { success: true, routines: routineManager.getRoutines() };
  } catch (error) {
    console.error('Error getting routines:', error);
    return { success: false, error: error.message, routines: [] };
  }
});

ipcMain.handle('add-routine', async (event, routine) => {
  try {
    const newRoutine = routineManager.addRoutine(routine);
    return { success: true, routine: newRoutine };
  } catch (error) {
    console.error('Error adding routine:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-routine', async (event, routineId, updates) => {
  try {
    const updatedRoutine = routineManager.updateRoutine(routineId, updates);
    return { success: true, routine: updatedRoutine };
  } catch (error) {
    console.error('Error updating routine:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-routine', async (event, routineId) => {
  try {
    const success = routineManager.removeRoutine(routineId);
    return { success };
  } catch (error) {
    console.error('Error removing routine:', error);
    return { success: false, error: error.message };
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
const iconPositionsFile = path.join(__dirname, 'icon_positions.json');

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

  // Add global shortcut for DevTools
  const { globalShortcut } = require('electron');
  globalShortcut.register('F12', () => {
    mainWindow.webContents.toggleDevTools();
  });
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
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] }
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
        label: 'Discover Devices',
        click: () => {
          // Send message to renderer to start device discovery
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            windows[0].webContents.send('discover-devices-request');
          }
          console.log('Discover Devices clicked');
        }
      },
      {
        label: 'Save Icon Positions',
        click: () => {
          // Send message to renderer to save icon positions
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            windows[0].webContents.send('save-icon-positions-request');
          }
        }
      },
      {
        label: 'Scaling Options',
        submenu: [
          {
            label: 'Fixed Scaling',
            type: 'radio',
            checked: true,
            click: () => {
              const windows = BrowserWindow.getAllWindows();
              if (windows.length > 0) {
                windows[0].webContents.send('set-scaling-mode', 'fixed');
              }
            }
          },
          {
            label: 'Dynamic Scaling',
            type: 'radio',
            click: () => {
              const windows = BrowserWindow.getAllWindows();
              if (windows.length > 0) {
                windows[0].webContents.send('set-scaling-mode', 'dynamic');
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Advanced Scaling Controls',
            click: () => {
              const windows = BrowserWindow.getAllWindows();
              if (windows.length > 0) {
                windows[0].webContents.send('toggle-scaling-controls');
              }
            }
          }
        ]
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: 'F12',
        click: () => {
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            windows[0].webContents.toggleDevTools();
          }
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
          // Send message to renderer to add routine
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            windows[0].webContents.send('add-routine-request');
          }
        }
      },
      {
        label: 'Edit Rutins',
        click: () => {
          // Send message to renderer to edit routines
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            windows[0].webContents.send('edit-routines-request');
          }
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

function createEditPopup(device) {
  editPopupWindow = new BrowserWindow({
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

  // Pass device data as URL parameter
  const deviceData = encodeURIComponent(JSON.stringify(device));
  editPopupWindow.loadURL(`file://${__dirname}/editPopup.html?device=${deviceData}`);

  editPopupWindow.once("ready-to-show", () => {
    editPopupWindow.show();
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

  ipcMain.on("open-edit-popup", (event, device) => {
    createEditPopup(device);
  });

// Global routine manager instance
let routineManager;

app.whenReady().then(() => {
  // Initialize routine manager
  routineManager = new RoutineManager();
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