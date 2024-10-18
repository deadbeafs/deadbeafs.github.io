async function convertIdToName(chatType){
	if(chatType == "pbgroup"){
		return "Group";
	}
	if(chatType == "pbchannel"){
		return "Channel";
	}
	return chatType.charAt(0).toUpperCase() + chatType.slice(1);
}

function linkifyChat(c, uid, is_joined=true, username){
	let cLink = window.location.origin + "/settings?id=" + uid;
	if(!is_joined){
		cLink = window.location.origin + "/joinchat?username=" + username + "&chat_id=" + uid;
	}
	return '<a href="' + cLink + '" style="text-decoration:none">' + c + '</a>';
}

async function whenLoaded(){
	document.getElementById("search").addEventListener("click", async function(e) {
		let response = await tellweb.searchUser(document.getElementById("searchText").value);
		console.log(response);
		if(response != "state.QUERY_EMPTY"){
			response = JSON.parse(response);
			let fullHtml = "";
			for(let i = 0; i < response["users"].length; i++){
				fullHtml += linkifyChat(new chats(response["users"][i]["name"], await convertIdToName(response["users"][i]["type"]), response["users"][i]["username"], response["users"][i]["id"], 0, "").buildComponent(), response["users"][i]["id"], response["users"][i]["joined"], response["users"][i]["username"]);
			}
			document.getElementById("chatList").innerHTML = fullHtml;
		}
	});
}

if(window.addEventListener){
	window.addEventListener('load', whenLoaded, false);
}else{
	window.attachEvent('onload', whenLoaded);
}