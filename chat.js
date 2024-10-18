var dbInstance;
var msgOffset = -1;
var msgAmount = 0;
var msgIds = [];
var msgObjs = [];
var downloadQueue = [];
var messageMap = {};
var currentUser = {};
var user_id = gup("id", window.location.href);
var SUPPORTED_MESSAGE_TYPES = ["text_msg", "file"];
var chatType = "private";
var firstExecution = true;
var loadedFiles = {};
var strmessages = "";
var lastLoaded = 14;

async function isLoggedIn(){
	return typeof localStorage.user_id == "undefined";
}

async function removeSession(){
	localStorage.removeItem("session");
	localStorage.removeItem("user_id");
}

async function loadingBarHidden(isHidden){
	document.getElementById("loadingBar").style.display = isHidden ? "none" : "flex";
}

function listMessages(){
	Object.values = Object.values || function(o){return Object.keys(o).map(function(k){return o[k]})};
	let messageKeyMap = Object.values(messageMap);
	let changed = 0;
	let messages = "";
	for(let i = 0; i < messageKeyMap.length; i++){
		let key = messageKeyMap[i];
		messages += key;
		if(!strmessages.includes(key)){
			changed++;
		}
	}
	if(messages != strmessages){
		strmessages = messages;
	}
	if(changed > 0){
		strmessages += "<br>"
		let e = document.getElementById("messages");
		e.innerHTML = strmessages;
		let messagesl = e.getElementsByClassName("message");
		for(let i = 0; i < messagesl.length; i++){
			messagesl[i].addEventListener("click", function(){
				messageActionDialog(messagesl[i]);
			});
		}
		if((window.innerHeight + window.pageYOffset + 20) >= document.body.offsetHeight){
			await scrollToBottom();
		}
	}
}

async function getTargetGroup(){
		try{
			try{ await swapKeysGroup(); }catch(e){console.error(e)}
			loadChatProfilePhoto();
			currentUser = await tellweb.getChatInfo(user_id);
			currentUser = JSON.parse(currentUser);
			let userCount = await tellweb.getChatUsersCount(user_id);
			let userCounter = " (" + userCount + " user";
			if(parseInt(userCount) > 1){
				userCounter += "s";
			}
			userCounter += ")";
			document.getElementById("chatName").innerText = currentUser["title"] + userCounter;
		}catch(e){
			console.error(e);
		}
}

async function getTargetUser(){
		try{
			let userData = await getDatabaseData(dbInstance, 3);
			if(userData == ""){
				userData = {};
			}
			if(!userData[user_id]){
				currentUser = await tellweb.getUserProfile(user_id);
				currentUser = JSON.parse(currentUser);
				let cache = {};
				cache[user_id] = currentUser;
				await addDatabaseData(dbInstance, cache, 3);
			}else{
				currentUser = userData[user_id];
			}
			try{
				if(currentUser["name"]){
					document.getElementById("chatName").innerText = currentUser["name"];
				}
			}catch(e){
				console.error("Error occured when loading name: " + e);
			}
			swapKeysPrivate();
			if(currentUser["profile_photos"]){
				loadProfilePhoto(currentUser["profile_photos"][0]["url"]);
			}
		}catch(e){
			if(currentUser == "state.USER_INVALID"){
				chatType = "group";
				getTargetGroup();
			}
			console.error(e);
		}
}

async function loadProfilePhoto(photoUrl){
	let photo = await getCachedProfilePhoto(dbInstance, photoUrl);
	if(photo){
		document.getElementById("profile_photo").src = photo;
	}
}


async function loadChatProfilePhoto(){
	let photos = await tellweb.getProfilePhotos(user_id);
	if(photos != "state.PHOTOS_EMPTY"){
		photos = JSON.parse(photos)["photos"][0]["url"];
		let fileUrl = await getCachedProfilePhoto(dbInstance, photos);
		document.getElementById("profile_photo").src = fileUrl;
	}
}

async function scrollToBottom(){
	let e = document.getElementById("messages");
	e.scrollTo(0, e.scrollHeight);
	e.scrollTop = e.scrollHeight;
}

