const express = require("express");
const fs = require('fs');
var app = express();
var privateKey = fs.readFileSync('privkey.pem');
var certificate = fs.readFileSync('fullchain.pem');
var http = require('http').createServer(app);
var https = require('https').createServer({key: privateKey, cert: certificate}, app);
const io = require("socket.io")(https);
app.use(function (req, res, next) {if (!req.secure) res.redirect("https://" + req.get("host") + req.url);next()});
app.use(express.static("views"));
app.get("/", (req, res) => res.sendFile(__dirname + "/views/index.html"));
var peers = {};
io.on("connect", (socket) => {
  socket.on("login", (uname) => {
    console.log("a client is connected -- " + socket.id);
    peers[socket.id] = socket;
    socket.to(socket.croom).emit('initReceive', socket.id);
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
    peers[data.sid].emit("signal", {sid: socket.id, signal: data.signal});
  });
  socket.on("chat", (data) => io.to(socket.croom).emit("chat", data));
});
http.listen(80);
https.listen(443);
console.log("Server is on!");
const readline = require("readline");
const rl = readline.createInterface({input: process.stdin, output: process.stdout});

function bingoNum() {
  rl.question("Command (num/video/bingo/bingonums/resetbingo): ", function (cmd) {
    if (cmd === "video") {
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