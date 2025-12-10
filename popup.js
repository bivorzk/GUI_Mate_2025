document.querySelector('form').addEventListener('submit', (event) => {
	event.preventDefault();
	const name = document.getElementById('deviceName').value.trim();
	const type = document.getElementById('deviceType').value.trim();
	const ip = document.getElementById('deviceIP').value.trim();

	if (!name || !type || !ip) {
		alert('Please fill in all fields.');
		return;
	}

	// Send device data to main process
	console.log('Sending device data:', { name, type, ip });
	window.deviceAPI.addDevice({ name, type, ip });
	alert('Device added!');
	document.querySelector('form').reset();
});
