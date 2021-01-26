'use strict';
//-------------------INIT-------------------
var username;
var socket;
var screen = false;
var player = document.getElementById("hideo");
var localStream = null;
const videoChat = document.getElementsByClassName("video-container")[0];
const localVideo = document.getElementById("localVideo");
var peers = [];
createjs.Sound.alternateExtensions = ["mp3"];
createjs.Sound.registerSound("media/join.mp3", "join");
createjs.Sound.registerSound("media/disconnect.mp3", "disconnect");
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

function gotLocalMediaStream(stream) {
  localVideo.srcObject = localStream = stream;
  init();
}

function handleLocalMediaStreamError(error) {
  notifi("Fail", error.name);
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
    if (track.enabled == true)
      $(".my-floatcam").replaceWith(
        "<i class='fas fa-video-slash my-floatcam'></i>"
      );
    else
      $(".my-floatcam").replaceWith("<i class='fas fa-video my-floatcam'></i>");
  });
}

function setScreen() {
  navigator.mediaDevices.getDisplayMedia({video: {width: 300},audio: true}).then((stream) => {
    for (let sid in peers) {
      for (let index in peers[sid].streams[0].getTracks()) {
        for (let index2 in stream.getTracks()) {
          if (peers[sid].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
            peers[sid].replaceTrack(peers[sid].streams[0].getTracks()[index], stream.getTracks()[index2], peers[sid].streams[0]);
            stream.getTracks()[index2].onended = function (event) {
              unsetScreen();
            };
            break;
          }
        }
      }
    }
    localVideo.srcObject = localStream = stream;
    screen = true;
  });
}

function unsetScreen() {
 navigator.mediaDevices.getUserMedia({video: {width: 300},audio: true}).then((stream) => {
    for (let sid in peers) {
      for (let index in peers[sid].streams[0].getTracks()) {
        for (let index2 in stream.getTracks()) {
          if (peers[sid].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
            peers[sid].replaceTrack(peers[sid].streams[0].getTracks()[index], stream.getTracks()[index2], peers[sid].streams[0]);
            break;
          }
        }
      }
    }
    localVideo.srcObject = localStream = stream;
    screen = false;
  });
}

function init() {
  socket = io();
  socket.on('connect', function() {
    console.log("**Socket Connected**");
    console.log("My socket id: ", socket.id);

    socket.emit('list');
  });
  socket.on('disconnect', function(data) {
    console.log("Socket disconnected");
    //for (let sid in peers) removePeer(sid);
  });
  socket.on('peer_disconnect', function(data) {
    console.log("simplepeer has disconnected " + data);
    removePeer(data);	
  });
  socket.on('listresults', function (data) {
    console.log(data);
    for (let i = 0; i < data.length; i++) {
      // Make sure it's not us
      if (data[i] != socket.id) {	

        // create a new simplepeer and we'll be the "initiator"			
        let simplepeer = addPeer(data[i], true);

        // Push into our array
        peers.push(simplepeer);	
      }
    }
  });
  socket.on('signal', function(to, from, data) {
				
    console.log("Got a signal from the server: ", to, from, data);

    // to should be us
    if (to != socket.id) {
      console.log("Socket IDs don't match");
    }
  
    // Look for the right simplepeer in our array
    let found = false;
    for (let i = 0; i < peers.length; i++)
    {
      
      if (peers[i].socket_id == from) {
        console.log("Found right object");
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
  socket.on("refresh", () => location.reload());
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
      document.getElementById("confetti").style.display = "block";
    } else {
      var video_id = url.split('v=')[1];
      var aP = video_id.indexOf('&');
      if (aP != -1) video_id = video_id.substring(0, aP);
      player.src = `https://invidious.kavin.rocks/latest_version?id=${video_id}&itag=22`
      player.load();
      player.style.display = "block";
      document.getElementById("confetti").style.display = "none";
      player.play();
    }
  });
  socket.on("chat", (data) => {
    if (data.id != socket.id) {
      var instance = createjs.Sound.play("message");
      instance.volume = 0.2;
    }
    $("#messageslist").append(`<li>${data.message}</li>`);
  });
}

function removePeer(socket_id) {
  let videoEl = document.getElementById(socket_id);
  let divEl = document.getElementById(socket_id + "div");
  if (videoEl) {
    videoEl.srcObject.getTracks().forEach((track) => track.stop());
    videoEl.srcObject = null;
    divEl.parentNode.removeChild(divEl);
    videoEl.parentNode.removeChild(videoEl);
  }
  if (peers[socket_id]) peers[socket_id].destroy();
  delete peers[socket_id];
}

function addPeer(sid, am_init) {
  peers[sid] = new SimplePeer({initiator: am_init, stream: localStream});
  peers[sid].on("signal", (data) => {
    console.log(data)
    socket.emit("signal", {signal: data, socket_id: sid});
  });
  peers[sid].on("stream", (stream) => {
    var newDiv = document.createElement("div");
    var newVid = document.createElement("video");
    newVid.setAttribute("playsinline", "");
    newVid.srcObject = stream;
    newDiv.id = sid + "div";
    newVid.id = sid;
    newVid.autoplay = true;
    newDiv.appendChild(newVid);
    videoChat.appendChild(newDiv);
    var instance = createjs.Sound.play("join");
    instance.volume = 0.5;
  });
}
navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(gotLocalMediaStream, handleLocalMediaStreamError);