async function addMessageBefore(data, msg_id){
	if(!msgObjs.includes(msg_id)){
		document.getElementById("messages").insertAdjacentHTML("beforeBegin", data);
		msgObjs.push(msg_id);
		listMessages();
	}
}

async function saveBlob(blobLink, msg_id){
	let blobs = await getDatabaseData(dbInstance, 4);
	if(blobs == ""){
		let b = {};
		b[user_id + "_" + msg_id] = blobLink;
		await addDatabaseData(dbInstance, b, 4);
	}else{
		blobs[user_id + "_" + msg_id] = blobLink;
		await addDatabaseData(dbInstance, blobs, 4);
	}
}

async function getBlob(msg_id){
	let d = await getDatabaseData(dbInstance, 4);
	if(d == ""){
		return false;
	}else{
		return d[user_id + "_" + msg_id];
	}
}

function isPhoto(flLink){
		const types = ["png", "jpeg", "webp", "jpg", "gif"];
		for(let i = 0; i < types.length; i++){
			if(flLink.endsWith(types[i])){
				return true;
			}
		}
		return false;
}

function isVideo(flLink){
		const types = ["mp4", "webm", "avi", "mpeg", "ogv", "mpg", "mp2", "mpe", "mpv", "m2v", "mov"];
		for(let i = 0; i < types.length; i++){
			if(flLink.endsWith(types[i])){
				return true;
			}
		}
		return false;
}

function isAudio(flLink){
		const types = ["mp3", "aa", "m4a", "m4b", "m4p", "opus", "wav", "ogg"];
		for(let i = 0; i < types.length; i++){
			if(flLink.endsWith(types[i])){
				return true;
			}
		}
		return false;
}

function getMimeType(fileFormat){
		if(isPhoto(fileFormat)){
			return "image/" + fileFormat;
		}
		if(isVideo(fileFormat)){
			return "video/" + fileFormat;
		}
		if(isAudio(fileFormat)){
			return "audio/" + fileFormat;
		}
		return "application/octet-stream";
}

async function setQueue(fileUri, chatKey){
		let flData = await tellweb.UnencryptedGetRequest(fileUri);
		flData = new Uint8Array(await decryptAESGCM(base64Decode(flData), chatKey));
		saveBlob(flData, fileUri);
}

async function checkQueue(fileUri, chatKey){
		let data = await getBlob(fileUri);
		if(downloadQueue.includes(fileUri) || data){
			return await getBlob(fileUri);
		}else{
			downloadQueue.push(fileUri);
			setQueue(fileUri, chatKey);
			return false;
		}
}

