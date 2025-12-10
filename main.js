
const { app, BrowserWindow,dialog,ipcMain,shell, Menu } = require('electron/main');
const path = require('path');
const fs = require('fs');
const fsPromise = fs.promises;

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
  console.log('Current devices:', devices);
  devices.push(device);
  console.log('Updated devices:', devices);
  writeDevices(devices);
  console.log('Device written to file');
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
  // Example device data - replace with actual device detection logic
  const newDevices = [
    {
      name: "Smart Light",
      ip: "192.168.1.100", 
      type: "Light"
    }
  ];
  
  // Send device data to renderer process
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send('device-add', newDevices);
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
          onDeviceAdd();
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
    frame: true,             // set false for frameless popup
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