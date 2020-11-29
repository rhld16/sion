/* eslint-disable no-undef */
"use strict";
//-------------------INIT-------------------
var username;
var socket;
var curroom;
var screen = false;
var localStream = null;
var relogin = false;
const videoChat = document.getElementsByClassName("video-container")[0];
const localVideo = document.getElementById("localVideo");
var peers = [];
createjs.Sound.alternateExtensions = ["mp3"];
createjs.Sound.registerSound("media/message.mp3", "message");
createjs.Sound.registerSound("media/join.mp3", "join");
createjs.Sound.registerSound("media/disconnect.mp3", "disconnect");
//-------------------HTML-FORMS--------------
!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? $("#inp").focus() : null;
$("#inp").keypress(function(e) {
    if (e.which == 13) {
        username = $("#inp").val();
        if (username != "") loggedin();
    }
});
var lastChat;
$("form").submit(function(e) {
    e.preventDefault();
    var m = $("#m").val();
    if (m != "") {
        if (cooldown()) {
            lastChat = Date.now();
            if (/^[\/]/.test(m)) {
                const args = m.slice("/".length).trim().split(/\s+/);
                const command = args.shift().toLowerCase();
                if (command == "rr") socket.emit("rr", args);
                else if (command == "clear") socket.emit("clear");
                else if (command == "refresh") socket.emit("refresh");
                else if (command == "room") changeRoom(args[0]);
                else if (command == "announce") socket.emit("announce", {message: args, username: username, id: socket.id});
                else if (command == "canvas") {
                    if (args[0] == "clear") {
                        socket.emit("draw", "clear");
                        clearCanvas();
                    } else if (args[0] == "game") {
                        $("#game").show();
                        $("#myCanvas").hide();
                    } else if (args[0] == "his") {
                      socket.emit("draw", "his");
                        $("#myCanvas").hide();
                    } else if (args[0] == "draw") {
                        $("#game").hide();
                        $("#myCanvas").show();
                    }
                } else if (command == "kick") socket.emit("kick", args[0]);
            } else socket.emit("chat", {message: m, username: username, id: socket.id});
            $("#m").val("");
        }
    }
});
function cooldown() {
    const notOver = Date.now() - lastChat < 1500;
    return !notOver;
}
function changeRoom(nroom) {
    socket.emit("room", curroom, nroom);
    for (let socket_id in peers) removePeer(socket_id);
    curroom = nroom;
    document.getElementById("room").innerText = "Room: " + curroom;
    socket.emit("login", username);  
}
$("#share").on("click", function(e) {
    e.preventDefault();
    if (screen == false) setScreen();
    else unsetScreen();
});
var scrollbar = document.getElementById("messages");
setInterval(function() {
    const isScrolledToBottom = scrollbar.scrollHeight - scrollbar.clientHeight <= scrollbar.scrollTop + 30;
    if (isScrolledToBottom) scrollbar.scrollTop = scrollbar.scrollHeight - scrollbar.clientHeight;
}, 250);
$("#sizeb").on("click", function(e) {
    e.stopPropagation();
    $("#size").toggle();
});
$(document.body).on("click", function() {
    $("#size").hide()
});

function loggedin() {
    $("#preload").hide();
    var searchParams = new URLSearchParams(window.location.search);
    navigator.mediaDevices.getUserMedia({
        video: {
            width: 300,
        },
        audio: true,
    }).then(gotLocalMediaStream, handleLocalMediaStreamError);
}

function gotLocalMediaStream(stream) {
    localVideo.onclick = () => localVideo.requestPictureInPicture();
    localVideo.ontouchstart = (e) => localVideo.requestPictureInPicture();
    localVideo.srcObject = localStream = stream;
    init(true);
}

function handleLocalMediaStreamError(error) {
    let silence = () => {
        let ctx = new AudioContext(),
            oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        return dst.stream.getAudioTracks()[0];
    };
    let black = () => {
        let canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 1, 150);
        var stream = canvas.captureStream(25);
        return stream;
    };
    console.log("navigator.getUserMedia error: ", error);
    localVideo.srcObject = localStream = black();
    init(true);
}

function mute() {
    localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        if (track.enabled == true)
            $(".my-float").replaceWith(
                "<i class='fas fa-microphone-slash my-float'></i>"
            );
        else
            $(".my-float").replaceWith("<i class='fas fa-microphone my-float'></i>");
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
    navigator.mediaDevices.getDisplayMedia({video: true,audio: true}).then((stream) => {
            for (let socket_id in peers) {
                for (let index in peers[socket_id].streams[0].getTracks()) {
                    for (let index2 in stream.getTracks()) {
                        if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                            peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index],stream.getTracks()[index2],peers[socket_id].streams[0]);
                            stream.getTracks()[index2].onended = function(event) {unsetScreen();};
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
    navigator.mediaDevices.getUserMedia({video: true,audio: true}).then((stream) => {
            for (let socket_id in peers) {
                for (let index in peers[socket_id].streams[0].getTracks()) {
                    for (let index2 in stream.getTracks()) {
                        if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                            peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index],stream.getTracks()[index2],peers[socket_id].streams[0]);
                            break;
                        }
                    }
                }
            }
            localVideo.srcObject = localStream = stream;
            screen = false;
        });
}

