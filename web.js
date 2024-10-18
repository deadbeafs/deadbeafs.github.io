var hosts = ["https://twcone.pythonanywhere.com"];
var mainHostname = hosts[0];

function escape(string) {
	var htmlEscapes = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;','¢':'&cent;','£':'&pound;','€':'&euro;','¥':'&yen;','`':'&#x60;','©':'&copy;','®':'&reg;','™':'&trade;','→':'&rarr;','←':'&larr;','↑':'&uarr;','↓':'&darr;','₽':'&#8381;'};
	return string.replace(/[&<>"'¢£€¥©®`™→←↑↓₽]/g, function(match) {
		return htmlEscapes[match];
	});
}

function unescape(string) {
	return string.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#039;/g,"'");
}

var p_k = `MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA36PWnOMQhFhcfYBS6NiA
xJyA3n9acJ5NSD540+UPzSSxmJ0/W+Y1yW6iGFqRX6nM5K1+FJ+4Pj5qqlFALP9P
+Wg2kPTX1tnBVQ12/NNjm/ZMqxZ8ijPS8sjbfaHrS7bN9jStY5Mo0pi9mx/a5qSQ
/1cH/GeYj4956ch6Y86r+tejxEUXOowOQo8VC6sInWryqvYDQaSiwOf0DqUrbWj+
Qc/p8tI22ltdrKy8NeUTqodU7VjzZmW25zsle0KPc6gVsZH4GXDRNkfWNu8YW+K9
zo+v6PxAiwnIXZhLmf7QLarvfY+68K5lml7+jtbiG0o1lSDPPsFk9w4Yejzm9XsA
o3GoUwYR9XFKXlzX5+I1qqRbmuCfcp7tnyyrHl1tX0kpg5wn6k1641b/LUHydBph
NUmyLT+KXwsApsdB81tobX1WAIg7tF0Y6pxAsVZmIXs1UtRd0uDTwjQyY/NHj+Gw
aWRUHz+9I1Jvn4n2rPdOTBe2FeowplByF5K1UzqEkJiK1gwmgkDSkMSH+BTlV/Db
1I8KnUXuTy8SP5Iqoqb67Q4R8Jij3CIvUnhAcTNkKP1CpllgXHgRDRX8N4LWcpM9
zPn/Xpznt5FlYdP2LJyd6yyDtcyyWoJVTSMzoS4cBCyE2N/zCR9WqEelJNl2XYCr
h68umN/HMKofO64No6MbHXkCAwEAAQ==`;

var sp_k = `MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAp0poVklxfr/swbexahJ7
Ypah2ygQSLLLiFxnausHP3FJl7Dcg6Zo/cHXMTrVOHvV3JrEAapEAfzNVkJTjois
ia/hit5UHBLRXlSwpa55fZB1/+cFFmYZEe/xZct6WiJmr++HMR1hi6hwW/gROUgG
K8+kf+xrhmS3gDeGX8QA+hb3nYs4KoG4e5I7AWgYq6OOOcniUdqtxujnEUiScZjU
8ANpcmSogPPqwqu2c+n+eB25M/ZlimSywgbRLPHFjqs4VFbnhfIU9Oae3hlpatJl
Az6DYrCeaxCbYY6v0IjlCry8zVuA3h0Ag1TU18602N/imG+LO/DcTcbb0LsD3qbv
5Vm2hhP+kH5cQEFFzS8pdhzcwppvn9oTH306fI9Dmh453veNCw2GQbBJNSqiYFQM
wnvhc+jvN8gA/1jnVIOsvws+8Ql7UCWDOsyXqDvk/FzKuTWBa79oiRRpag5JF7UZ
MP3soqhkmBTxLTUh9rf3LxY2QwbO/DP31u/GLJ9xwhN4CDrY3Ej/OdbnVm4nMso4
xL3qBT0tg9TuL5ctJNllLg1nhzK1qyqhGHz02kMPoi5/uKgDbaj9vbQVO3+NPHYY
4184ysePI9cw2/O+Jegw6ym7tcpftLWrl4eWhhG+pjWEwbC6oGR1AnqQ/IvNwTLM
2lnCS9cuSGfw0OLWw9yRtBkCAwEAAQ==`;


var transmitKey = new Uint8Array(32);
crypto.getRandomValues(transmitKey);
var arrayTransmitKey = Array.from(transmitKey);