async function loadMessagesPrivate(reversed=false, updateLastMessages=false, loadMore=false){
		let msgs = [];
		let amount = msgAmount;
		let offset = msgOffset;
		if(loadMore){
			amount = lastLoaded;
			lastLoaded += 14;
			offset = -lastLoaded;
		}
		if(updateLastMessages){
			msgs = await tellweb.getMessages(user_id, -1, 28);
		}else{
			msgs = await tellweb.getMessages(user_id, offset, -amount * 2);
		}
		try{
			msgs = JSON.parse(msgs)["msgs"];
			if(msgs == null){
				msgOffset = -1;
			}
			let keysMap = await getDatabaseData(dbInstance, 2);
			let chatKey;
			if(keysMap != ""){
				chatKey = base64Decode(keysMap[user_id].trim());
			}
			for(let i = 0; i < msgs.length; i++){
				try{
				let message = new chats();
				let message2 = new chats();
				message.msg_id = msgs[i]["msg_id"];
				message2.msg_id = msgs[i]["msg_id"];
				let builtMessage = "";
				let templateMessage = "";
				if(chatType == "private"){
					if(msgs[i]["type"] == "text_msg"){
						let encryptedData = msgs[i]["cipherdata"];
						let cdata = await decryptAESGCM(base64Decode(encryptedData), chatKey);
						cdata = safeTextDecoder(cdata).split(":");
						let aesKey = base64Decode(cdata[0]);
						let hmacKey = base64Decode(cdata[1]);
						let dataIV = base64Decode(cdata[2]);
						text = escape(pkcs5Unpad(await decryptData(msgs[i]["text"], aesKey, dataIV, hmacKey))).trim();
						let isEdited = false;
						if(msgs[i]["edit"] == "true"){
							isEdited = true;
						}
						builtMessage = message.buildMessage(text, timestampToDate(msgs[i]["date"]), JSON.parse(msgs[i]["read"]), msgs[i]["from"] === localStorage.user_id, isEdited);
					}
					if(msgs[i]["type"] == "file"){
						let encryptedData = msgs[i]["cipherdata"];
						let fileEncryptedData = msgs[i]["flcipher"];
						let cdata1 = safeTextDecoder(await decryptAESGCM(base64Decode(encryptedData), chatKey)).split(":");
						let cdata2 = safeTextDecoder(await decryptAESGCM(base64Decode(fileEncryptedData), chatKey)).split(":");
						let aesKey = base64Decode(cdata1[0]);
						let hmacKey = base64Decode(cdata1[1]);
						let dataIV = base64Decode(cdata1[2]);
						let flText = escape(pkcs5Unpad(await decryptData(msgs[i]["text"], aesKey, dataIV, hmacKey))).trim();
						aesKey = base64Decode(cdata2[0]);
						hmacKey = base64Decode(cdata2[1]);
						dataIV = base64Decode(cdata2[2]);
						let flLink = escape(await decryptData(msgs[i]["file_uri"], aesKey, dataIV, hmacKey)).trim();
						if(flLink.split("/")[2] != "twcdn.pythonanywhere.com"){
							continue;
						}
						let flName = flLink.split("/")[3];
						let flFormat = flName.substring(flName.lastIndexOf(".")).replace(".", "").toLowerCase();
						let fileUrl = "";
						let flCache = await checkQueue(flLink, chatKey);
						let mimeType = getMimeType(flFormat);
						if(flCache){
							if(loadedFiles[flLink]){
								fileUrl = loadedFiles[flLink];
							}else{
								let blob = new Blob([flCache], {type: mimeType});
								fileUrl = URL.createObjectURL(blob);
								loadedFiles[flLink] = fileUrl;
							}
						}
						let isEdited = false;
						if(msgs[i]["edit"] == "true"){
							isEdited = true;
						}
						builtMessage = message.buildImageMessage("FILE." + flFormat + "\n" + flText, fileUrl, timestampToDate(msgs[i]["date"]), JSON.parse(msgs[i]["read"]), msgs[i]["from"] === localStorage.user_id, isEdited, mimeType, flFormat);
					}
				}
				if(chatType == "group"){
					if(msgs[i]["type"] == "text_msg"){
						let encryptedText = decodeDoubleB64(msgs[i]["text"]);
						text = escape(new TextDecoder().decode(await decryptAESGCM(encryptedText, chatKey)));
						let is_read = false;
						if(typeof msgs[i]["read"] == "string"){
							is_read = JSON.parse(msgs[i]["read"]);
						}
						builtMessage = message.buildMessage(text, timestampToDate(msgs[i]["date"]), is_read, msgs[i]["from"] === localStorage.user_id, false, msgs[i]["name"]);
					}
					if(msgs[i]["type"] == "file"){
						let flUri = escape(new TextDecoder().decode(await decryptAESGCM(decodeDoubleB64(msgs[i]["file_uri"]), chatKey)));
						let flText = escape(new TextDecoder().decode(await decryptAESGCM(decodeDoubleB64(msgs[i]["text"]), chatKey)));
						if(flUri.split("/")[2] != "twcdn.pythonanywhere.com"){
							continue;
						}
						let flName = flUri.split("/")[3];
						let flFormat = flName.substring(flName.lastIndexOf(".")).replace(".", "").toLowerCase();
						let fileUrl = "";
						let mimeType = getMimeType(flFormat);
						let flCache = await checkQueue(flUri, chatKey);
						if(flCache){
							if(loadedFiles[flUri]){
								fileUrl = loadedFiles[flUri];
							}else{
								let blob = new Blob([flCache], {type: mimeType});
								fileUrl = URL.createObjectURL(blob);
								loadedFiles[flUri] = fileUrl;
							}
						}
						let is_read = false;
						if(typeof msgs[i]["read"] == "string"){
							is_read = JSON.parse(msgs[i]["read"]);
						}
						builtMessage = message.buildImageMessage("FILE." + flFormat + "\n" + flText, fileUrl, timestampToDate(msgs[i]["date"]), is_read, msgs[i]["from"] === localStorage.user_id, false, mimeType, flFormat);
					}
				}
				text = "";
				if(!SUPPORTED_MESSAGE_TYPES.includes(msgs[i]["type"])){
					text = "Unsupported message";
					builtMessage = message.buildMessage(text, timestampToDate(msgs[i]["date"]), JSON.parse(msgs[i]["read"]), msgs[i]["from"] === localStorage.user_id);
				}
				messageMap[msgs[i]["msg_id"].toString()] = builtMessage;
				text = "";
				}catch(e){
					console.error(e);
				}
			}
			listMessages();
			msgAmount += 28;
			msgOffset = -msgAmount;
			if(!reversed){
				await scrollToBottom();
			}
			document.getElementById("loadMore").style.visibility = "visible";
		}catch(e){
			console.error(e);
			if(msgs != "0"){
				document.getElementById("loadMore").style.visibility = "visible";
			}
		}
}

