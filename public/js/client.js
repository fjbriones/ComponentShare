//initiate socket connection
var socket = io.connect('http://10.158.3.101:3000');
var myID = 0;
var hisID = 0;
//on page load emit mathced string to enable chat
socket.emit("matched");
//need to check if owner id is the current user
socket.on("own", function(data){
	console.log(data);
	$("#user_id").val(data);
	$("#username").val(data);

	myID = data;
});

//need to check if requester id is the current user
socket.on("req", function(data){
	console.log(data);
	$("#user_to").val(data);
	hisID = data;
});


socket.on("currentuser", function(data){ //check lang
	console.log("current user: " +data);
});

//handle loaded data from message database
socket.on("thread", function(data) {
	$("#typing").html("");
	if(data.user_to == myID && data.user_id == hisID){
		$("#thread").append("<li><b>" +data.username+ "</b> : " + data.message + "</li>");
	} else if (data.user_id == myID && data.user_to == hisID) {
		$("#thread").append("<li><b>" +data.username+ "</b> : " + data.message + "</li>");
	}
});

//Show "typing..." message
socket.on("typing", function(data){
	if(data.user_to == myID && data.user_id ==hisID){
		if(data.status == true){
			$("#typing").html("<li> typing...</li>");
		}else{
			$("#typing").html("");
		}
	}
});

//emit form contents to socket
$("#send").click(function(){
	var user_id = $("#user_id").val();
	var username = $("#username").val();
	var user_to = $("#user_to").val();
	var message = $("#message").val();

	var msg = {
		user_id : user_id,
		username : username,
		user_to : user_to,
		message : message,
	};
	socket.emit("messages", msg);
	console.log(msg);
	$("#message").val(" ");
	return false;
});

var timeout;
function timeoutFunction(){
	var typo = {
		user_to : hisID,
		user_id : myID,
		status: false
	}
	socket.emit("is_typing", typo);
}

$("#message").keypress(function(e){
	if(e.which !== 13){
		var typo = {
			user_to : hisID,
			user_id : myID,
			status: true
		}
		socket.emit("is_typing", typo);
		clearTimeout(timeout);
		timeout = setTimeout(function() {}, 2000);

	}else{
		clearTimeout(timeout);
		timeoutFunction();
	}
});

//$("#saveID").click(function(){
//	var val = $("#user_id").val();
//	var his = $("#user_to").val();
//	myID = val;
//	hisID = his;
//});
	