function pemToBuffer(pub){
	var byteArray = new Uint8Array(pub.length);
	for (var i = 0; i < pub.length; i++) {
		byteArray[i] = pub.charCodeAt(i);
	}
	return byteArray;
}

async function importPublicKey(Pem) {
	return await crypto.subtle.importKey(
			"spki",
			pemToBuffer(atob(Pem)),
			{
				name: "RSA-OAEP",
				hash: "SHA-256",
				modulusLength: 4096
			},
			false,
			["encrypt"]
		);
}

async function importPrivateKey(Pem) {
	return await crypto.subtle.importKey(
			"pkcs8",
			pemToBuffer(atob(Pem)),
			{
				name: "RSA-OAEP",
				hash: "SHA-256",
				modulusLength: 4096
			},
			false,
			["decrypt"]
		);
}

async function encryptRSA(key, plaintext, raw=false) {
	key = await importPublicKey(key);
	if(!raw){
		plaintext = new TextEncoder().encode(plaintext);
	}
	let encrypted = await crypto.subtle.encrypt(
				{
					name: "RSA-OAEP"
				},
				key,
				plaintext
	);
	return new Uint8Array(encrypted);
}

async function decryptRSA(key, ciphertext) {
	key = await importPrivateKey(key);
	let decrypted = await crypto.subtle.decrypt(
				{
					name: "RSA-OAEP"
				},
				key,
				ciphertext
	);
	return decrypted;
}

async function encryptServerMessage(data, pk=p_k){
	return await encryptRSA(pk, data);
}

async function decryptAESGCM(data, chatkey){
	data = new Uint8Array(data);
	let iv = data.slice(0, 12);
	let tag = data.slice(data.length - 16, data.length);
	let encryptedData = data.slice(12, data.length);
	let subtleKey = await window.crypto.subtle.importKey(
		'raw',
		chatkey,
		{
			name: 'AES-GCM',
			modulusLength: 256
		},
		false,
		["decrypt"]
	);
	return await window.crypto.subtle.decrypt(
			{
				name: 'AES-GCM',
				iv: iv,
				tagLength: 128
			},
			subtleKey,
			encryptedData);
}

async function encryptAESGCM(data, key, raw=false) {
	let dataArray = new TextEncoder().encode(data);
	if(raw){
		dataArray = data;
	}
	const iv = window.crypto.getRandomValues(new Uint8Array(12));
	const subtleKey = await window.crypto.subtle.importKey(
		'raw',
		key,
		{
			name: 'AES-GCM',
			length: 256
		},
		false,
		['encrypt']
	);
	const encryptedData = await window.crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv: iv,
			tagLength: 128
		},
		subtleKey,
		dataArray
	);
	const encryptedBuffer = new Uint8Array(iv.byteLength + encryptedData.byteLength);
	encryptedBuffer.set(iv, 0);
	encryptedBuffer.set(new Uint8Array(encryptedData), iv.byteLength);
	return encryptedBuffer;
}

async function createEncryptedPayload(payload, pk=p_k){
	let encryptedPayload = await encryptAESGCM(payload, transmitKey);
	let encryptedTransmitKey = await encryptServerMessage(JSON.stringify({"key": arrayTransmitKey}), pk);
	return JSON.stringify({"data": Array.from(encryptedPayload), "is_e": null, "transmit": Array.from(encryptedTransmitKey)});
}

async function decryptDataPass(encryptedData, password) {
	try{
		const combined = base64Decode(encryptedData);
		const salt = combined.slice(0, 16);
		const iv = combined.slice(16, 32);
		const encryptedDataBytes = combined.slice(32);
		const keyMaterial = await window.crypto.subtle.importKey(
			'raw',
			new TextEncoder().encode(password),
			'PBKDF2',
			false,
			['deriveBits', 'deriveKey']
		);

		const key = await window.crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: salt,
				iterations: 65536,
				hash: 'SHA-1'
			},
			keyMaterial,
			{ name: 'AES-CBC', length: 256 },
			false,
			['decrypt']
		);
		const decryptedData = await window.crypto.subtle.decrypt(
			{
				name: 'AES-CBC',
				iv: iv
			},
			key,
			encryptedDataBytes
		);
		return new TextDecoder().decode(decryptedData);
	}catch (e){
		return e.toString();
	}
}