async function encryptPrivateTextMessage(text){
	let cipherdata = generateCipherdata();
	let keys = cipherdata.split(":");
	let aesKey = base64Decode(keys[0]);
	let hmacKey = base64Decode(keys[1]);
	let dataIV = base64Decode(keys[2]);
	let keysMap = await getDatabaseData(dbInstance, 2);
	let mainKey = base64Decode(keysMap[user_id].trim());
	let encryptedData = await encryptAESGCM(cipherdata, mainKey);
	encryptedData = btoa(String.fromCharCode(...encryptedData));
	let encryptedText = await encryptData(new TextEncoder().encode(text), aesKey, dataIV, hmacKey);
	return {"text": encryptedText, "cdata": encryptedData};
}

async function encryptGroupTextMessage(text){
	let keysMap = await getDatabaseData(dbInstance, 2);
	let mainKey = base64Decode(keysMap[user_id].trim());
	let encryptedText = await encryptAESGCM(text, mainKey);
	encryptedText = btoa(String.fromCharCode(...encryptedText));
	encryptedText = btoa(encryptedText);
	return encryptedText;
}

async function encryptFileData(fileData){
	let keysMap = await getDatabaseData(dbInstance, 2);
	let mainKey = base64Decode(keysMap[user_id].trim());
	return btoa(String.fromCharCode(...await encryptAESGCM(fileData, mainKey, true)));
}

async function sendFile(fileData, fileFormat){
	let file = await encryptFileData(fileData);
	let cdns = await getDatabaseData(dbInstance, 23);
	if(!cdns["usedCdn"]){
		cdns = {"usedCdn": "https://twcdn.pythonanywhere.com"};
		await addDatabaseData(dbInstance, cdns, 23);
	}
	return await tellweb.UnencryptedPostRequest(cdns["usedCdn"], "/uploadDocument", JSON.stringify({"filedata": file, "suffix": fileFormat}));
}

async function sendFileMsg(){
	let url = "";
	let textElement = document.getElementById("message");
	var input = document.createElement('input');
	input.type = 'file';
	input.onchange = function(e){
		var file = e.target.files[0];
		var reader = new FileReader();
		reader.readAsArrayBuffer(file);
		reader.onload = async function(readerEvent){
			let content = new Uint8Array(readerEvent.target.result);
			if(!confirm("Upload selected file?")){
				return;
			}
			url = await sendFile(content, input.files[0].type.split("/")[1]);
			if(url){
				if(chatType == "private"){
					let fileData = await encryptPrivateTextMessage(url);
					let textData = await encryptPrivateTextMessage(textElement.value);
					await tellweb.sendFile(user_id, fileData["text"], textData["text"], fileData["cdata"], textData["cdata"]);
				}else{
					let fileUri = await encryptGroupTextMessage(url);
					let encryptedText = await encryptGroupTextMessage(textElement.value);
					await tellweb.sendFile(user_id, fileUri, encryptedText);
				}
				textElement.value = "";
			}
		}
	}
	input.click();
}

