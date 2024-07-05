"use strict";
//-------------------INIT-------------------
let server, localId;
let amScreen = false, screen = null;
let localStream = null;
let onCooldown = false;

const player = document.getElementById("hideo");
const videoChat = document.getElementsByClassName("video-container")[0];
const localVideo = document.getElementById("localVideo");

let peers = {}, colors = {};

let join = new Audio('media/join.mp3');
let neom = new Audio('media/message.mp3');

window.onload = () => navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(gotLocalMediaStream, handleLocalMediaStreamError);
//-------------------HTML-FORMS--------------
const chat = document.getElementById('chat');
const share = document.getElementById('share');
chat.addEventListener("submit", function(e) {
  e.preventDefault();
  if (onCooldown) return;
  let m = document.getElementById('m').value;
  if (m != "") {
    server.send(JSON.stringify({ type: 'chat', message: m }));
    document.getElementById('m').value = "";
    onCooldown = true;
    setTimeout(() => {onCooldown = false}, 300);
  }
});
share.addEventListener("click", function (e) {
  e.preventDefault();
  if (amScreen == false) {
    (screen == null) ? setScreen() : alert('Someone else is screensharing');
  } else {
    let [track] = screen.getVideoTracks();
    track.stop();
    track.dispatchEvent(new Event("ended"));
  }
});

function colorBorder() {
  for (let i in colors) {
    let colorElements = document.getElementsByClassName(i);
    for (let el of colorElements) el.style.borderBottom = `thick solid ${colors[i]}`;
  }
}

function generatePlaceholder() {
  const imgPlaceholder = new Image();
  imgPlaceholder.src = "https://images.placeholders.dev/?width=320&height=220&text=No%20Camera";
  imgPlaceholder.id = "localVideo";
  return imgPlaceholder
}

function gotLocalMediaStream(stream) {
  localStream = stream;
  if (stream.getVideoTracks().length == 0) {
    localVideo.parentNode.replaceChild(generatePlaceholder(), localVideo);
  } else {
    localVideo.srcObject = localStream;
  }
  init();
}

function handleLocalMediaStreamError(error) {
  navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(function(stream) {
    localVideo.parentNode.replaceChild(generatePlaceholder(), localVideo);
    localStream = stream;
    init();
  }, function(error) {
    alert("no camera or mic - won't connect");
  });
}

function mute() {
  localStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
    document.getElementsByClassName('my-float')[0].outerHTML = `<i class='fas fa-microphone${track.enabled == true ? '-slash' : ''} my-float'></i>`;
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
  navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then(stream => {
    screen = stream;
    const [track] = screen.getVideoTracks();
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
    for (const peer in peers) removePeer(peer);
    setTimeout(init, 1000);
  };
  server.onerror = function (err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    for (const peer in peers) removePeer(peer);
    server.close();
  };
}

function gotMessageFromServer(message) {
  const signal = JSON.parse(message.data);
  switch (signal.type) {
    case ('init'):
      localId = signal.myid;
      document.getElementById('localVideo').className = localId;
      server.send(JSON.stringify({ type: "color", id: localId }));
      for (let id of signal.ids) {
        if (id === signal.myid) continue;
        addPeer(id, true);
      }
      break;
    case ('signal'):
      if (signal.from in peers) {
        console.log('Simplepeer object does exist - accept signal');
      } else {
        console.log("Simplepeer object doesn't exist - making one");
        addPeer(signal.from, false);
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
    case ('gameStateUpdate'):
      // updateGameState(signal);
      break;
  }
}

function appendChat(data) {
  const newmessage = document.createElement('li');
  newmessage.className = data.id;
  newmessage.textContent = data.message;
  document.getElementById('messageslist').appendChild(newmessage);
  const chat = document.getElementById('messages');
  colorBorder();
  chat.scrollTop = chat.scrollHeight;
  return true;
}

function removePeer(ws_id) {
  let divEl = document.getElementById(ws_id);
  if (divEl) divEl.remove();
  if (peers[ws_id]) peers[ws_id].destroy();
  delete peers[ws_id];
}

function addPeer(sid, am_init) {
  const peer = new SimplePeer({
    initiator: am_init,
    config: {
      iceServers: [
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        {
          urls: "turn:turn.bistri.com:80",
          credential: "homeo",
          username: "homeo",
        },
        {
          urls: "turn:turn.anyfirewall.com:443?transport=tcp",
          credential: "webrtc",
          username: "webrtc",
        }
      ]
    }
  });
  peer.on("signal", (data) => server.send(JSON.stringify({ type: 'signal', to: sid, data: data })));
  peer.on("connect", () => {
    console.log(`Connected to peer ${sid}`);
    if (!colors[sid]) server.send(JSON.stringify({ type: "color", id: sid }));
    if (localStream != null) peer.addStream(localStream);
    if (screen != null) peer.addStream(screen);
  });
  peer.on("stream", (stream) => {
    console.log(`Got stream from ${sid}`);
    if (stream.getTracks().length === 2) {
      const newDiv = document.createElement("div");
      const newVid = document.createElement("video");
      newVid.setAttribute("playsinline", "");
      newVid.setAttribute("autoplay", true);
      newVid.srcObject = stream;
      newDiv.id = sid;
      newVid.className = sid;
      newDiv.appendChild(newVid);
      videoChat.appendChild(newDiv);
      join.play();
    } else {
      screen = stream;
      player.srcObject = stream;
      player.style.display = '';
      stream.onremovetrack = () => {
        console.log("Screenshare ended");
        player.style.display = "none";
        screen = null;
      };
    }
  });
  peer.on('error', (err) => {
    console.warn(err);
  });
  peers[sid] = peer;
  return peer;
}