async function encryptDataPass(data, password) {
	try{
		const salt = window.crypto.getRandomValues(new Uint8Array(16));
		const keyMaterial = await window.crypto.subtle.importKey(
			"raw",
			new TextEncoder().encode(password),
			"PBKDF2",
			false,
			["deriveBits", "deriveKey"]
		);
		const key = await window.crypto.subtle.deriveKey(
					{
						name: "PBKDF2",
						salt: salt,
						iterations: 65536,
						hash: "SHA-1",
					},
					keyMaterial,
					{name: "AES-CBC", length: 256},
					false,
					["encrypt"]
		);
		const iv = window.crypto.getRandomValues(new Uint8Array(16));
		const encryptedData = await window.crypto.subtle.encrypt(
						{
							name: "AES-CBC",
							iv: iv,
						},
						key,
						new TextEncoder().encode(data)
		);
		const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
		combined.set(salt, 0);
		combined.set(iv, salt.length);
		combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
		return btoa(String.fromCharCode(...combined));
	}catch(e){
		return e.toString();
	}
}

async function decryptData(data, key, iv, hmacKey) {
	try{
		const encryptedMessage = Uint8Array.from(atob(data), c => c.charCodeAt(0));
		const encryptedData = encryptedMessage.slice(0, encryptedMessage.length - 32);
		const receivedHmac = encryptedMessage.slice(encryptedMessage.length - 32);

		const calculatedHmac = await initializeHMAC(hmacKey, encryptedData);
		if (!arraysEqual(receivedHmac, calculatedHmac)) {
			return "Corrupted Message";
		}

		const cryptoKey = await window.crypto.subtle.importKey(
				"raw",
				key,
				{ name: "AES-CTR" },
				false,
				["decrypt"]
		);
		const decryptedBuffer = await window.crypto.subtle.decrypt(
			{
				name: "AES-CTR",
				counter: iv,
				length: 64,
			},
			cryptoKey,
			encryptedData
		);

		const decryptedData = new TextDecoder().decode(decryptedBuffer);
		return decryptedData;
	}catch(e){
		alert(e);
		return e.toString();
	}
}

async function initializeHMAC(hmacKey, data) {
	const key = await window.crypto.subtle.importKey(
		"raw",
		hmacKey,
		{name: "HMAC", hash: "SHA-256"},
		false,
		["sign"]
	);
	const hmac = await window.crypto.subtle.sign("HMAC", key, data);
	return new Uint8Array(hmac);
}

function pkcs5Pad(data){
	const blockSize = 16;
	const dataLength = data.length;
	const paddingRequired = blockSize - (dataLength % blockSize);
	const paddedData = new Uint8Array(dataLength + paddingRequired);
	paddedData.set(data);
	for (let i = dataLength; i < paddedData.length; i++) {
		paddedData[i] = paddingRequired;
	}
	return paddedData;
}

function pkcs5Unpad(input){
	let data = new TextEncoder().encode(input);
	let padLength = data[data.length - 1];
	if(padLength <= 16){
		let unpaddedLength = data.length - padLength;
		let newArray = new Uint8Array(unpaddedLength);
		for(let i = 0; i < unpaddedLength; i++){
			newArray[i] = data[i];
		}
		return new TextDecoder().decode(newArray);
	}
	return input;
}

async function encryptData(data, key, iv, hmacKeyBuffer) {
	const dataBuffer = new Uint8Array(data);
	const keyBuffer = new Uint8Array(key);
	hmacKeyBuffer = new Uint8Array(hmacKeyBuffer);
	const ivBuffer = new Uint8Array(iv);
	const aesKey = await crypto.subtle.importKey(
		'raw',
		keyBuffer,
		{name: 'AES-CTR'},
		false,
		['encrypt']
	);
	const ciphertext = await crypto.subtle.encrypt(
		{
			name: 'AES-CTR',
			counter: ivBuffer,
			length: 128,
		},
		aesKey,
		pkcs5Pad(dataBuffer)
	);
	const ciphertextArray = new Uint8Array(ciphertext);
	const hmac = await initializeHMAC(hmacKeyBuffer, ciphertext);
	const outputPayload = new Uint8Array(ciphertextArray.length + hmac.length);
	outputPayload.set(ciphertextArray, 0);
	outputPayload.set(hmac, ciphertextArray.length);
	return btoa(String.fromCharCode(...outputPayload));
}

