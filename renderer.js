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

  data.forEach(device => {
	const deviceList = document.getElementById('device-list');
	const listItem = document.createElement('li');
	listItem.textContent = `Device Name: ${device.name}, IP: ${device.ip}, Status: ${device.status}, Other info : ${device.otherInfo}`;	 
	deviceList.appendChild(listItem);
  });

}));

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
});
