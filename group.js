var dbInstance;
var userType = "types.USER";
var chat_id = gup("id", window.location.href);
var offset = 0;
var limit = 15;
var finishedHtml = "";
var currentUser = {};

async function loadProfilePhoto(){
	let photos = await tellweb.getProfilePhotos(chat_id);
	if(photos != "state.PHOTOS_EMPTY"){
		photos = JSON.parse(photos)["photos"][0]["url"];
		let fileUrl = await getCachedProfilePhoto(dbInstance, photos);
		document.getElementById("profilePhoto").src = fileUrl;
	}
}

async function getGroup(){
	currentUser = await tellweb.getChatInfo(chat_id);
	currentUser = JSON.parse(currentUser);
	let userCount = await tellweb.getChatUsersCount(chat_id);
	let userCounter = " (" + userCount + " user";
	if(parseInt(userCount) > 1){
		userCounter += "s";
	}
	userCounter += ")";
	document.getElementById("title").innerText = currentUser["title"] + userCounter;
	document.getElementById("username").innerText = currentUser["username"];
	document.getElementById("about").innerText = "About: " + currentUser["description"];
}

async function loadHandlers(){
	userType = await tellweb.getMyChatType(chat_id);
	let response = JSON.parse(await tellweb.getChatUsers(chat_id, offset, limit));
	offset += limit;
	limit += offset
	for(let i = 0; i < response["usrs"].length; i++){
		let actionBtn = `<button data-uid="` + response['usrs'][i]['id'] + `" class="actionBtn">Actions</button>`
		finishedHtml += new chats(response["usrs"][i]["name"], response["usrs"][i]["type"], response["usrs"][i]["username"], response["usrs"][i]["id"], "", "").buildComponent() + actionBtn;
	}
	let e = document.getElementById("users");
	e.innerHTML = finishedHtml;
	let users = e.getElementsByClassName("actionBtn");
	for(let i = 0; i < users.length; i++){
		users[i].addEventListener("click", function(){
			userActionDialog(users[i]);
		});
	}
}

async function userActionDialog(src_e){
	let userId = src_e.dataset.uid;
	document.getElementById("dialog").style.display = "block";
	document.getElementById("banBtn").addEventListener("click", async function(e){
		if(confirm("Ban user?")){
			await tellweb.chatUserAction(chat_id, userId, "ban");
		}
	});
	document.getElementById("unbanBtn").addEventListener("click", async function(e){
		if(confirm("Unban user?")){
			await tellweb.chatUserAction(chat_id, userId, "unban");
		}
	});
	document.getElementById("muteBtn").addEventListener("click", async function(e){
		if(confirm("Mute user?")){
			await tellweb.chatUserAction(chat_id, userId, "mute");
		}
	});
	document.getElementById("unmuteBtn").addEventListener("click", async function(e){
		if(confirm("Unmute user?")){
			await tellweb.chatUserAction(chat_id, userId, "unmute");
		}
	});
}

async function setChatPhoto(){
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
				await tellweb.setChatProfilePhoto(chat_id, photo_url);
				let fileUrl = await getCachedProfilePhoto(dbInstance, photo_url);
				document.getElementById("profilePhoto").src = fileUrl;
			}
		}
	}
	input.click();
}

async function setChatThumbnail(){
	var input = document.createElement('input');
	input.type = 'file';
	input.onchange = function(e){
		var file = e.target.files[0];
		var reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = async function(readerEvent){
			var content = readerEvent.target.result.split(";base64,")[1];
			if(confirm("Upload selected photo as thumbnail?")){
				let photo_url = await tellweb.uploadProfilePhoto(content);
				setCachedProfilePhoto(dbInstance, base64Decode(content), photo_url);
				await tellweb.setChatThumbnail(chat_id, photo_url);
				let fileUrl = await getCachedProfilePhoto(dbInstance, photo_url);
				document.getElementById("bgThumb").style.backgroundImage = `url("` + fileUrl + `")`;
			}
		}
	}
	input.click();
}

async function loadChatThumbnail(){
	let response = await tellweb.getChatThumbnail(chat_id);
	if(response != "state.THUMBNAIL_EMPTY"){
		response = JSON.parse(response)["thumbs"][0]["url"];
		let url = await getCachedProfilePhoto(dbInstance, response);
		document.getElementById("bgThumb").style.backgroundImage = `url("` + url + `")`;
	}
}

async function loadClickHandlers(){
	document.getElementById("title").addEventListener("click", async function(e){
		let newTitle = prompt("Enter new title", currentUser["title"]);
		await tellweb.newChatTitle(chat_id, newTitle);
		window.location.reload();
	});
	document.getElementById("username").addEventListener("click", async function(e){
		let newUsername = prompt("Enter new username", currentUser["username"]);
		await tellweb.setChatUsername(chat_id, newUsername);
		window.location.reload();
	});
	document.getElementById("about").addEventListener("click", async function(e){
		let newAbout = prompt("Enter new about", currentUser["description"]);
		await tellweb.setChatDescription(chat_id, newAbout);
		window.location.reload();
	});
	document.getElementById("setChatPhoto").addEventListener("click", setChatPhoto);
	document.getElementById("setChatThumbnail").addEventListener("click", setChatThumbnail);
}

async function whenLoaded(){
	dbInstance = await openDatabaseInstance();
	await loadProfilePhoto();
	await getGroup();
	loadClickHandlers();
	loadChatThumbnail();
	for(let i = 0; i < 5; i++){
		try{
			await loadHandlers();
		}catch(e){
			console.error(e);
		}
	}
}

if(window.addEventListener){
	window.addEventListener('load', whenLoaded, false);
}else{
	window.attachEvent('onload', whenLoaded);
}