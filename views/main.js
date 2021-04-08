'use strict';
//-------------------INIT-------------------
var server;
var localId;
var amScreen = false, screen = null;
var onCooldown = false;
var player = document.getElementById("hideo");
var localStream = null;
const videoChat = document.getElementsByClassName("video-container")[0];
const localVideo = document.getElementById("localVideo");
var peers = {}, colours = {};
var join = new Howl({src: ['media/join.mp3']});
var neom = new Howl({ src: ['media/message.mp3'], volume: 0.3 });
window.onload = () => {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(gotLocalMediaStream, handleLocalMediaStreamError);
};
//-------------------HTML-FORMS--------------
$("#chat").submit(function (e) {
  e.preventDefault();
  if (onCooldown) return;
  var m = $("#m").val();
  if (m != "") {
    if (/^[\/]/.test(m)) {
      const args = m.slice("/".length).trim().split(/\s+/);
      const command = args.shift().toLowerCase();
      if (command == "clear") socket.emit("clear");
    } else server.send(JSON.stringify({ type: 'chat', message: m }));
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
    var [track] = screen.getVideoTracks();
    track.stop();
    track.dispatchEvent(new Event("ended"));
  }
});

function colourBorder() {
  for (let i in colours) {
    var x = document.getElementsByClassName(i);
    for (let el of x) el.style.borderBottom = `thick solid ${colours[i]}`;
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
      console.log(`Screenshare ended`);
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
    for (let sid in peers) peers[sid].addStream(screen);
  });
}

function init() {
  if (new URL(window.location.href).searchParams.get('admin')!=null) $('#share').show();
  server = new WebSocket('wss://' + location.hostname + ':' + location.port);
  server.onmessage = gotMessageFromServer;
  server.onopen = event => {
    console.log("Connected to WebSocket!");
  };
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
  //   socket.emit("colour", socket.id);
  //   colourBorder();
  // });
}

function gotMessageFromServer(message) {
  var signal = JSON.parse(message.data);

  switch (signal.type) {
    case ('initialise'):
      localId = signal.myid;
      document.getElementById('localVideo').className = localId;
      server.send(JSON.stringify({ type: "colour", id: localId }));
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
    case ('colour'):
      colours[signal.id] = signal.colour;
      colourBorder();
      break;
  }

}

function appendChat(data) {
  $("#messageslist").append(`<li class=${data.id}>${data.message}</li>`);
  var chat = document.getElementById('messages');
  colourBorder();
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
    server.send(JSON.stringify({ type: "colour", id: sid }));
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
      var newVid = document.getElementById("hideo");
      newVid.srcObject = stream;
      $('#hideo').show();
      stream.onremovetrack = () => {
        console.log(`Screenshare ended`);
        $('#hideo').hide();
      };
    }
  });
  peers[sid] = peer;
  return peer;
}