function init(relogin) {
    curroom = "lobby";
    socket = io();
    socket.emit("room", "", curroom);
    document.getElementById("room").innerText = "Room: " + curroom;
    if (relogin) socket.emit("login", username);
    socket.on("chat", (data) => {
      if (data.id != socket.id) {
        var instance = createjs.Sound.play("message");
        instance.volume = 0.2;
      }
      if (data.username.toLowerCase() == "rhodri") $("#messageslist").append(`<li><strong style="color:gold;"><i class="fas fa-crown"></i>${data.username}</strong>: ${data.message}</li>`);
      else $("#messageslist").append(`<li><strong>${data.username}</strong>: ${data.message}</li>`);
    });
    socket.on("announce", (data) => {
      if (data.id != socket.id) {
        var instance = createjs.Sound.play("message");
        instance.volume = 0.2;
      }
      $("#messageslist").append(`<li><strong style="color: red;"><i class="fas fa-bullhorn"></i>${data.username}</strong>: ${data.message}</li>`);
    })
    socket.on("draw", (data) => drawStream(data));
    socket.on("initReceive", (socket_id) => {
        addPeer(socket_id, false);
        socket.emit("initSend", socket_id);
    });
    socket.on("initSend", (socket_id) => addPeer(socket_id, true));
    socket.on("removePeer", (socket_id) => removePeer(socket_id));
    socket.on("disconnect", () => {
        for (let socket_id in peers) {
          removePeer(socket_id);
        }
        relogin = true;
    });
    window.addEventListener("offline", e => {
      var instance = createjs.Sound.play("disconnect");
      instance.volume = 0.5;
      for (let sid in peers) removePeer(sid);
    });
    socket.on("signal", (data) => {
        peers[data.socket_id].signal(data.signal)
    });
    socket.on("gameStateUpdate", (data) => updateGameState(data));
    socket.on("refresh", () => {
        location.reload()
    });
    socket.on("clear", () => {
        $("#messageslist").empty()
    });
    socket.on("history", (data) => {
        clearCanvas();
        for (let plot in data) {
            drawStream(data[plot]);
        }
    });
    socket.on("rr", function(url) {
      var video = document.getElementById("rvideo");
      if (url[0] === "time") return (video.currentTime = url[1]);
      if (video.paused) {
        if (url[0]) var vId = `https://invidious.kavin.rocks/latest_version?id=${url[0]}&itag=22`;
        else var vId = "media/Rickroll.mp4";
        video.src = vId;
        video.load();
        $("#rr").show();
        video.play();
      } else {
        video.pause();
        $("#rr").hide();
      }
    });
    setInterval(nameLoop, 2000);
    setInterval(gameLoop, 30);
    Mousetrap.bind("shift+x", function(e) {
        e.preventDefault();
        mute();
    });
    Mousetrap.bind("shift+z", function(e) {
        e.preventDefault();
        hide();
    });
}

function removePeer(socket_id) {
    let videoEl = document.getElementById(socket_id);
    let divEl = document.getElementById(socket_id + "div");
    if (videoEl) {
        videoEl.srcObject.getTracks().forEach(function(track) {
            track.stop();
        });
        videoEl.srcObject = null;
        divEl.parentNode.removeChild(divEl);
        videoEl.parentNode.removeChild(videoEl);
    }
    if (peers[socket_id]) peers[socket_id].destroy();
    delete peers[socket_id];
}

function addPeer(socket_id, am_initiator) {
    peers[socket_id] = new SimplePeer({
        initiator: am_initiator,
        stream: localStream,
    });
    peers[socket_id].on("signal", (data) => {
        socket.emit("signal", {
            signal: data,
            socket_id: socket_id
        });
    });
    peers[socket_id].on("stream", (stream) => {
        var newDiv = document.createElement("div");
        var newVid = document.createElement("video");
        newVid.setAttribute("playsinline", "");
        newVid.srcObject = stream;
        newDiv.id = socket_id + "div";
        newVid.id = socket_id;
        newVid.autoplay = true;
        newVid.onclick = () => newVid.requestPictureInPicture();
        newVid.ontouchstart = (e) => newVid.requestPictureInPicture();
        newDiv.appendChild(newVid);
        videoChat.appendChild(newDiv);
        var instance = createjs.Sound.play("join");
        instance.volume = 0.5;
    });
}