async function sendFileHandler(){
	setTimeout(sendFileMsg, 900);
}

async function sendTextMessage(){
		let e = document.getElementById("message");
		let text = e.value.trim();
		if(text != ""){
			e.value = "";
			await loadingBarHidden(false);
			await scrollToBottom();
			let msgData = await encryptPrivateTextMessage(text);
			tellweb.sendMessage(user_id, msgData["text"], msgData["cdata"]);
			loadMessagesPrivate(false, true);
			await loadingBarHidden(true);
		}
}

async function sendGroupTextMessage(){
		let e = document.getElementById("message");
		let text = e.value.trim();
		if(text != ""){
			e.value = "";
			await loadingBarHidden(false);
			await scrollToBottom();
			let encryptedText = await encryptGroupTextMessage(text);
			tellweb.sendMessage(user_id, encryptedText);
			loadMessagesPrivate(false, true);
			await loadingBarHidden(true);
		}
}

async function sendTextMessageHandler(){
	if(chatType == "private"){
		setTimeout(sendTextMessage, 0);
	}else{
		setTimeout(sendGroupTextMessage, 0);
	}
}

async function sendMessage(){
	setTimeout(sendTextMessageHandler(), 1000);
}

async function loadMoreHandler(){
	document.getElementById("loadMore").style.visibility = "hidden";
	await loadMessagesPrivate(true, false, true);
}

async function swapKeysPrivate(){
		let keysMap = await getDatabaseData(dbInstance, 2);
		if(keysMap){
			await tellweb.createDialog(user_id);
			let isInit = await tellweb.isInitiator(user_id);
			if(isInit == "true"){
				let chatKey = keysMap[user_id];
				if(!chatKey){
					chatKey = new Uint8Array(32);
					crypto.getRandomValues(chatKey);
					chatKey = btoa(String.fromCharCode(...chatKey));
				}
				await saveChats(dbInstance);
				let convInitKey = await tellweb.getInitKeyRequest(user_id);
				if(convInitKey != "state.KEY_EMPTY"){
					let encryptedData = await encryptRSA(convInitKey, chatKey);
					encryptedData = btoa(String.fromCharCode(...encryptedData));
					await tellweb.giveKey(user_id, encryptedData);
					keysMap[user_id] = chatKey;
					await addDatabaseData(dbInstance, keysMap, 2);
				}
			}else{
				let rjindael = await tellweb.getRKey(user_id);
				rjindael = base64Decode(rjindael);
				let decryptedData = await decryptRSA(localStorage.tw1_key, rjindael);
				decryptedData = new Uint8Array(decryptedData);
				keysMap[user_id] = String.fromCharCode(...decryptedData);
				await addDatabaseData(dbInstance, keysMap, 2);
			}
		}
}

async function swapKeysGroup(){
		let keysMap = await getDatabaseData(dbInstance, 2);
		if(keysMap[user_id] == null){
			let m_userType = await tellweb.getMyChatType(user_id);
			if(m_userType == "types.OWNER"){
				let chatKey = keysMap[user_id];
				if(!chatKey){
					chatKey = new Uint8Array(32);
					crypto.getRandomValues(chatKey);
					chatKey = btoa(String.fromCharCode(...chatKey));
					keysMap[user_id] = chatKey;
					await addDatabaseData(dbInstance, keysMap, 2);
				}
				await saveChats(dbInstance);
				let chatUserKeys = await tellweb.getChatUserKeys(user_id);
				chatUserKeys = chatUserKeys.split(":");
				let list1 = chatUserKeys[0];
				let list2 = chatUserKeys[1];
				let userKeyList = list1.split(";");
				let userList = list2.split(";");
				let allKeys = "";
				for(let i = 0; i < userKeyList.length; i++){
					let rsaKey = userKeyList[i];
					let encData = await encryptRSA(rsaKey, chatKey);
					encData = btoa(String.fromCharCode(...encData));
					allKeys = allKeys + encData + ";";
				}
				allKeys = allKeys.substring(0, allKeys.length - 1);
				allKeys = allKeys + ":" + list2;
				await tellweb.setChatUserKeys(user_id, allKeys);
			}
			if(m_userType == "types.ADMIN" || m_userType == "types.USER"){
				let tKey = await tellweb.getMyChatKey(user_id);
				if(tKey != "state.KEY_EMPTY"){
					tKey = await decryptRSA(localStorage.tw1_key, base64Decode(tKey));
					keysMap[user_id] = new TextDecoder().decode(tKey);
					await addDatabaseData(dbInstance, keysMap, 2);
				}
			}
		}
}

