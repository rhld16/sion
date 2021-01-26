const express = require("express");
const fs = require('fs');
var app = express();
var privateKey = fs.readFileSync('keys/privkey.pem');
var certificate = fs.readFileSync('keys/fullchain.pem');
var http = require('http').createServer(app);
var https = require('https').createServer({key: privateKey, cert: certificate}, app);
const io = require("socket.io")(https);
//app.use(function (req, res, next) {if (!req.secure) res.redirect("https://" + req.get("host") + req.url);next()});
app.use(express.static("views"));
var peers = {};
io.on("connect", (socket) => {
  console.log("a client is connected -- " + socket.id);
  peers[socket.id] = socket;
  socket.on('list', function() {
    let ids = [];
    for (let peer of peers) {
      ids.push(peer.id);
    }
    console.log("ids length: " + ids.length);
    socket.emit('listresults', ids);			
  });
  socket.on('signal', (to, from, data) => {
    console.log("SIGNAL", to, data);
    let found = false;
    for (let peer of peers) {
      console.log(peer.id, to);
      if (peer.id == to) {
        console.log("Found Peer, sending signal");
        peer.emit('signal', to, from, data);
        found = true;
        break;
      }				
    }	
    if (!found) console.log("never found peer");
  });
  socket.on('disconnect', function() {
    console.log("Client has disconnected " + socket.id);
    io.emit('peer_disconnect', socket.id);
    for (let peer of peers) {
      if (peer.id == socket.id) {
        delete peers[socket.id]
        break;
      }
    }			
  });
  socket.on("chat", (data) => io.emit("chat", data));
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
