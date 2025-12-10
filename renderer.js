const { ipcRenderer } = require('electron');



window.addEventListener('DOMContentLoaded', () => {
	const btn = document.getElementById('select-bg-btn');
	if (btn) {
		btn.addEventListener('click', async () => {
			const filePath = await ipcRenderer.invoke('select-background-image');
			if (filePath) {
				document.body.style.backgroundImage = `url('${filePath.replace(/\\/g, "/")}')`;
			}
		});
	}
});

window.addEventListener('DOMContentLoaded', () => {
	const state = document.getElementById('state');
	if (state == "ON"){
		document.getElementById('btn').style = "background-color: green";
	}else if (state == "OFF"){
		document.getElementById('btn').style = "background-color: red";
	}else {
		document.getElementById('btn').style = "background-color: gray";
	}
});
