'use strict';
//-------------------INIT-------------------
var username, screen = false, cam, mic, player, socket, localStream=null;
const videoChat = document.getElementById('video-container'), localVideo = document.getElementById('localVideo'), 
canvas = document.getElementById("myCanvas"), context = canvas.getContext("2d"), configuration = {iceServers: [{ urls: "stun:stun.l.google.com:19302", urls: "stun:stun1.l.google.com:19302" }]};
var peers = [];
//-------------------HTML-FORMS--------------
(!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ? $("#inp").focus() : null
$("#inp").keypress(function(e) {
    if (e.which == 13) {
        username = $("#inp").val();
        if (username!="") {loggedin(username)};
    }
});
$("form").submit(function(e) {
  e.preventDefault();
  var m = $("#m").val();
  if (m != "") {
    socket.emit("chat", {message: m, username: username});
    $("#m").val("");
  }
});
$("#share").click(function(e) {
  e.preventDefault();
  if (screen==false){
    setScreen();
  } else {
    unsetScreen();
  }
});
//END----------------HTML-FORMS----------------
//-------------------SOCKETS-------------------
// socket.on("refresh", function(){
//   location.reload();
// });
// socket.on("rr", function(url){
//   if (player) {
//     $('#rr').hide();
//     player.stopVideo();
//   } else {
//     var p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
//     if (url.match(p)) {
//       var vId= url.match(p)[1];
//     } else {
//       var vId = "dQw4w9WgXcQ"
//     }
//     player = new YT.Player("rr", {
//       height: "1920",
//       width: "1080",
//       videoId: vId,
//       events: {onReady: onPlayerReady}
//     });
//     }                  
//   function onPlayerReady(event) {
//     $('#rr').show();
//     event.target.playVideo();
//   }
// });
//END----------------SOCKETS-------------------
//-------------------FUNCTIONS-----------------
async function loggedin(un){
  $("#preload").hide();
  (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ? $("#m").focus() : null
  let searchParams = new URLSearchParams(window.location.search);
  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(gotLocalMediaStream, handleLocalMediaStreamError);
  window.onbeforeunload = function (e) {
    socket.emit('message', { type: 'bye', from: socket.id });
  }
}
function mute() {
  localStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
  if (mic == true) {
    mic = false;
    $(".my-float").replaceWith("<i class='fas fa-microphone-slash my-float'></i>");
  } else {
    mic = true;
    $(".my-float").replaceWith("<i class='fas fa-microphone my-float'></i>");
  }
}
function hide() {
  localStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
  if (cam == true) {
    cam = false;
    $(".my-floatcam").replaceWith("<i class='fas fa-video my-floatcam'></i>");
  } else {
    cam = true;
    $(".my-floatcam").replaceWith("<i class='fas fa-video-slash my-floatcam'></i>");
  }
}
function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
   }
   return result;
}
function gotLocalMediaStream(stream) {
  localVideo.srcObject = stream;
  localStream = stream;
  init();
}
function setScreen() {
    navigator.mediaDevices.getDisplayMedia().then(stream => {
        for (let socket_id in peers) {
            for (let index in peers[socket_id].streams[0].getTracks()) {
                for (let index2 in stream.getTracks()) {
                    if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                        peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                        stream.getTracks()[index2].onended = function(event) {
                          unsetScreen()
                        }
                        break;
                    }
                }
            }

        }
        localStream = stream

        localVideo.srcObject = localStream
        screen=true;
    })
}
function unsetScreen() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        for (let socket_id in peers) {
            for (let index in peers[socket_id].streams[0].getTracks()) {
                for (let index2 in stream.getTracks()) {
                    if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                        peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                        break;
                    }
                }
            }

        }
        localStream = stream

        localVideo.srcObject = localStream
        screen=false;
    })
}
function init() {
    socket = io();
    socket.on("chat", function(data) {
      if (data.message) {
        if (/^[/]/.test(data.message)) {
          const args = data.message.slice("/".length).trim().split(/ +/);
          const command = args.shift().toLowerCase();
          if (command=="rr") {
            if (args[0]) {
              rr(args[0]);
            } else {
              rr();
            }
          } else if (command=="clear") {
            $("#messageslist").empty();
          } else if (command=="refresh") {
            refresh();
          } else if (command=="canvasclear") {
            clearCanvas();
          }
          console.log("Command: "+command+"\n-----------------------------------\n"+args);
        } else {
        $("#messageslist").append(`<li><strong>${data.username}</strong>: ${data.message}</li>`);
        }
      } else if (data.image) {
        var id = makeid(5);
        let TYPED_ARRAY = new Uint8Array(data.image);
        const STRING_CHAR = TYPED_ARRAY.reduce((data, byte)=> {
          return data + String.fromCharCode(byte);
        }, '');
      let base64String = btoa(STRING_CHAR);
        $("#messageslist").append(`<li><strong>${data.username}</strong>: <a id=${id+'a'}><img src='' id=${id} style='height: 50px;'></a></li>`)
        $(`#${id}`).attr('src', `data:image/png;base64,${base64String}`);
      } else if (data.x0) {
        onDrawingEvent(data);
      }
    });
    socket.on('initReceive', socket_id => {
        console.log('Recieved from ' + socket_id)
        addPeer(socket_id, false)

        socket.emit('initSend', socket_id)
    })

    socket.on('initSend', socket_id => {
        console.log('Sending to ' + socket_id)
        addPeer(socket_id, true)
    })

    socket.on('removePeer', socket_id => {
        console.log('removing peer ' + socket_id)
        removePeer(socket_id)
    })

    socket.on('disconnect', () => {
        console.log('GOT DISCONNECTED')
        for (let socket_id in peers) {
            removePeer(socket_id)
        }
    })

    socket.on('signal', data => {
        peers[data.socket_id].signal(data.signal)
    })
}
function removePeer(socket_id) {

    let videoEl = document.getElementById(socket_id);
    let divEl = document.getElementById(socket_id+'div');
    if (videoEl) {

        const tracks = videoEl.srcObject.getTracks();

        tracks.forEach(function (track) {
            track.stop()
        })

        videoEl.srcObject = null
        videoEl.parentNode.removeChild(videoEl)
    }
    if (peers[socket_id]) peers[socket_id].destroy()
    delete peers[socket_id]
}
function addPeer(socket_id, am_initiator) {
    peers[socket_id] = new SimplePeer({
        initiator: am_initiator,
        stream: localStream,
        config: configuration
    })

    peers[socket_id].on('signal', data => {
        socket.emit('signal', {
            signal: data,
            socket_id: socket_id
        })
    })

    peers[socket_id].on('stream', stream => {
        var newDiv = document.createElement('div');
        var newVid = document.createElement('video');
        newVid.setAttribute('playsinline', '');
        newVid.srcObject = stream
        newDiv.id = socket_id+'div';
        newVid.id = socket_id;
        newVid.autoplay = true
        newVid.onclick = () => openPictureMode(newVid)
        newVid.ontouchstart = (e) => openPictureMode(newVid)
        newDiv.appendChild(newVid)
        videoChat.appendChild(newDiv)
    })
}
function openPictureMode(el) {
    console.log('opening pip')
    el.requestPictureInPicture()
}
function handleLocalMediaStreamError(error) {
  let silence = () => {
  let ctx = new AudioContext(), oscillator = ctx.createOscillator();
  let dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false});
}
let black = ({width = 640, height = 480} = {}) => {
  let canvas = Object.assign(document.createElement("canvas"), {width, height});
  canvas.getContext('2d').fillRect(0, 0, width, height);
  let stream = canvas.captureStream();
  return Object.assign(stream.getVideoTracks()[0], {enabled: false});
}
let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
    localStream = blackSilence();
    localVideo.srcObject = blackSilence();
    console.log('navigator.getUserMedia error: ', error);
}
//END----------------FUNCTIONS-----------------
//-------------------DRAWING-------------------
function clearCanvas(){
  context.clearRect(0, 0, canvas.width, canvas.height);
};
var current = {
    color: 'black'
  };
  var drawing = false;

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
  canvas.addEventListener('touchstart', onMouseDown, false);
  canvas.addEventListener('touchend', onMouseUp, false);
  canvas.addEventListener('touchcancel', onMouseUp, false);
  canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

  // window.addEventListener('resize', onResize, false);
  $(document).ready(function() { 
    // onResize()
  canvas.width = $("#canvas").width();
  canvas.height = $("#canvas").height();
  });
  // // make the canvas fill its parent
  // function onResize() {
  //   canvas.width = $("#canvas").width();
  //   canvas.height = $("#canvas").height();
  // }

  function drawLine(x0, y0, x1, y1, color, emit){
    context.beginPath();
    context.moveTo(x0, y0-200);
    context.lineTo(x1, y1-200);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('chat', {x0: x0 / w, y0: y0 / h, x1: x1 / w, y1: y1 / h, color: color});
  }

  function onMouseDown(e){
    drawing = true;
    current.x = e.clientX||e.touches[0].clientX;
    current.y = e.clientY||e.touches[0].clientY;
  }
  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, current.color, true);
  }
  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, current.color, true);
    current.x = e.clientX||e.touches[0].clientX;
    current.y = e.clientY||e.touches[0].clientY;
  }
  function onColorUpdate(e){
    current.color = e.target.className.split(' ')[1];
  }
  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }
  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }
var parent = document.querySelector('#color');
var picker = new Picker({parent: parent, popup: 'top', alpha: false, editor: false, color: current.color});
picker.onChange = function(color) {
  current.color = color.rgbaString;
};
function refresh(){
  socket.emit("refresh")
}
function rr(url){
  if (url) {
    socket.emit("rr", url);
  } else {
    socket.emit("rr", "https://ia801602.us.archive.org/11/items/Rick_Astley_Never_Gonna_Give_You_Up/Rick_Astley_Never_Gonna_Give_You_Up.mp4");
  }
}
$('.drop').on('drop dragdrop',function(e){
  e.preventDefault();
  var img = e.originalEvent.dataTransfer.items[0].getAsFile();
  socket.emit("chat", {image: img, username: username})
});
$('.drop').on('dragenter',function(e){
    e.preventDefault();
})
$('.drop').on('dragleave',function(){
})
$('.drop').on('dragover',function(event){
    event.preventDefault();
})
//-------------------END-------------------