function arraysEqual(a, b) {
	if (a.length !== b.length) return false;
	return a.every((val, index) => val === b[index]);
}

var twapi = class {
	constructor(server){
		this.server = server;
		this.ERRORS = ["state.CORRUPTED_DATA", "state.INVALID_CIPHER"];
		this.STORE_SERVERS = ["https://twk1.pythonanywhere.com", "https://twcdn.pythonanywhere.com"];
	}

	isErrorResponse(response){
		return this.ERRORS.includes(response)
	}

	async postRequest(location, data, encrypted = true, input_server=this.server, pk=p_k){
		var http = new XMLHttpRequest();
		http.onreadystatechange = function () {
			return http.responseText;
		}
		http.open("POST", input_server + location, false);
		http.setRequestHeader("Content-Type", "application/json");
		console.log("requesting " + location + "; encrypted=" + encrypted);
		data = JSON.parse(data);
		data["_utimestamp"] = parseInt(Date.now() / 1000);
		data["_uvtimestamp"] = 15;
		data = JSON.stringify(data);
		if(encrypted){
			data = await createEncryptedPayload(data, pk);
		}
		http.send(data);
		if(encrypted){
			if(!this.isErrorResponse(http.onreadystatechange())){
				let output = await decryptAESGCM(JSON.parse(http.onreadystatechange()).data, transmitKey);
				return String.fromCharCode(...new Uint8Array(output));
			}else{
				return http.onreadystatechange();
			}
		}else{
			return http.onreadystatechange();
		}
	}

	async UnencryptedGetRequest(target_url){
		var http = new XMLHttpRequest();
		http.onreadystatechange = function () {
			return http.responseText;
		}
		http.open("GET", target_url, false);
		http.send()
		return http.onreadystatechange();
	}

	async UnencryptedPostRequest(target_url, path_loc, data){
		return await this.postRequest(path_loc, data, false, target_url);
	}

	// do wrapPostRequest there

	async logAction(username, password, captcha, name="", inviteCode=""){
		return await this.postRequest("/logAction", JSON.stringify({"username": username, "pass": password, "name": name, "inv": inviteCode, "c": captcha}));
	}

	async getChats(){
		return await this.postRequest("/getChats", JSON.stringify({"session": localStorage.session, "user_id": localStorage.user_id}));
	}

	async getUserProfile(target_uid){
		return await this.postRequest("/getUserObject", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": target_uid}));
	}

	async setUserName(name){
		return await this.postRequest("/setUserName", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "new_name": name}));
	}

	async setUserUsername(username){
		return await this.postRequest("/setUserUsername", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "new_username": username}));
	}

	async getEncryptedKey(){
		return await this.postRequest("/getEncryptedMKey", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id}));
	}

	async getStoredChats(){
		return await this.postRequest("/getKeys", JSON.stringify({"session": localStorage.session, "user_id": localStorage.user_id}), true, this.STORE_SERVERS[0], sp_k);
	}

	async storeChats(payload, storeKey){
		return await this.postRequest("/storeKeys", JSON.stringify({"session": localStorage.session, "user_id": localStorage.user_id, "payload": payload, "storeKey": storeKey}), true, this.STORE_SERVERS[0], sp_k);
	}

	async getMessages(target_id, offset=-1, amount=28){
		return await this.postRequest("/getMessages", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": target_id, "offset": offset, "amount": amount}));
	}

	async sendMessage(target_id, text, cipherdata=""){
		return await this.postRequest("/sendMsg", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": target_id, "text": text, "cipherdata": cipherdata}));
	}

	async editMessage(target_id, msg_id, text, newcipher=""){
		const payload = {"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": target_id, "msg_id": msg_id, "text": text};
		if(newcipher){
			payload["newcipher"] = newcipher;
		}
		return await this.postRequest("/editMessage", JSON.stringify(payload));
	}

	async deleteMessage(target_id, msg_id){
		return await this.postRequest("/deleteMessage", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": target_id, "msg_id": msg_id}));
	}

	async getChatInfo(target_id){
		return await this.postRequest("/getChatInfo", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst": target_id}));
	}

	async getChatUsersCount(target_id){
		return await this.postRequest("/getChatUsersCount", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst": target_id}));
	}

	async isInitiator(target_id){
		return await this.postRequest("/isInitiator", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": target_id}));
	}

	async getRKey(target_id){
		return await this.postRequest("/getRKey", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": target_id}));
	}

	async getInitKeyRequest(target_id){
		return await this.postRequest("/getInitKeyRequest", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": target_id}));
	}

	async giveKey(target_id, encData){
		return await this.postRequest("/givePubKey", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": target_id, "pubkey": encData}));
	}

	async getMyChatType(target_id){
		return await this.postRequest("/getMyChatType", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst": target_id}));
	}

	async getChatUserKeys(target_id){
		return await this.postRequest("/getChatUserKeys", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_group": target_id}));
	}

	async getMyChatKey(target_id){
		return await this.postRequest("/getMyChatKey", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_group": target_id}));
	}

	async setChatUserKeys(target_id, keys){
		return await this.postRequest("/setChatUserKeys", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_group": target_id, "keys": keys}));
	}

	async createDialog(target_id){
		return await this.postRequest("/contactUser", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": target_id}));
	}

	async getSelfInitKey(){
		return await this.postRequest("/getSelfInitKey", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id}));
	}

	async setInitKey(){
		return await this.postRequest("/initKeyRequest", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "key": localStorage.tw1_keypb}));
	}

	async applyEncryptedKey(data){
		return await this.postRequest("/applyEncryptedMKey", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "data": data}));
	}

	async deleteEncryptedKey(){
		return await this.postRequest("/deleteEncryptedMKey", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id}));
	}

	async uploadProfilePhoto(data){
		return await this.UnencryptedPostRequest(this.STORE_SERVERS[1], "/uploadProfilePhoto", JSON.stringify({"photo_data": data}));
	}

	async setProfilePhoto(photoUrl){
		return await this.postRequest("/setUserProfilePhoto", JSON.stringify({"session": localStorage.session, "user_id": localStorage.user_id, "photo_url": photoUrl}));
	}

	async setChatProfilePhoto(target_id, photoUrl){
		return await this.postRequest("/setChatProfilePhoto", JSON.stringify({"session": localStorage.session, "user_id": localStorage.user_id, "target_group": target_id, "photo_url": photoUrl}));
	}

	async setChatThumbnail(target_id, thumbUrl){
		return await this.postRequest("/setChatThumbnail", JSON.stringify({"session": localStorage.session, "user_id": localStorage.user_id, "target_group": target_id, "thumbnail_url": thumbUrl}));
	}

	async getChatThumbnail(target_id){
		return await this.postRequest("/getChatThumbnail", JSON.stringify({"session": localStorage.session, "user_id": localStorage.user_id, "target_id": target_id}));
	}

	async createChat(title, username, about, groupType="group", is_password="false", password=""){
		let data = JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "password": password, "is_password": is_password, "username": username, "title": title, "description": about});
		if(groupType == "group"){
			return await this.postRequest("/createChat", data);
		}
		if(groupType == "channel"){
			return await this.postRequest("/createChannel", data);
		}else{
			return "state.INVALID_TYPE";
		}
	}

	async searchUser(value){
		return await this.postRequest("/searchUser", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "value": value}));
	}

	async joinChat(username, is_password=false, password=""){
		let data = {"session": localStorage.session, "my_id": localStorage.user_id, "dst": username};
		if(is_password){
			data["password"] = password;
		}
		return await this.postRequest("/joinChat", JSON.stringify(data));
	}

	async getUserId(username){
		return await this.postRequest("/getUser", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_username": username}));
	}

	async getProfilePhotos(chat_id){
		return await this.postRequest("/getProfilePhotos", JSON.stringify({"session": localStorage.session, "user_id": localStorage.user_id, "target_id": chat_id}));
	}

	async getChatUsers(chat_id, offset=0, limit=15){
		return await this.postRequest("/getChatUsers", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": chat_id, "offset": offset, "limit": limit}));
	}

	async chatUserAction(chat_id, dst_id, action=""){
		if(action){
			let urls = {"ban": "/banChatUser", "unban": "/unbanChatUser", "mute": "/muteChatUser", "unmute": "/unmuteChatUser"}
			return await this.postRequest(urls[action], JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": dst_id, "dst_group": chat_id}));
		}
	}

	async sendFile(chat_id, fileUri, text, fileCipher="", cipherData=""){
		return await this.postRequest("/sendFile", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": chat_id, "file_uri": fileUri, "text": text, "flcipher": fileCipher, "cipherdata": cipherData}));
	}

	async newChatTitle(chat_id, title){
		return await this.postRequest("/newChatTitle", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "group_id": chat_id, "new_title": title}));
	}

	async setChatUsername(chat_id, username){
		return await this.postRequest("/setChatUsername", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "group_id": chat_id, "new_username": username}));
	}

	async setChatDescription(chat_id, about){
		return await this.postRequest("/setChatDescription", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "group_id": chat_id, "new_description": about}));
	}

	async readMessages(chat_id){
		return await this.postRequest("/readMessages", JSON.stringify({"session": localStorage.session, "my_id": localStorage.user_id, "dst_id": chat_id}));
	}
}