async function bgLastMsgsLoad(){
	setInterval(loadMessagesPrivate, 1600, true, true);
}

async function Updater(){
	setTimeout(loadMessagesPrivate, true, true, 1);
	while(true){
		try{
			let needScroll = (window.innerHeight + window.pageYOffset) >= document.body.offsetHeight;
			await loadMessagesPrivate(true, true);
			if(needScroll){
				await scrollToBottom();
			}
		}catch(e){
			console.error(e);
		}
	}
}

async function displayData(){
	await loadingBarHidden(false);
	getTargetUser();
	await loadingBarHidden(true);
	document.getElementById("toolbar").addEventListener("click", async function(e){
		if(chatType == "private"){
	window.location.href = window.location.origin + "/settings?id=" + user_id;
		}else{
			window.location.href = window.location.origin + "/group?id=" + user_id;
		}
	});
	Updater();
}

async function isBottomReached(){
	setTimeout(loadMessagesPrivate, true, true, 1600);
}

async function isTopReached(){
	setTimeout(loadMessagesPrivate, true, false, 1600);
}

async function loadMessageActionDialog(){
	document.body.innerHTML += new dialogs().buildMessageActionDialog();
}

async function messageActionDialog(src_e){
	let msg_id = src_e.dataset.msgid;
	let dialog_e = document.getElementById("dialog");
	dialog_e.style.display = "block";
	document.getElementById("messages").style.pointerEvents = "none";
	document.getElementById("editBtn").onclick = async function() {
		let new_text = prompt("Enter new message: ", unescape(src_e.getElementsByClassName("message_text")[0].innerHTML));
		if(chatType == "private"){
			let msgData = await encryptPrivateTextMessage(new_text);
			tellweb.editMessage(user_id, msg_id, msgData["text"], msgData["cdata"]);
		}else{
			let msgText = await encryptGroupTextMessage(new_text);
			tellweb.editMessage(user_id, msg_id, msgText);
		}
		src_e.getElementsByClassName("message_text")[0].innerHTML = escape(new_text);
		document.getElementById("dialog").style.display = "none";
	};
	document.getElementById("deleteBtn").onclick = function() {
		if(confirm("Do you really wanna delete this message?")){
			tellweb.deleteMessage(user_id, msg_id);
			delete messageMap[msg_id];
			listMessages();
			src_e.parentNode.removeChild(src_e);
			document.getElementById("dialog").style.display = "none";
		}
	};
}

async function loadMessageHandlers(){
	let messagesl = document.getElementById("messages").getElementsByClassName("message");
	for(let i = 0; i < messagesl.length; i++){
		messagesl[i].addEventListener("click", function(){
			messageActionDialog(messagesl[i]);
		});
	}
}

async function whenLoaded(){
	let notLoggedIn = await isLoggedIn();
	if(notLoggedIn){
		window.location.href = window.location.href + "/..";
	}
	await loadMessageActionDialog();
	dbInstance = await openDatabaseInstance();
	swapKeysPrivate();
	swapKeysGroup();
	displayData();
	tellweb.readMessages(user_id);
	document.getElementById("loadMore").addEventListener("click", loadMoreHandler);
	document.getElementById("send-btn").addEventListener("click", sendMessage);
	document.getElementById("sendfile-btn").addEventListener("click", sendFileHandler);
}

if(window.addEventListener){
	window.addEventListener('load', whenLoaded, false);
}else{
	window.attachEvent('onload', whenLoaded);
}