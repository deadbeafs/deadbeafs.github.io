var dbInstance;
var localCache = {};
var chatList = "";
async function isLoggedIn(){
	return typeof localStorage.user_id == "undefined";
}

function chatLink(chat_id){
	let cLink = window.location.origin + "/chat?id=" + chat_id;
	return '<a href="' + cLink + '" style="text-decoration:none">';
}

async function listChats(){
	let bulletin = await tellweb.getChats();
	let userProfiles = {};
	let elements = "";
	try{
		bulletin = JSON.parse(bulletin);
		let keysMap = await getDatabaseData(dbInstance, 2);
		console.log(bulletin);
		for(let i = 0; i < bulletin.bn.length; i++){
			try{
				let text = bulletin.bn[i]["l_msg"]["text"];
				try{
				if(bulletin.bn[i]["type"] == "private"){
					if(keysMap[bulletin.bn[i]["user_id"]]){
						let encryptedData = bulletin.bn[i]["l_msg"]["cipherdata"];
						let userKey = base64Decode(keysMap[bulletin.bn[i]["user_id"]]);
						console.log("userkey", userKey);
						let cdata = await decryptAESGCM(base64Decode(encryptedData), userKey);
						cdata = safeTextDecoder(cdata).split(":");
						let aesKey = base64Decode(cdata[0]);
						let hmacKey = base64Decode(cdata[1]);
						let dataIV = base64Decode(cdata[2]);
						text = await decryptData(text, aesKey, dataIV, hmacKey);
					}
				}else{
					let chatKey = base64Decode(keysMap[bulletin.bn[i]["user_id"]]);
					console.log(chatKey);
					let encryptedText = base64Decode(new TextDecoder().decode(base64Decode(bulletin.bn[i].l_msg["text"])));
					text = new TextDecoder().decode(await decryptAESGCM(encryptedText, chatKey));
				}
				}catch(e){
					console.error(e);
				}
				if(text.length > 18){
					text = text.slice(0, 18) + "...";
				}
				let profilePhoto = "";
				if(bulletin.bn[i]["profile_photo"]){
					profilePhotoLink = bulletin.bn[i]["profile_photo"]["url"];
					profilePhoto = await getCachedProfilePhoto(dbInstance, profilePhotoLink);
					if(!profilePhoto){
						profilePhoto = "";
					}else{
						if(!localCache[profilePhotoLink]){
							localCache[profilePhotoLink] = profilePhoto;
						}else{
							profilePhoto = localCache[profilePhotoLink];
						}
					}
				}
				let component = new chats(bulletin.bn[i]["name"], text, timestampToDate(bulletin.bn[i].l_msg["date"]), bulletin.bn[i]["user_id"], bulletin.bn[i]["unread"], profilePhoto);
				let newElement = component.buildComponent();
				userProfiles[bulletin.bn[i]["user_id"]] = {}
				userProfiles[bulletin.bn[i]["user_id"]]["name"] = bulletin.bn[i]["name"];
				userProfiles[bulletin.bn[i]["user_id"]]["username"] = bulletin.bn[i]["username"];
				userProfiles[bulletin.bn[i]["user_id"]]["type"] = bulletin.bn[i]["type"];
				elements += chatLink(bulletin.bn[i]["user_id"]) + newElement + "</a>";
				chatList = elements;
				}catch(e){
					console.log(e);
				}
			}
			let chatsE = document.getElementById("chats");
			chatsE.innerHTML = elements;
		}catch(e){
			if(bulletin == "state.SESSION_INVALID"){
				console.error("User's session invalid.");
				await removeSession();
				window.location.href = window.location.href + "/..";
			}else{
				console.log(e);
			}
		}
}

async function removeSession(){
	localStorage.removeItem("session");
	localStorage.removeItem("user_id");
}

async function updateChatList(){
	document.getElementById("chats").innerHTML = chatList;
}

async function listChatsHandler(){
	setTimeout(listChats, 1000);
}

async function bgLoad(){
	try{
		await mainKeyExchange();
		restoreChats(dbInstance);
		await saveChats(dbInstance);
	}catch(e){
		console.error(e);
	}
}

async function whenLoaded(){
	let notLoggedIn = await isLoggedIn();
	if(notLoggedIn){
		window.location.href = window.location.href + "/..";
	}
	document.getElementById("settings").addEventListener("click", function (e) {
		window.location.href = window.location.origin + "/settings";
	});
	document.getElementById("search").addEventListener("click", function (e) {
		window.location.href = window.location.origin + "/search";
	});
	document.getElementById("newchat").addEventListener("click", function (e) {
		window.location.href = window.location.origin + "/newchat";
	});
	document.getElementById("joinchat").addEventListener("click", function (e) {
		window.location.href = window.location.origin + "/joinchat";
	});
	dbInstance = await openDatabaseInstance();
	bgLoad();
	setInterval(listChatsHandler, 5000);
}

if(window.addEventListener){
	window.addEventListener('load', whenLoaded, false);
}else{
	window.attachEvent('onload', whenLoaded);
}