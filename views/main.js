'use strict';
//-------------------INIT-------------------
var socket;
var amScreen = false, screen = null;
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

var onCooldown = false;
$("#chat").submit(function (e) {
  e.preventDefault();
  if (onCooldown) return;
  var m = $("#m").val();
  if (m != "") {
    if (/^[\/]/.test(m)) {
      const args = m.slice("/".length).trim().split(/\s+/);
      const command = args.shift().toLowerCase();
      if (command == "clear") socket.emit("clear");
    } else socket.emit("chat", {message: m, id: socket.id});
    $("#m").val("");
    onCooldown = true;
    setTimeout(function() {onCooldown = false}, 3000);
  }
});
$("#share").on("click", function (e) {
  e.preventDefault();
  if (amScreen == false) {
    if (screen == null) {
      setScreen();
    } else {
      alert('Someone else is screensharing');
    }
  } else {
    screen.getTracks().forEach(track => {
      track.stop();
      track.dispatchEvent(new Event("ended"));
    });
  }
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
  navigator.mediaDevices.getDisplayMedia({video: true, audio: false}).then((stream) => {
    screen = stream;  
    var [track] = screen.getVideoTracks();
    track.onended = function() {
      console.log('screen ended');
      $('#hideo').hide();
      screen = null;
      amScreen = false;        
      for (let sid in peers) {
        peers[sid].removeStream(stream);
      }
    }
    var newVid = document.getElementById("hideo");
    newVid.srcObject = screen;
    $('#hideo').show();
    amScreen = true;
    for (let sid in peers) {
      peers[sid].addStream(screen);
    }
  });
}

function init() {
  if (new URL(window.location.href).searchParams.get('admin')!=null) $('#share').show();
  socket = io();
  socket.on('connect', function() {
    console.log("**Socket Connected** ID:", socket.id);
    colourBorder("local", socket.id);
  });
  socket.on('peer_disconnect', function(data) {
    console.log("Peer has disconnected " + data);
    removePeer(data);	
  });
  socket.on('list', function (data) {
    for (let i = 0; i < data.length; i++) {
      if (data[i] != socket.id) {	
        var simplepeer = addPeer(data[i], true);
        peers.push(simplepeer);
      }
    }
  });
  socket.on('signal', function(to, from, data) {
    console.log("Got a signal from the server: ", to, from);
    if (to != socket.id) {
      return console.log("Socket IDs don't match");
    }
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
  socket.on("chat", (data) => {
    if (data.id != socket.id) {
      var instance = createjs.Sound.play("message");
      instance.volume = 0.2;
    }
    appendChat(data);
  });
  socket.on("chats", (chats) => {
    $('#messageslist').empty();
    chats.forEach(chat => appendChat(chat));
  });
}

function appendChat(data) {
  $("#messageslist").append(`<li class=${data.id}>${data.message}</li>`);
  colourBorder(data.id, data.id);
  var chat = document.getElementById('messages');
  chat.scrollTop = chat.scrollHeight;
  return true;
}

function removePeer(socket_id) {
  let divEl = document.getElementById(socket_id + "div");
  if (divEl) divEl.remove();
  if (peers[socket_id]) peers[socket_id].destroy();
  delete peers[socket_id];
}

function addPeer(sid, am_init) {
  var peer = new SimplePeer({initiator: am_init, trickle: false});
  peer.socket_id=sid;
  peer.on("signal", (data) => {
    socket.emit("signal", sid, socket.id, data);
  });
  peer.on('connect', () => {
    console.log('Connected');
    if (localStream!=null) peer.addStream(localStream);
    if (screen!=null) peer.addStream(screen);
    console.log("Sending our stream");
  });
  peer.on("stream", (stream) => {
    console.log(stream.getTracks())
    if (stream.getTracks().length === 2) {
      console.log('video')
      var newDiv = document.createElement("div");
      var newVid = document.createElement("video");
      newVid.setAttribute("playsinline", "");
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
    } else {
      console.log('screen');
      var newVid = document.getElementById("hideo");
      newVid.srcObject = stream;
      $('#hideo').show();
      stream.onremovetrack = ({track}) => {
        console.log(`screen was removed.`);
        $('#hideo').hide();
      };
    }
  });
  return peer;
}

navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(gotLocalMediaStream, handleLocalMediaStreamError);