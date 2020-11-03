"use strict";
//-------------------INIT-------------------
var username;
var socket;
var player;
var screen = false;
var localStream=null;
var coord = { x: 0, y: 0 };
const videoChat = document.getElementsByClassName("video-container")[0];
const localVideo = document.getElementById("localVideo");
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
var peers = [];
var current = {
    color: "black",
    size: 5
  };
//-------------------HTML-FORMS--------------
(!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i).test(navigator.userAgent)) ? $("#inp").focus() : null
$("#inp").keypress(function(e) {
    if (e.which == 13) {
        username = $("#inp").val();
        if (username!="") {
            loggedin();
        }
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
// socket.on("rr", function(url){
//   if (player) {
//     $("#rr").hide();
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
//     $("#rr").show();
//     event.target.playVideo();
//   }
// });
//END----------------SOCKETS-------------------
//-------------------FUNCTIONS-----------------
function loggedin(){
  $("#preload").hide();
  var searchParams = new URLSearchParams(window.location.search);
  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(gotLocalMediaStream, handleLocalMediaStreamError);
}
function mute() {
  localStream.getAudioTracks().forEach(track => {
    track.enabled = !track.enabled
    if (track.enabled==true) {
    $(".my-float").replaceWith("<i class='fas fa-microphone-slash my-float'></i>");
  } else {
    $(".my-float").replaceWith("<i class='fas fa-microphone my-float'></i>");
  }
  });
}
function hide() {
  localStream.getVideoTracks().forEach(track => {
    track.enabled = !track.enabled
    if (track.enabled==true) {
      $(".my-floatcam").replaceWith("<i class='fas fa-video-slash my-floatcam'></i>");
    } else {
      $(".my-floatcam").replaceWith("<i class='fas fa-video my-floatcam'></i>");
    }
  });
}
function makeid(length) {
   var result           = "";
   var characters       = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
   }
   return result;
}
function gotLocalMediaStream(stream) {
  localVideo.onclick = () => openPictureMode(localVideo)
  localVideo.ontouchstart = (e) => openPictureMode(localVideo)
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
    socket.emit("login", username);
    socket.on("chat", function(data) {
      if (data.message) {
        if (/^[\/]/.test(data.message)) {
          const args = data.message.slice("/".length).trim().split(/\s+/);
          const command = args.shift().toLowerCase();
          if (command=="rr") {
            if (args[0]) {
              rr(args[0]);
            } else {
              rr();
            }
          } else if (command=="clear") {
            socket.emit("clear");
          } else if (command=="refresh") {
            socket.emit("refresh");
          } else if (command=="canvasclear") {
            clearCanvas();
            socket.emit("draw", "clear")
          } else {
            //$("#messageslist").append(`<li><strong>Invalid Command</strong></li>`);
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
        }, "");
      let base64String = btoa(STRING_CHAR);
        $("#messageslist").append(`<li><strong>${data.username}</strong>: <a id=${id+"a"}><img src="" id=${id} style="height: 50px;"></a></li>`)
        $(`#${id}`).attr("src", `data:image/png;base64,${base64String}`);
      }
    });
    socket.on("draw", data => {
      drawStream(data);
    });
    socket.on("username", u => {
      $("#usernameslist").empty();
      u.forEach(function(ul){
        if (ul.toLowerCase()==="rhodri"){
          $("#usernameslist").append(`<li style="color:gold;">${ul}</li>`);
        } else {
          $("#usernameslist").append(`<li>${ul}</li>`);
        }
      })
    })
    socket.on("initReceive", socket_id => {
        console.log("Recieved from " + socket_id)
        addPeer(socket_id, false)
        socket.emit("initSend", socket_id)
    })
    socket.on("initSend", socket_id => {
        console.log("Sending to " + socket_id)
        addPeer(socket_id, true)
    })
    socket.on("removePeer", socket_id => {
        console.log("removing peer " + socket_id)
        removePeer(socket_id)
    })
    socket.on("disconnect", () => {
        console.log("GOT DISCONNECTED")
        for (let socket_id in peers) {
            removePeer(socket_id)
        }
    })
    socket.on("signal", data => {
        peers[data.socket_id].signal(data.signal)
    })
    socket.on("refresh", function(){
      location.reload();
    });
    socket.on("clear", data => {
      $("#messageslist").empty();
    });
    socket.on("history", data => {
      for (var plot in data) {
        drawStream(data[plot])
      }
    });
    Mousetrap.bind("mod+m", function() { mute() });
    Mousetrap.bind("mod+c", function() { hide() });
}
function removePeer(socket_id) {

    let videoEl = document.getElementById(socket_id);
    let divEl = document.getElementById(socket_id+"div");
    if (videoEl) {

        const tracks = videoEl.srcObject.getTracks();

        tracks.forEach(function (track) {
            track.stop()
        })

        videoEl.srcObject = null
        divEl.parentNode.removeChild(divEl)
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

    peers[socket_id].on("signal", data => {
        socket.emit("signal", {
            signal: data,
            socket_id: socket_id
        })
    })
    createjs.Sound.registerSound("https://cdn.glitch.com/a2e2dfed-f59c-45b2-9084-040367922816%2Fy2mate.com%20-%20Discord%20Join%20Sound%20Effect%20(download).mp3", "join");
    peers[socket_id].on("stream", stream => {
        var newDiv = document.createElement("div");
        var newVid = document.createElement("video");
        newVid.setAttribute("playsinline", "");
        stream.getTracks().forEach(function(track){
          console.log(track)
        })
        newVid.srcObject = stream
        newDiv.id = socket_id+"div";
        newVid.id = socket_id;
        newVid.autoplay = true
        newVid.onclick = () => openPictureMode(newVid)
        newVid.ontouchstart = (e) => openPictureMode(newVid)
        newDiv.appendChild(newVid)
        videoChat.appendChild(newDiv)
        createjs.Sound.alternateExtensions = ["mp3"];
        createjs.Sound.registerSound("https://cdn.glitch.com/a2e2dfed-f59c-45b2-9084-040367922816%2Fy2mate.com%20-%20Discord%20Join%20Sound%20Effect%20(download).mp3", "sound");
         var instance = createjs.Sound.play("sound");
         instance.volume = 0.5;
    })
}
function openPictureMode(el) {
    el.requestPictureInPicture()
}
function handleLocalMediaStreamError(error) {
  let silence = () => {
  let ctx = new AudioContext(), oscillator = ctx.createOscillator();
  let dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  return dst.stream.getAudioTracks()[0];
}
let black = () => {
  let canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d")
  ctx.fillStyle="#000"
  ctx.fillRect(0, 0, 1, 150);
  var stream = canvas.captureStream(25);
  return stream
}
// let blackSilence = new MediaStream([black(), silence()]);
  // console.log(blackSilence.getTracks())
  console.log("navigator.getUserMedia error: ", error);
  localVideo.srcObject = black();
  localStream = black();
  //init();
}
//END----------------FUNCTIONS-----------------
//-------------------DRAWING-------------------
function clearCanvas(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

canvas.addEventListener("mousedown", start);
canvas.addEventListener("mouseup", stop);
canvas.addEventListener("resize", resize);

resize();

function resize() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}
function reposition(event) {
  coord.x = event.clientX - canvas.offsetLeft;
  coord.y = event.clientY - canvas.offsetTop;
}
function start(event) {
  document.addEventListener("mousemove", begindraw);
  reposition(event);
}
function stop(event) {
  document.removeEventListener("mousemove", begindraw);
}
function begindraw(e) {
  draw(e, true, current.color, current.size);
}
function draw(event, emit, color, size) {
  ctx.beginPath();
  ctx.lineWidth = size;
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  var x0 = coord.x;
  var y0 = coord.y;
  ctx.moveTo(coord.x, coord.y-200);
  reposition(event);
  var x1 = coord.x;
  var y1 = coord.y;
  ctx.lineTo(coord.x, coord.y-200);
  ctx.stroke();
  if (!emit) { return; }
  var w = canvas.width;
  var h = canvas.height;
  publish([x0,y0,x1,y1,color,size])
}
function drawStream(e){
  ctx.beginPath();
  ctx.lineWidth = e[5];
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.strokeStyle = e[4];
  ctx.moveTo(e[0], e[1]-200);
  ctx.lineTo(e[2], e[3]-200);
  ctx.stroke();
}
function publish(data) {
  socket.emit("draw", data)
}
  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
    draw(data.x * w, data.y * h, data.color, data.size);
  }
var colorel = document.getElementById("color");
var hueb = new Huebee( colorel, {
  setText: false,
  saturations: 1
});
hueb.on( "change", function( color, hue, sat, lum ) {
  current.color = color;
});
function sizeChange(newsize){
  current.size=newsize
}
function rr(url){
  if (url) {
    socket.emit("rr", url);
  } else {
    socket.emit("rr", "https://ia801602.us.archive.org/11/items/Rick_Astley_Never_Gonna_Give_You_Up/Rick_Astley_Never_Gonna_Give_You_Up.mp4");
  }
}
$(".drop").on("drop dragdrop",function(e){
  e.preventDefault();
  var img = e.originalEvent.dataTransfer.items[0].getAsFile();
  socket.emit("chat", {image: img, username: username})
});
$(".drop").on("dragenter",function(e){
    e.preventDefault();
})
$(".drop").on("dragleave",function(){
})
$(".drop").on("dragover",function(event){
    event.preventDefault();
})
//-------------------END-------------------