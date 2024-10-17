var user_Name = "";
var user_Username = "";
var profile_id = gup("id", window.location.href);
var isProfile = window.location.href.split("/")[3].startsWith("profile");
var dbInstance;

async function isLoggedIn(){
	return typeof localStorage.user_id == "undefined";
}

async function removeSession(){
	localStorage.removeItem("session");
	localStorage.removeItem("user_id");
}

async function fulfillProfile(){
		try{
			let target_id = localStorage.user_id;
			let cacheOn = true;
			if(isProfile){
				target_id = profile_id;
				cacheOn = false;
			}
			let userJson = await tellweb.getUserProfile(target_id);
			if(userJson == "state.USER_INVALID"){
				getTargetGroup();
				return true;
			}
			userJson = JSON.parse(userJson);
			user_Name = escape(userJson["name"]);
			user_Username = escape(userJson["username"]);
			document.getElementById("name").innerText = user_Name;
			document.getElementById("username").innerText = "@" + user_Username;
			if(userJson["profile_photos"].length){
				let fileUrl = await getCachedProfilePhoto(dbInstance, userJson["profile_photos"][0]["url"]);
				document.getElementById("profile-photo").src = fileUrl;
			}
			if(cacheOn){
				await addDatabaseData(dbInstance, {name: unescape(user_Name), username: unescape(user_Username)}, 1);
			}
		}catch(e){
			console.error(e);
		}
}

async function getTargetGroup(){
	let currentChat = await tellweb.getChatInfo(profile_id);
	currentChat = JSON.parse(currentChat);
	document.getElementById("name").innerText = currentChat["title"];
	document.getElementById("username").innerText = currentChat["username"];
	document.getElementById("description").innerText = "About: " + currentChat["description"];
}

async function newProfilePhoto(){
	var input = document.createElement('input');
	input.type = 'file';
	input.onchange = function(e){
		var file = e.target.files[0];
		var reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = async function(readerEvent){
			var content = readerEvent.target.result.split(";base64,")[1];
			if(confirm("Upload selected profile photo?")){
				let photo_url = await tellweb.uploadProfilePhoto(content);
				setCachedProfilePhoto(dbInstance, base64Decode(content), photo_url);
				await tellweb.setProfilePhoto(photo_url);
				let fileUrl = await getCachedProfilePhoto(dbInstance, photo_url);
				document.getElementById("profile-photo").src = fileUrl;
			}
		}
	}
	input.click();
}

async function whenLoaded(){
		let notLoggedIn = await isLoggedIn();
		if(notLoggedIn){
			window.location.href = window.location.origin;
		}
		dbInstance = await openDatabaseInstance();
		let profileData = await getDatabaseData(dbInstance, 1);
		if(profileData){
			user_Name = escape(profileData["name"]);
			user_Username = escape(profileData["username"]);
		}
		document.getElementById("username").innerText = "@" + user_Username;
		document.getElementById("name").innerText = user_Name;
		document.getElementById("chat_settings").onclick = function (e) {
			window.location.href = window.location.origin + "/settings/chats";
		};
		let oc = document.getElementById("openChat");
		oc.innerHTML = "Open chat";
		oc.href = "/chat?id=" + profile_id;
		if(isProfile){
			document.getElementById("addProfilePhoto").style.visibility = "hidden";
			document.getElementById("chat_settings").style.visibility = "hidden";
			document.getElementById("changeName").style.visibility = "hidden";
			document.getElementById("chatSettingsText").style.visibility = "hidden";
			document.getElementById("settingsItem1").style.visibility = "hidden";
		}
		document.getElementById("changeNameBtn").onclick = async function (e) {
			let newName = prompt("Enter your new name:", unescape(user_Name));
			if(newName != ""){
				let response = await tellweb.setUserName(newName);
				if(response == "state.NAME_CHANGED"){
					user_Name = escape(newName);6
					document.querySelector("#name").innerText = user_Name;
					await addDatabaseData(dbInstance, {name: unescape(user_Name), username: unescape(user_Username)}, 1);
				}
			}
		};
		document.getElementById("username").onclick = async function(e) {
			let newUsername = prompt("Enter your new username:", unescape(user_Username));
			if(newUsername != ""){
				let response = await tellweb.setUserUsername(newUsername);
				if(response == "state.USERNAME_CHANGED"){
					user_Username = escape(newUsername);
					document.querySelector("#username").innerText = user_Username;
					await addDatabaseData(dbInstance, {name: unescape(user_Name), username: unescape(user_Username)}, 1);
				}
			}
		};
		document.getElementById("addProfilePhoto").onclick = function (e) {
			newProfilePhoto();
		};
		await fulfillProfile();
}

if(window.addEventListener){
	window.addEventListener('load', whenLoaded, false);
}else{
	window.attachEvent('onload', whenLoaded);
}