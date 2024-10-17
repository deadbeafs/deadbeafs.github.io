function joinPieces(el1, el2, innerData){
	return el1 + innerData + el2;
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

var chats = class {
	constructor(name, message, time, uid, unread=0, photo_url="") {
		this.photo_url = photo_url;
		if(photo_url == ""){
			this.photo_url = "default.webp";
		}
		this.name = name;
		this.message = message;
		this.time = time;
		this.unread = unread;
		this.unreadVisible = !parseInt(unread) > 0;
		this.uid = uid;
		this.msg_id = "";
	}

	buildComponent() {
		let finishedHTML = '';
		finishedHTML += joinPieces('<img src="', '" alt="Profile Photo" class="profile-photo">', this.photo_url);
		finishedHTML += joinPieces('<p hidden="true" id="user_', '"></p>', this.uid);
		finishedHTML += joinPieces('<div class="user-info"><span class="user-name">', '</span>', this.name);
		finishedHTML += joinPieces('<span class="last-message">', '</span></div>', this.message);
		finishedHTML += joinPieces('<div class="message-details"><span class="message-time">', '</span>', this.time);
		let hideElement = "";
		if(this.unreadVisible){
			hideElement = ' hidden="true"';
		}
		finishedHTML += `<span` + hideElement + ` class="unread-counter">` + this.unread + '</span></div>';
		return joinPieces('<div id="chat" class="chat-user-item">', "</div>", finishedHTML);
	}

	buildMessage(message_text, time, read=true, out=true, edited=false, name=""){
		let finishedHTML = '';
		let bgColor = "#2A3139";
		let corner = "border-bottom-left-radius: 0%; margin-left: 8px;";
		let displayCheck = false;
		if(out){
			bgColor = "#690102";
			corner = "border-bottom-right-radius: 0%; margin-left: 8px;";
			displayCheck = true;
		}
		if(name){
			name = `<p style="font-weight: bold;">` + name + ":</strong>"
		}
		finishedHTML += `<div class="message" data-msgid="` + this.msg_id + `" style="margin-top: 8px; background-color: ` + bgColor + `; border-radius: 10px / 10px; width: 490px; height: auto; ` + corner + ` color: white;">` + name + `<p class="message_text" style="font-size: 21px; width: 488px; word-wrap: break-word;">`+ message_text + `</p>`;
		finishedHTML += `<span style="display: flex; flex-direction: inline; width: 245px; word-wrap: break-word; font-size: 18px;">` + time;
		if(displayCheck){
			if(read){
				finishedHTML += ` <svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="0 -960 960 960" width="21px" fill="#e8eaed"><path d="M268-240 42-466l57-56 170 170 56 56-57 56Zm226 0L268-466l56-57 170 170 368-368 56 57-424 424Zm0-226-57-56 198-198 57 56-198 198Z"/></svg>`;
			}else{
				finishedHTML += ` <svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="0 -960 960 960" width="21px" fill="#e8eaed"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`;
			}
			if(edited){
				finishedHTML += ` <svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="0 -960 960 960" width="21px" fill="#e8eaed"><path d="M167-120q-21 5-36.5-10.5T120-167l40-191 198 198-191 40Zm191-40L160-358l473-473q17-17 42-17t42 17l114 114q17 17 17 42t-17 42L358-160Zm317-628L233-346l113 113 442-442-113-113Z"/></svg>`;
			}
		}
		finishedHTML += `</span></div>`;
		return finishedHTML;
	}

	buildImageMessage(message_text, photo_url, time, read=true, out=true, edited=false, mimeType="", flFormat=""){
		let finishedHTML = '';
		let bgColor = "#2A3139";
		let corner = "border-bottom-left-radius: 0%; margin-left: 8px;";
		let displayCheck = false;
		if(out){
			bgColor = "#690102";
			corner = "border-bottom-right-radius: 0%; margin-left: 8px; ";
			displayCheck = true;
		}
		let defaultFileTag = `<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#e8eaed"><path d="M260-212q-70 0-119-49T92-380q0-66 47-117t115-51q8-75 71.5-136.5T466-746q11 0 19.5 8.5T494-718v306l88-88 20 20-122 122-122-122 20-20 88 88v-306q-75 0-130.5 63T280-520h-20q-58 0-99 41t-41 99q0 58 41 99t99 41h480q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-80q0-50-22-91.5T600-680v-34q51 30 79.5 82T708-520v52h32q54 0 91 37t37 91q0 54-37 91t-91 37H260Zm220-281Z"/></svg>`;
		if(mimeType.startsWith("image") && photo_url){
			defaultFileTag = `<img src="`;
			defaultFileTag += photo_url;
			defaultFileTag += `" style="width: 99.9%; height: 99.9%; border-radius: 10px; border: 1px solid transparent; max-width: 500px;">`;
		}
		if(mimeType.startsWith("video") && photo_url){
			defaultFileTag = `<video controls style="width: 99.9%; height: auto; border-radius: 10px; border: 1px solid transparent; max-width: 500px;">`;
			defaultFileTag += `<source src="` + photo_url + `#t=0.0">`;
			defaultFileTag += `</video>`;
		}
		if(mimeType.startsWith("audio") && photo_url){
			defaultFileTag = `<audio controls>`;
			defaultFileTag += `<source src="`;
			defaultFileTag += photo_url + `">`;
			defaultFileTag += `</audio>`;
		}
		finishedHTML += `<div class="message" style="background-color: ` + bgColor + `; border-radius: 10px / 10px; width: auto; height: auto; ` + corner + ` color: white; margin-bottom: 8px; margin-top: 8px; max-width: 500px;">` + defaultFileTag + `<p class="message_text" style="font-size: 32px; width: 490px; word-wrap: break-word;">` + `<a style="text-decoration: none;" href="` + photo_url + `" download="` + 'file.' + flFormat + `">` + message_text + `</a></p>`;
		finishedHTML += `<span style="display: flex; flex-direction: inline: width: 185px; word-wrap: break-word;">` + time;
		if(displayCheck){
			if(read){
				finishedHTML += ` <svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="0 -960 960 960" width="21px" fill="#e8eaed"><path d="M268-240 42-466l57-56 170 170 56 56-57 56Zm226 0L268-466l56-57 170 170 368-368 56 57-424 424Zm0-226-57-56 198-198 57 56-198 198Z"/></svg>`;
			}else{
				finishedHTML += ` <svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="0 -960 960 960" width="21px" fill="#e8eaed"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`;
			}
			if(edited){
				finishedHTML += ` <svg xmlns="http://www.w3.org/2000/svg" height="21px" viewBox="0 -960 960 960" width="21px" fill="#e8eaed"><path d="M167-120q-21 5-36.5-10.5T120-167l40-191 198 198-191 40Zm191-40L160-358l473-473q17-17 42-17t42 17l114 114q17 17 17 42t-17 42L358-160Zm317-628L233-346l113 113 442-442-113-113Z"/></svg>`;
			}
		}
		finishedHTML += `</span></div>`;
		return finishedHTML;
	}
}

var dialogs = class {
	constructor(){
		this.title = "";
		this.message = "";
		this.closeBtnText = "";
	}

	buildDialog(){
		let html1 = `<div id="dialog" style="display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 300px; background: #f0f0f0; border-radius: 10px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); padding: 20px; z-index: 1000;"><h2 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; color: #333; margin: 0 0 10px;">`;
		let html2 = `</h2><p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #666; margin: 0 0 20px;"></p>`;
		let html3 = `<button id="closeBtn" style="background: black; color: white; border: none; border-radius: 5px; padding: 10px 15px; font-size: 14px; cursor: pointer; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3); margin-left: 10px;" onclick="document.getElementById('dialog').style.display = 'none'">`;
		let html4 = `</button></div>`;
		return html1 + this.title + html2 + this.message + html3 + this.closeBtnText + html4;
	}

	buildMessageActionDialog(){
		return `<div id="dialog" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; background: black; border-radius: 10px; box-shadow: 0 4px 20px #80deea; padding: 20px; z-index: 1000;"><h2 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; color: white; margin: 0 0 10px;">Choose message action</h2><div style="columns 100px 4;"><button id="editBtn" style="background: black; color: white; border: none; border-radius: 5px; padding: 10px 15px; font-size: 14px; cursor: pointer; box-shadow: 0 2px 5px grey; width: 100%; margin-top: 4px;"><svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#e8eaed" style="vertical-align: middle"><path d="M160-410v-60h300v60H160Zm0-165v-60h470v60H160Zm0-165v-60h470v60H160Zm360 580v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q9 9 13 20t4 22q0 11-4.5 22.5T862.09-380L643-160H520Zm300-263-37-37 37 37ZM580-220h38l121-122-18-19-19-18-122 121v38Zm141-141-19-18 37 37-18-19Z"/></svg>Edit message</button><button id="deleteBtn" style="background: black; color: white; border: none; border-radius: 5px; padding: 10px 15px; font-size: 14px; cursor: pointer; box-shadow: 0 2px 5px grey; width: 100%; margin-top: 4px;"><svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#e8eaed" style="vertical-align: middle"><path d="m361-299 119-121 120 121 47-48-119-121 119-121-47-48-120 121-119-121-48 48 120 121-120 121 48 48ZM261-120q-24 0-42-18t-18-42v-570h-41v-60h188v-30h264v30h188v60h-41v570q0 24-18 42t-42 18H261Zm438-630H261v570h438v-570Zm-438 0v570-570Z"/></svg>Delete message</button><button id="closeBtn" style="background: black; color: white; border: none; border-radius: 5px; padding: 10px 15px; font-size: 14px; cursor: pointer; box-shadow: 0 2px 5px grey; width: 100%; margin-top: 4px;" onclick="document.getElementById('dialog').style.display='none'; document.getElementById('messages').style.pointerEvents = 'auto';">Cancel</button></div></div>`;
	}
}


function timestampToDate(unixtime){
	var a = new Date(unixtime * 1000);
	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	var year = a.getFullYear();
	var month = months[a.getMonth()];
	var date = a.getDate();
	var hour = a.getHours();
	if(String(hour).length == 1){
		hour = "0" + hour;
	}
	var min = a.getMinutes();
	if(String(min).length == 1){
		min = "0" + min;
	}
	var sec = a.getSeconds();
	if(String(sec).length == 1){
		sec = "0" + sec;
	}
	return date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
}