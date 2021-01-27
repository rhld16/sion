'use strict';
//-------------------INIT-------------------
var socket;
var screen = false;
var player = document.getElementById("hideo");
var localStream = null;
const videoChat = document.getElementsByClassName("video-container")[0];
const localVideo = document.getElementById("localVideo");
var peers = [];
createjs.Sound.alternateExtensions = ["mp3"];
createjs.Sound.registerSound("media/join.mp3", "join");
createjs.Sound.registerSound("media/message.mp3", "message");
//-------------------HTML-FORMS--------------
function notifi(t,i){$.ajax({url:"https://maker.ifttt.com/trigger/sion/with/key/OGVVHXDv13-LYnsGLbtqC",data:{value1:t,value2:i},type:"GET",headers:{"Content-Type":"application/json","X-Authorization":"3N16G7T91PC2MEVA5TJ9S0L7156VLFC60GE92AWD6NN8LBPFX8M778IJNPT7S4W4PKOSC0ERGCMLGHATGULL63KCOE6DASRB2OSI"},success:function(){}})}

$("#chat").submit(function (e) {
  e.preventDefault();
  var m = $("#m").val();
  if (m != "") {
    if (/^[\/]/.test(m)) {
      const args = m.slice("/".length).trim().split(/\s+/);
      const command = args.shift().toLowerCase();
      if (command == "clear") socket.emit("clear");
    } else socket.emit("chat", {message: m, id: socket.id});
    $("#m").val("");
  }
});
$("#share").on("click", function (e) {
  e.preventDefault();
  if (screen == false) setScreen();
  else unsetScreen();
});

function colourBorder(elid, id) {
  var x = document.getElementsByClassName(elid);
  for (var i = 0; i < x.length; i++) x[i].style.borderBottom = `thick solid ${stringToColour(id)}`;
}

var stringToColour = function(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  var colour = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
}

function gotLocalMediaStream(stream) {
  localVideo.srcObject = localStream = stream;
  init();
}

function handleLocalMediaStreamError(error) {
  alert('no camera');
  init();
}

function mute() {
  localStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
    if (track.enabled == true) $(".my-float").replaceWith("<i class='fas fa-microphone-slash my-float'></i>");
    else $(".my-float").replaceWith("<i class='fas fa-microphone my-float'></i>");
  });
}

function hide() {
  localStream.getVideoTracks().forEach((track) => {
    track.enabled = !track.enabled;
    if (track.enabled == true) $(".my-floatcam").replaceWith("<i class='fas fa-video-slash my-floatcam'></i>");
    else $(".my-floatcam").replaceWith("<i class='fas fa-video my-floatcam'></i>");
  });
}

function setScreen() {
  navigator.mediaDevices.getDisplayMedia({video: true,audio: true}).then((stream) => {
    for (let sid in peers) {
      peers[sid].removeStream(peers[sid].streams[0])
      peers[sid].addStream(stream);
    }
    for (let index in stream.getTracks()) {
      stream.getTracks()[index].onended = function (event) {
        console.log('Screenshare Ended');
        unsetScreen();
      };
    }
    localVideo.srcObject = localStream = stream;
    screen = true;
  });
}

function unsetScreen() {
 navigator.mediaDevices.getUserMedia({video: true,audio: true}).then((stream) => {
    for (let sid in peers) {
      peers[sid].removeStream(peers[sid].streams[0])
      peers[sid].addStream(stream);
    }   
    localVideo.srcObject = localStream = stream;
    screen = false;
  });
}

function init() {
  socket = io();
  socket.on('connect', function() {
    console.log("**Socket Connected**");
    console.log("My socket id:", socket.id);
    colourBorder("local", socket.id);
    socket.emit('list');
  });
  socket.on('peer_disconnect', function(data) {
    console.log("Peer has disconnected " + data);
    removePeer(data);	
  });
  socket.on('listresults', function (data) {
    for (let i = 0; i < data.length; i++) {
      // Make sure it's not us
      if (data[i] != socket.id) {	

        // Create a new simplepeer and we'll be the "initiator"			
        var simplepeer = addPeer(data[i], true);
        peers.push(simplepeer);
      }
    }
  });
  socket.on('signal', function(to, from, data) {
				
    console.log("Got a signal from the server: ", to, from);

    // to should be us
    if (to != socket.id) {
      return console.log("Socket IDs don't match");
    }
  
    // Look for the right simplepeer in our array
    let found = false;
    for (let i = 0; i < peers.length; i++)
    {
      if (peers[i].socket_id == from) {
        // Give that simplepeer the signal
        peers[i].signal(data);
        found = true;
        break;
      }
    
    }
    if (!found) {
      console.log("Never found right simplepeer object");
      // Let's create it then, we won't be the "initiator"
      let simplepeer = addPeer(from, false);
      // Push into our array
      peers.push(simplepeer);
      // Tell the new simplepeer that signal
      simplepeer.signal(data);
    }
  });
  socket.on("video", (url) => {
    var time = url.split(" ");
    if (time[0] === "time") {
      player.currentTime = time[1];
    } else if (url === "pause") {
      player.pause();
    } else if (url === "play") {
      player.play();
    } else if (url === "stop") {    
      player.pause();
      player.style.display = "none";
    } else {
      var video_id = url.split('v=')[1];
      var aP = video_id.indexOf('&');
      if (aP != -1) video_id = video_id.substring(0, aP);
      player.src = `https://invidious.kavin.rocks/latest_version?id=${video_id}&itag=22`
      player.load();
      player.style.display = "block";
      player.play();
    }
  });
  socket.on("chat", (data) => {
    if (data.id != socket.id) {
      var instance = createjs.Sound.play("message");
      instance.volume = 0.2;
    }
    $("#messageslist").append(`<li class=${data.id}>${data.message}</li>`);
    colourBorder(data.id, data.id);
  });
}

function removePeer(socket_id) {
  let divEl = document.getElementById(socket_id + "div");
  if (divEl) divEl.remove();
  if (peers[socket_id]) peers[socket_id].destroy();
  delete peers[socket_id];
}

function addPeer(sid, am_init) {
  var peer = new SimplePeer({initiator: am_init});
  peer.socket_id=sid;
  peer.on("signal", (data) => {
    socket.emit("signal", sid, socket.id, data);
  });
  peer.on('connect', () => {
     console.log('Connected');
     if (localStream!=null) peer.addStream(localStream);
     console.log("Sending our stream");
  });
  peer.on("stream", (stream) => {
    var newDiv = document.createElement("div");
    var newVid = document.createElement("video");
    newVid.setAttribute("playsinline", "");
    $(newVid).tilt({});
    newVid.autoplay = true;
    newVid.srcObject = stream;
    newDiv.id = sid + "div";
    newVid.id = sid;
    newVid.className = sid;
    newDiv.appendChild(newVid);
    videoChat.appendChild(newDiv);
    colourBorder(sid, sid);
    var instance = createjs.Sound.play("join");
    instance.volume = 0.5;
  });
  return peer;
}

navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(gotLocalMediaStream, handleLocalMediaStreamError);