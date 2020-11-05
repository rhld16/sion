/*global createjs current io clearCanvas drawStream Mousetrap SimplePeer YT SocketIOFileUpload*/
"use strict";
//-------------------INIT-------------------
var username;
var uploader;
var socket;
var player=null;
var userids;
var screen = false;
var localStream=null;
var relogin = false;
const videoChat = document.getElementsByClassName("video-container")[0];
const localVideo = document.getElementById("localVideo");
var peers = [];
createjs.Sound.alternateExtensions = ["mp3"];
createjs.Sound.registerSound("https://sion.glitch.me/assets/message.mp3", "message");
createjs.Sound.registerSound("https://sion.glitch.me/assets/join.mp3", "join");
createjs.Sound.registerSound("https://sion.glitch.me/assets/disconnect.mp3", "disconnect");
//-------------------HTML-FORMS--------------
var tag = document.createElement('script');
  tag.id = 'iframe-demo';
  tag.src = 'https://www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
(!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i).test(navigator.userAgent)) ? $("#inp").focus() : null
$("#inp").keypress(function(e) {
    if (e.which == 13) {
        username = $("#inp").val();
        if (username!="") {
            loggedin();
        }
    }
});
var lastChat;
$("form").submit(function(e) {
  e.preventDefault();
  var m = $("#m").val();
  if (m != "") {
    if (cooldown()) {
      lastChat= Date.now();
      socket.emit("chat", {message: m, username: username, id: socket.io.engine.id});
      $("#m").val("");
    }
  }
});
function cooldown() {
    const notOver = Date.now() - lastChat < 3000
    if (notOver) alert('Stop spamming!')
   return !notOver
}
$("#share").click(function(e) {
  e.preventDefault();
  if (screen==false) {
    setScreen();
  } else {
    unsetScreen();
  }
});
var scrollbar = document.getElementById("messages");
setInterval(function() {
    const isScrolledToBottom = scrollbar.scrollHeight - scrollbar.clientHeight <= scrollbar.scrollTop + 30
    if (isScrolledToBottom) {
      scrollbar.scrollTop = scrollbar.scrollHeight - scrollbar.clientHeight
    }
}, 250);
$("#sizeb").on("click", function(e) {
  e.stopPropagation();
  $("#size").toggle();
});
$(window).click(function() {
  $("#size").hide();
});
function loggedin() {
  $("#preload").hide();
  var searchParams = new URLSearchParams(window.location.search);
  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(gotLocalMediaStream, handleLocalMediaStreamError);
}
function makeid(length) {
   var result           = "";
   var characters       = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   for(let i=0; i<length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
   }
   return result;
}
function gotLocalMediaStream(stream) {
  localVideo.onclick = () => localVideo.requestPictureInPicture();
  localVideo.ontouchstart = (e) => localVideo.requestPictureInPicture();
  localVideo.srcObject = stream;
  localStream = stream;
  init(true);
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
  console.log("navigator.getUserMedia error: ", error);
  localVideo.srcObject = black();
  localStream = black();
  init(true);
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
function setScreen() {
    navigator.mediaDevices.getDisplayMedia({video:true,audio:true}).then(stream => {
        for(let socket_id in peers) {
            for(let index in peers[socket_id].streams[0].getTracks()) {
                for(let index2 in stream.getTracks()) {
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
        for(let socket_id in peers) {
            for(let index in peers[socket_id].streams[0].getTracks()) {
                for(let index2 in stream.getTracks()) {
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
function init(relogin) {
    socket = io();
    uploader = new SocketIOFileUpload(socket);
    if(relogin) {
      socket.emit("login", username);
    }
    socket.on("chat", function(data) {
      if (data.message) {
        if (/^[\/]/.test(data.message)) {
          const args = data.message.slice("/".length).trim().split(/\s+/);
          const command = args.shift().toLowerCase();
          if (command=="rr") {
            if (data.id==socket.io.engine.id) {
              if (args[0]) {
                socket.emit("rr", args[0]);
              } else {
                socket.emit("rr", "");
              }
            }
          } else if (command=="clear") {
            socket.emit("clear");
          } else if (command=="refresh") {
            socket.emit("refresh");
          } else if (command=="canvasclear") {
            clearCanvas();
            socket.emit("draw", "clear")
          } else if (command=="kick") {
            socket.emit("kick", args[0]);
          } else {
            //$("#messageslist").append(`<li><strong>Invalid Command</strong></li>`);
          }
          console.log("Command: "+command+"\n-----------------------------------\n"+args);
        } else {
        if (data.id!=socket.io.engine.id) {
        var instance = createjs.Sound.play("message");
        instance.volume = 0.2;
        }
        if (data.username.toLowerCase()=="rhodri") {
          $("#messageslist").append(`<li><strong style="color:gold;"><i class="fas fa-crown"></i>${data.username}</strong>: ${data.message}</li>`);
        } else {
          $("#messageslist").append(`<li><strong>${data.username}</strong>: ${data.message}</li>`);
        }
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
      userids = u;
      $("#usernameslist").empty();
      u.forEach(function(ul) {
        if (ul[0].toLowerCase()==="rhodri") {
          $("#usernameslist").append(`<li style="color:gold;">${ul[0]}</li>`);
        } else {
          $("#usernameslist").append(`<li>${ul[0]}</li>`);
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
        for(let socket_id in peers) {
            removePeer(socket_id)
        }
        relogin=true;
    })
    window.addEventListener("offline", isOffline)
    function isOffline() {
      window.addEventListener("online", isOnline);
      var instance = createjs.Sound.play("disconnect");
      instance.volume = 0.5;
    }
    function isOnline() {
        window.removeEventListener("online", isOnline);
        createjs.Sound.registerSound("https://sion.glitch.me/assets/online.mp3", "online");
        var instance = createjs.Sound.play("online");
        instance.volume = 0.75;
        init(relogin);
    }
    socket.on("signal", data => {
        peers[data.socket_id].signal(data.signal)
    })
    socket.on("refresh", function() {
      location.reload();
    });
    socket.on("clear", data => {
      $("#messageslist").empty();
    });
    socket.on("history", data => {
      clearCanvas();
      for(let plot in data) {
        drawStream(data[plot])
      }
    });
    socket.on("needname", data => {
      var pdiv = document.createElement("div")
      var p = document.createElement("p");
      p.innerHTML = data.username;
      p.classList.add("br")
      pdiv.classList.add("overlaybr")
      pdiv.appendChild(p)
      document.getElementById(`${data.id}div`).appendChild(pdiv)
    });
    socket.on("rr", function(url) {
      console.log(player)
      if (player!=null) {
        $("#rr").hide();
        player.stopVideo();
        $('#rr').remove();
        player=null;
        $('<div id="rr"/>').appendTo('#mainstage');
      } else {
        if (url) {
          var vId= url;
        } else {
          var vId = "dQw4w9WgXcQ"
        }
        player = new YT.Player("rr", {
          height: "1920",
          width: "1080",
          videoId: vId,
          events: {onReady: onPlayerReady}
        });
      }
  function onPlayerReady(event) {
    $("#rr").show();
    event.target.playVideo();
  }
});
    Mousetrap.bind("shift+x", function(e) {
      e.preventDefault();
      mute()
    });
    Mousetrap.bind("shift+z", function(e) {
      e.preventDefault();
      hide()
    });
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
        stream: localStream
    })
    peers[socket_id].on("signal", data => {
        socket.emit("signal", {
            signal: data,
            socket_id: socket_id
        })
    })
    peers[socket_id].on("stream", stream => {
        var newDiv = document.createElement("div");
        var newVid = document.createElement("video");
        newVid.setAttribute("playsinline", "");
        socket.emit("needname", socket_id)
        newVid.srcObject = stream
        newDiv.id = socket_id+"div";
        newVid.id = socket_id;
        newVid.autoplay = true
        newVid.onclick = () => newVid.requestPictureInPicture();
        newVid.ontouchstart = (e) => newVid.requestPictureInPicture();
        newDiv.appendChild(newVid)
        videoChat.appendChild(newDiv)
         var instance = createjs.Sound.play("join");
         instance.volume = 0.5;
    })
}
$(".drop").on("drop dragdrop",function(e) {
  e.preventDefault();
  var img = e.originalEvent.dataTransfer.items[0].getAsFile();
  socket.emit("chat", {image: img, username: username})
});
$(".drop").on("dragenter",function(e) {
    e.preventDefault();
})
$(".drop").on("dragleave",function() {
})
$(".drop").on("dragover",function(event) {
    event.preventDefault();
})