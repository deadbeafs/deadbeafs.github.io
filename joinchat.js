var dbInstance;
var chat_id = gup("chat_id", window.location.href);

async function saveKey(value, username){
	let keyData = await getDatabaseData(dbInstance, 2);
	if(!chat_id){
		chat_id = await tellweb.getUserId(username);
	}
	if(!keyData[chat_id]){
		keyData[chat_id] = value;
		await addDatabaseData(dbInstance, keyData, 2);
	}
}

async function joinChat(){
	let inviteLink = document.getElementById("inviteCode").value;
	if(inviteLink){
		let parts = inviteLink.split("?p=");
		if(parts[1].length == 44){
			await saveKey(parts[1].trim(), parts[0]);
		}
		let response = await tellweb.joinChat(parts[0], document.getElementById("hasPass").checked, document.getElementById("password").value);
		if(response == "state.JOINED"){
			window.location.href = window.location.origin + "/chats";
		}else{
			document.getElementById("status").innerHTML = "Error joining by invite link: " + response;
		}
	}else{
		let response = await tellweb.joinChat(document.getElementById("username").value, document.getElementById("hasPass").checked, document.getElementById("password").value);
		if(response == "state.JOINED"){
			window.location.href = window.location.origin + "/chats";
		}else{
			document.getElementById("status").innerHTML = "Error: " + response;
		}
	}
}

async function whenLoaded(){
	dbInstance = await openDatabaseInstance();
	document.getElementById("username").value = gup("username", window.location.href);
	document.getElementById("hasPass").onchange = function() {
		document.getElementById('password').disabled = !this.checked;
	};
	document.getElementById("hasPass").onchange = function() {
		document.getElementById("username").disabled = this.checked;
	};
	document.getElementById("useInvite").onchange = function() {
		document.getElementById("inviteCode").disabled = !this.checked;
	};
	document.getElementById("joinBtn").addEventListener("click", async function(e) {
		joinChat();
	});
}

if(window.addEventListener){
	window.addEventListener('load', whenLoaded, false);
}else{
	window.attachEvent('onload', whenLoaded);
}