async function openDatabaseInstance() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open("tw", 2);
		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			db.createObjectStore("tellweb", {keyPath: 'id', autoIncrement: false});
		};

		request.onsuccess = (event) => {
			resolve(event.target.result);
		};

		request.onerror = (event) => {
			reject(event.target.errorCode);
		};
	});
}

async function addDatabaseData(db, data, key) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(["tellweb"], "readwrite");
		const store = transaction.objectStore("tellweb");
		data["id"] = key;
		const request = store.put(data);

		request.onsuccess = () => {};
		request.onerror = (event) => {
			console.log(event.target.error);
			reject(event.target.errorCode);
		};
	});
}

function getDatabaseData(db, key) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(["tellweb"], "readonly");
		const store = transaction.objectStore("tellweb");
		const request = store.get(key);

		request.onsuccess = (event) => {
			const result = event.target.result;
			if(result){
				resolve(result);
			}else{
				resolve("");
			}
		};

		request.onerror = (event) => {
			console.log(event.target.error);
			reject(`Error retrieving data: ${event.target.error}`);
		};
	});
}

async function isCachedProfilePhoto(dbInstance, key){
	let fullData = await getDatabaseData(dbInstance, 20);
	if(fullData){
		if(fullData[key]){
			return fullData[key];
		}
	}
	return false;
}

