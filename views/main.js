'use strict';
//-------------------INIT-------------------
var server, localId;
var amScreen = false, screen = null;
var onCooldown = false;
var player = document.getElementById("hideo");
var localStream = null;
const videoChat = document.getElementsByClassName("video-container")[0];
const localVideo = document.getElementById("localVideo");
var peers = {}, colors = {};
var join = new Audio('media/join.mp3');
var neom = new Audio('media/message.mp3');
window.onload = () => navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(gotLocalMediaStream, handleLocalMediaStreamError);
//-------------------HTML-FORMS--------------
var chat = document.getElementById('chat');
var share = document.getElementById('share');
chat.addEventListener("submit", function (e) {
  e.preventDefault();
  if (onCooldown) return;
  var m = document.getElementById('m').value;
  if (m != "") {
    if (m == "/clear") socket.emit("clear");
    else server.send(JSON.stringify({ type: 'chat', message: m }));
    document.getElementById('m').value = "";
    onCooldown = true;
    setTimeout(() => {onCooldown = false}, 3000);
  }
});
share.addEventListener("click", function (e) {
  e.preventDefault();
  if (amScreen == false) {
    (screen == null) ? setScreen() : alert('Someone else is screensharing');
  } else {
    var [track] = screen.getVideoTracks();
    track.stop();
    track.dispatchEvent(new Event("ended"));
  }
});

function colorBorder() {
  for (let i in colors) {
    for (let el of document.getElementsByClassName(i)) el.style.borderBottom = `thick solid ${colors[i]}`;
  }
}

function gotLocalMediaStream(stream) {
  localVideo.srcObject = localStream = stream;
  updateLayout();
  init();
}

function handleLocalMediaStreamError(error) {
  navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(function(stream) {
    alert("no camera but a mic");
    localStream = stream;
    init();
  }, function(error) {
    alert("no camera or mic - won't connect");
  });
}

function mute() {
  localStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
    if (track.enabled == true) document.getElementsByClassName('my-float')[0].outerHTML = "<i class='fas fa-microphone-slash my-float'></i>";
    else document.getElementsByClassName('my-float')[0].outerHTML = "<i class='fas fa-microphone my-float'></i>";
  });
}

function hide() {
  localStream.getVideoTracks().forEach((track) => {
    track.enabled = !track.enabled;
    if (track.enabled == true) document.getElementsByClassName('my-floatcam')[0].outerHTML = "<i class='fas fa-video-slash my-floatcam'></i>";
    else document.getElementsByClassName('my-floatcam')[0].outerHTML = "<i class='fas fa-video my-floatcam'></i>";
  });
}

function setScreen() {
  navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).then(stream => {
    screen = stream;
    var [track] = screen.getVideoTracks();
    track.onended = function() {
      console.log(`Screenshare ended`);
      player.style.display = 'none';
      screen = null;
      amScreen = false;
      for (let sid in peers) peers[sid].removeStream(stream);
    }
    player.srcObject = screen;
    player.style.display = '';
    amScreen = true;
    for (let sid in peers) peers[sid].addStream(screen);
  });
}

function init() {
  server = new WebSocket('wss://' + location.hostname + ':' + location.port);
  server.onmessage = gotMessageFromServer;
  server.onopen = event => console.log("Connected to WebSocket!");
  server.onclose = function (e) {
    console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
    setTimeout(init, 1000);
  };
  server.onerror = function (err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    server.close();
  };
  // socket.on('connect', () => {
  //   document.getElementById("localVideo").className = socket.id;
  //   socket.emit("color", socket.id);
  //   colorBorder();
  // });
}

function gotMessageFromServer(message) {
  var signal = JSON.parse(message.data);

  switch (signal.type) {
    case ('initialise'):
      localId = signal.myid;
      document.getElementById('localVideo').className = localId;
      server.send(JSON.stringify({ type: "color", id: localId }));
      for (let id of signal.ids) {
        if (id === signal.myid) continue;
        var simplepeer = addPeer(id, true);
      }
      break;
    case ('signal'):
      if (signal.from in peers) {
        console.log('Simplepeer object does exist - accept signal');
      } else {
        console.log("Simplepeer object doesn't exist - making one");
        let simplepeer = addPeer(signal.from, false);
      }
      peers[signal.from].signal(signal.data);
      break;
    case ('chat'):
      if (signal.id != localId) neom.play();
      appendChat(signal);
      break;
    case ('peer_disconnect'):
      console.log("Peer has disconnected", signal.id);
      removePeer(signal.id);
      break;
    case ('color'):
      colors[signal.id] = signal.color;
      colorBorder();
      break;
  }

}

function appendChat(data) {
  var newmessage = document.createElement('li');
  newmessage.className = data.id;
  newmessage.textContent = data.message;
  document.getElementById('messageslist').appendChild(newmessage);
  var chat = document.getElementById('messages');
  colorBorder();
  chat.scrollTop = chat.scrollHeight;
  return true;
}

function updateLayout() {
  // update CSS grid based on number of diplayed videos
  var rowHeight = '16vh';
  var colWidth = '16vw';

  var numVideos = Object.keys(peers).length + 1; // add one to include local video

  if (numVideos > 1 && numVideos <= 4) { // 2x2 grid
    rowHeight = '48vh';
    colWidth = '48vw';
  } else if (numVideos > 4) { // 3x3 grid
    rowHeight = '32vh';
    colWidth = '32vw';
  }

  // document.documentElement.style.setProperty(`--rowHeight`, rowHeight);
  // document.documentElement.style.setProperty(`--colWidth`, colWidth);
}

function removePeer(ws_id) {
  let divEl = document.getElementById(ws_id);
  if (divEl) divEl.remove();
  if (peers[ws_id]) peers[ws_id].destroy();
  delete peers[ws_id];
}

function addPeer(sid, am_init) {
  var peer = new SimplePeer({initiator: am_init, trickle: false});
  peer.socket_id = sid;
  peer.on("signal", (data) => { server.send(JSON.stringify({ type: 'signal', to: sid, data: data })) });
  peer.on('connect', () => {
    console.log('Connected to peer', sid);
    if (localStream!=null) peer.addStream(localStream);
    if (screen!=null) peer.addStream(screen);
    console.log("Sending our stream");
  });
  peer.on("stream", (stream) => {
    console.log("Got stream from", sid);
    server.send(JSON.stringify({ type: "color", id: sid }));
    if (stream.getTracks().length === 2) {
      var newDiv = document.createElement("div");
      var newVid = document.createElement("video");
      newVid.setAttribute("playsinline", "");
      newVid.setAttribute("autoplay", true);
      newVid.srcObject = stream;
      newDiv.id = sid;
      newVid.className = sid;
      newDiv.appendChild(newVid);
      videoChat.appendChild(newDiv);
      updateLayout();
      join.play();
    } else {
      player.srcObject = stream;
      player.style.display = '';
      stream.onremovetrack = () => {
        console.log(`Screenshare ended`);
        player.style.display = 'none';
      };
    }
  });
  peers[sid] = peer;
  return peer;
}