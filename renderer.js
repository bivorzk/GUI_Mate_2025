// Listen for background image set from main process
window.api.onSetBackgroundImage((filePath) => {
  document.body.style.backgroundImage = `url('${filePath}')`;
});

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  
  const btn = document.getElementById('btn');
  if (e.target === btn || btn.contains(e.target)) {
    window.api.showContextMenu();
  }
});


// Add new devices to the device list
window.electronAPI.OnDeviceAdd((data => {
	console.log("Device added:", data);
	window.api.openPopup();
	data.forEach(device => {
		const deviceList = document.getElementById('device-list');
		const listItem = document.createElement('li');
		listItem.textContent = `Device Name: ${device.name}, IP: ${device.ip}, Device Type: ${device.type}`;   
		deviceList.appendChild(listItem);
	});
}));

// Listen for 'create-device-button' event and add a button to the screen
window.api.onCreateDeviceButton = (callback) => {
	window.api._createDeviceButtonHandler = (event, device) => callback(device);
	window.api._createDeviceButtonListener = window.api._createDeviceButtonListener || ((event, device) => window.api._createDeviceButtonHandler(event, device));
	window.api._ipcRenderer = window.api._ipcRenderer || require('electron').ipcRenderer;
	window.api._ipcRenderer.on('create-device-button', window.api._createDeviceButtonListener);
};

// Register the handler to add a button for each device
window.api.onCreateDeviceButton((device) => {
	const container = document.getElementById('device-buttons') || document.body;
	const btn = document.createElement('button');
	btn.textContent = device.name;
	btn.onclick = () => {
		alert(`Device: ${device.name}\nIP: ${device.ip}\nType: ${device.type}`);
	};
	container.appendChild(btn);
});

window.addEventListener('DOMContentLoaded', () => {
	const btn = document.getElementById('btn');
	const state = btn.dataset.state;
	if (state == "ON"){
		btn.style.backgroundColor = "green";
	}else if (state == "OFF"){
		btn.style.backgroundColor = "red";
	}else {
		btn.style.backgroundColor = "gray";
	}
	
	// Simple drag functionality for the button
	let isDragging = false;
	let startX = 0;
	let startY = 0;
	let elementX = 0;
	let elementY = 0;

	console.log("Setting up drag for button:", btn);

	btn.addEventListener("mousedown", (e) => {
	  console.log("Mouse down on button");
	  isDragging = true;
	  startX = e.clientX;
	  startY = e.clientY;
	  
	  // Get current position of the button
	  const rect = btn.getBoundingClientRect();
	  elementX = rect.left;
	  elementY = rect.top;
	  
	  e.preventDefault();
	});

	document.addEventListener("mousemove", (e) => {
	  if (!isDragging) return;
	  
	  console.log("Mouse moving, dragging");
	  
	  // Calculate new position
	  const deltaX = e.clientX - startX;
	  const deltaY = e.clientY - startY;
	  
	  const newX = elementX + deltaX;
	  const newY = elementY + deltaY;
	  
	  btn.style.left = newX + "px";
	  btn.style.top = newY + "px";
	});

	document.addEventListener("mouseup", () => {
	  if (isDragging) {
		console.log("Mouse up, stopping drag");
		isDragging = false;
	  }
	});
});