async function setCachedProfilePhoto(dbInstance, photoData, photoUrl){
	let fullData = await getDatabaseData(dbInstance, 20);
	if(!fullData){
		fullData = {};
	}
	fullData[photoUrl] = photoData;
	await addDatabaseData(dbInstance, fullData, 20);
}

var caching = [];

async function getCachedProfilePhoto(dbInstance, url){
	let photoData = await isCachedProfilePhoto(dbInstance, url);
	if(photoData){
		let blob = new Blob([photoData], {type: "image/png"});
		return URL.createObjectURL(blob);
	}else{
		if(caching.includes(url)){
			return false;
		}
		caching.push(url);
		let twinstance = new twapi("");
		photoData = base64Decode(await twinstance.UnencryptedGetRequest(url));
		let fullData = await getDatabaseData(dbInstance, 20);
		if(fullData == ""){
			fullData = {};
		}
		fullData[url] = photoData;
		addDatabaseData(dbInstance, fullData, 20);
		let blob = new Blob([photoData], {type: "image/png"});
		return URL.createObjectURL(blob);
	}
}

function generateKey(length) {
	const data = new Uint8Array(length);
	crypto.getRandomValues(data);
	return btoa(String.fromCharCode(...data));
}

function generateCipherdata(){
	return generateKey(32) + ":" + generateKey(32) + ":" + generateKey(16);
}

function base64Decode(data){
	return Uint8Array.from(atob(data), c => c.charCodeAt(0));
}

function bytesToBase64(bytes){
	const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
	return btoa(binString);
}

function b64EncodeUnicode(str){
	return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
		function toSolidBytes(match, p1) {
			return String.fromCharCode('0x' + p1);
	}));
}

function decodeDoubleB64(str){
	return base64Decode(new TextDecoder().decode(base64Decode(str)));
}

function safeTextDecoder(output){
	try{
		return new TextDecoder().decode(output);
	}catch(e){
		return String.fromCharCode(...new Uint8Array(output));
	}
}

function saveAsFile(data, fileName) {
	var a = document.createElement("a");
	document.body.appendChild(a);
	a.style = "display: none";
	a.href = data;
	a.download = fileName;
	a.click();
	a.parentNode.removeChild("a");
}

function gup(name, url){
	if (!url) url = location.href;
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(url);
	return results == null ? null : results[1];
}

async function delay(ms){
	return await new Promise(resolve => setTimeout(resolve, ms));
}

