const express = require("express");
const fs = require('fs');
const db = require('quick.db');
var app = express();
var privateKey = fs.readFileSync('keys/privkey.pem');
var certificate = fs.readFileSync('keys/fullchain.pem');
var http = require('http').createServer(app);
var https = require('https').createServer({key: privateKey, cert: certificate}, app);
const io = require("socket.io")(https);
//app.use(function (req, res, next) {if (!req.secure) res.redirect("https://" + req.get("host") + req.url);next()});
app.use(express.static("views"));
var peers = [];
io.on("connect", (socket) => {
	console.log(new Date().toUTCString()+" Client has connected -- "+socket.id);
	peers.push({socket: socket});
	socket.emit("chats", db.get("chats"));
	let ids = [];
	for (let peer of peers) {ids.push(peer.socket.id)};
	socket.emit('list', ids);
	socket.on('signal', (to, from, data) => {
		let found = false;
		for (let peer of peers) {
			if (peer.socket.id == to) {
				console.log("Found Peer, sending signal");
				peer.socket.emit('signal', to, from, data);
				found = true;
				break;
			}				
		}	
		if (!found) console.log("Never found peer");
	});
	socket.on('disconnect', function() {
		console.log(new Date().toUTCString()+" Client has disconnected -- "+socket.id);
		io.emit('peer_disconnect', socket.id);
		for (let [i,peer] of peers.entries()) {
			if (peer.socket.id == socket.id) {
				peers.splice(i,1);
				break;
			}
		}			
	});
	socket.on("chat", (data) => {
		db.push('chats', data)
		io.emit("chat", data)
	});
});
http.listen(80);
https.listen(443);
console.log("Server is on!");
const readline = require("readline");
const rl = readline.createInterface({input: process.stdin, output: process.stdout});

function commands() {
	rl.question("Command (video/chats/resetchats): ", function (cmd) {
		if (cmd === "video") {
		rl.question("Video URL: ", function (url) {
			io.sockets.emit("video", url);
			commands();
		});
		} else if (cmd === "chats") {
			console.log(db.get('chats'));
			console();
		} else if (cmd === "resetchats") {
			db.set('chats', []);
			commands();
		} else commands();
	});
}
rl.on("close", function () {
  console.log("\nBYE!");
  process.exit(0);
});
commands();