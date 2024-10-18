async function getChatType(){
	let tp = Array.from(document.getElementsByName("type")).find(function(radio) {
			return radio.checked;
		}
	).value;
	if(tp == "0"){
		return "group";
	}else{
		return "channel";
	}
}

async function createChat(){
	let chatType = await getChatType();
	let hasPassword = document.getElementById("hasPass").checked.toString();
	let response = await tellweb.createChat(document.getElementById("title").value, document.getElementById("username").value, document.getElementById("about").value, chatType, hasPassword, document.getElementById("password").value);
	if(response == "state.CHAT_CREATED"){
		window.location.href = window.location.origin + "/chats";
	}else{
		document.getElementById("status").innerHTML = "Error: " + response;
	}
}

async function whenLoaded(){
	document.getElementById('hasPass').onchange = function() {
		document.getElementById('password').disabled = !this.checked;
	};
	document.getElementById("newChat").onclick = function() {
		createChat();
	};
}

if(window.addEventListener){
	window.addEventListener('load', whenLoaded, false);
}else{
	window.attachEvent('onload', whenLoaded);
}