async function restoreChats(dbInstance){
	try{
		let chatData = await getDatabaseData(dbInstance, 2);
		let response = await tellweb.getStoredChats();
		response = JSON.parse(response);
		let decryptedKey = await decryptRSA(localStorage.tw1_key, Uint8Array.from(atob(response["storeKey"]), c => c.charCodeAt(0)));
		let chats = new TextDecoder("utf-8").decode(await decryptAESGCM(Uint8Array.from(atob(response["data"]), c => c.charCodeAt(0)), decryptedKey));
		chats = JSON.parse(chats);
		let newJson = {};
		for(let i = 0; i < chats["chats"].length; i++){
			try{
				newJson[chats["chats"][i]["chat_id"]] = chats["chats"][i]["key"];
			}catch(e){
				console.log("[restore] error: " + e);
			}
		}
		newJson = Object.assign({}, newJson, chatData);
		await addDatabaseData(dbInstance, newJson, 2);
	}catch(e){
		console.error(e);
	}
}

async function createChatArray(chatsMap){
	let chats = {"chats": []};
	let keys = Object.keys(chatsMap);
	for(let i = 0; i < keys.length; i++){
		chats["chats"].push({"key": chatsMap[keys[i]], "chat_id": keys[i]});
	}
	chats["version"] = "web";
	return chats;
}

async function saveChats(dbInstance){
	let chats = await getDatabaseData(dbInstance, 2);
	chats = await createChatArray(chats);
	chats = JSON.stringify(chats);
	let storeKey = new Uint8Array(32);
	crypto.getRandomValues(storeKey);
	console.log("[STORE] Creating storeKey");
	let encryptedKey = await encryptRSA(localStorage.tw1_keypb, storeKey, true);
	encryptedKey = btoa(String.fromCharCode(...encryptedKey));
	console.log("[STORE] Creating payload");
	let payload = btoa(String.fromCharCode(...await encryptAESGCM(chats, storeKey)));
	const storingResult = await tellweb.storeChats(payload, encryptedKey);
	console.log("[STORE] storing chats result: " + storingResult);
}

async function generateMainKeys(autosave=false, askrevoke=true){
	const key = await crypto.subtle.generateKey(
			{
				name: "RSA-OAEP",
				modulusLength: 4096,
				publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
				hash: {name: "SHA-256"},
			},
			true,
			["encrypt", "decrypt"]
	);
	const pbk = btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("pkcs8", key.privateKey))));
	const pvk = btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("spki", key.publicKey))));
	if(!localStorage.tw1_key && autosave){
		if(askrevoke){
			if(confirm("Revoke main key?")){
				localStorage.setItem("tw1_keypb", pbk);
				localStorage.setItem("tw1_key", pvk);
			}
		}else{
			localStorage.setItem("tw1_keypb", pbk);
			localStorage.setItem("tw1_key", pvk);
		}
	}
	return key;
}

async function mainKeyExchange(){
	let response = await tellweb.getSelfInitKey();
	if(response == "state.KEY_EMPTY"){
		await generateMainKeys(true, false);
		response = await tellweb.setInitKey();
		if(localStorage.registered){
			if(response == "state.KEY_SAVED"){
				await tellweb.applyEncryptedKey(await encryptDataPass(localStorage.tw1_key, localStorage.registered));
			}
			localStorage.removeItem("registered");
		}
	}else{
		if(response.startsWith("MII")){
			if(response != localStorage.tw1_keypb && !localStorage.tw1_keypb){
				localStorage.setItem("tw1_keypb", response);
			}
			if(localStorage.login){
				const decryptedData = await decryptDataPass(await tellweb.getEncryptedKey(), localStorage.login);
				if(decryptedData.startsWith("MII") && !localStorage.tw1_key){
					localStorage.setItem("tw1_key", localStorage.tw1_key);
				}
				localStorage.removeItem("login");
			}
		}
	}
}

function checkPassword(password) {
	var strength = 0;
	if(password.match(/[a-z]+/)){
		strength += 1;
	}
	if(password.match(/[A-Z]+/)){
		strength += 1;
	}
	if(password.match(/[0-9]+/)){
		strength += 1;
	}
	if(password.match(/[$@#&!]+/)){
		strength += 1;
	}
	if(password.length < 10){
		strength = 0;
	}
	return strength;
}

var tellweb = new twapi(mainHostname);0