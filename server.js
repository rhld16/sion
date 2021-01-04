const express = require("express");
const axios = require('axios');
const fs = require('fs');
var app = express();
var privateKey = fs.readFileSync('privkey.pem');
var certificate = fs.readFileSync('fullchain.pem');
var credentials = {
  key: privateKey,
  cert: certificate
};
var http = require('http').createServer(app);
var https = require('https').createServer(credentials, app);
const io = require("socket.io")(https);
app.enable("trust proxy");
app.use(function (req, res, next) {
  if (!req.secure) res.redirect("https://" + req.get("host") + req.url);
  next()
});
app.use(express.static("views"));
app.get("/", (req, res) => res.sendFile(__dirname + "/views/index.html"));
var peers = {};
var plots = [];
var rooms = [];
var bingoNums = [];
var usedNums = [];
var gameInterval, updateInterval, roomInterval;
io.on("connect", (socket) => {
  socket.croom = "lobby";
  socket.on("login", (uname) => {
    console.log("a client is connected -- " + socket.id);
    socket.username = uname;
    peers[socket.id] = socket;
    socket.to(socket.croom).emit('initReceive', socket.id);
  });
  socket.on("room", (room, nroom) => {
    socket.leave(room);
    socket.to(socket.croom).emit("removePeer", socket.id);
    socket.join(nroom);
    socket.croom = nroom;
  });
  socket.on("disconnect", () => {
    console.log("socket disconnected " + socket.id);
    socket.to(socket.croom).emit("removePeer", socket.id);
    delete peers[socket.id];
  });
  socket.on("initSend", (init_socket_id) => {
    console.log("init send by " + socket.id + " for " + init_socket_id);
    peers[init_socket_id].emit("initSend", socket.id);
  });
  socket.on("signal", (data) => {
    if (!peers[data.sid]) return;
    peers[data.sid].emit("signal", {
      sid: socket.id,
      signal: data.signal
    });
  });
  socket.on("chat", (data) => io.to(socket.croom).emit("chat", data));
  socket.on("rr", (data) => io.to(socket.croom).emit("rr", data));
  socket.on("refresh", (data) => io.sockets.emit("refresh"));
});
http.listen(80);
https.listen(443);
console.log("Server is on!ðŸŽ‰");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function bingoNum() {
  rl.question("Command (num/video/bingo/bingonums/resetbingo): ", function (cmd) {
    if (cmd === "num") {
      rl.question("Number: ", function (name) {
        io.sockets.emit("number", name);
        console.log("Number updated!");
        bingoNum();
      });
    } else if (cmd === "bingo") {
      var randnum;
      do {
        randnum = Math.floor(Math.random() * 90) + 1
      } while (bingoNums[randnum]);
      bingoNums[randnum] = true;
      usedNums.push(randnum);
      io.sockets.emit("bingo", randnum);
      io.sockets.emit("usedNums", usedNums);
      bingoNum();
    } else if (cmd === "bingonums") {
      console.log(usedNums);
      io.sockets.emit("usedNums", usedNums);
      bingoNum();
    } else if (cmd === "resetbingo") {
      usedNums = [];
      bingoNums = [];
      io.sockets.emit("usedNums", usedNums);
      io.sockets.emit("number", "");
      bingoNum();
    } else if (cmd === "video") {
      rl.question("Video URL: ", function (url) {
        io.sockets.emit("video", url);
        bingoNum();
      });
    } else {
      bingoNum();
    }
  });
}
rl.on("close", function () {
  console.log("\nBYE!");
  process.exit(0);
});
bingoNum();
