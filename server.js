const express = require("express");
const app = express();
app.use(express.static("views"));
const fs = require('fs');
const WebSocket = require('ws');
const WebSocketServer = require('ws').Server;
const { v4: uuid } = require('uuid');

const serverConfig = {
	key: fs.readFileSync('keys/key.pem'),
	cert: fs.readFileSync('keys/cert.pem'),
};
const http = require('http').createServer(app);
const https = require('https').createServer(serverConfig, app);
const wss = new WebSocketServer({ server: https });

var peers = [];

wss.on('connection', function (ws) {
	ws.id = uuid();
	console.log(new Date().toUTCString(), "Client has connected --", ws.id);
	peers[ws.id] = { ws: ws, colour: randomColour() };
	let ids = [];
	for (let id in peers) ids.push(id);
	peers[ws.id].ws.send(JSON.stringify({ type: 'initialise', ids: ids, myid: ws.id }));

	ws.on('message', function (data) {
		data = JSON.parse(data);
		switch (data.type) {
			case ("signal"):
				if (data.to in peers) {
					console.log("Sending signal")
					peers[data.to].ws.send(JSON.stringify({ type: 'signal', from: ws.id, data: data.data }));
				} else {
					console.log("Peer doesn't exist");
				}
				break;
			case ("colour"):
				peers[ws.id].ws.send(JSON.stringify({ type: 'colour', id: data.id, colour: peers[data.id].colour }));
				break;
			case ("chat"):
				wss.broadcast(JSON.stringify({ type: 'chat', message: data.message, id: ws.id }));
				break;
			default:
				console.log('received: %s', data);
		}
	});

	ws.on('error', () => ws.terminate());

	ws.on('close', () => {
		console.log(new Date().toUTCString(), "Client has disconnected --", ws.id);
		wss.broadcast(JSON.stringify({ type: 'peer_disconnect', id: ws.id }));
		delete peers[ws.id];
	});
});

wss.broadcast = function (data) {
	this.clients.forEach(client => {
		if (client.readyState === WebSocket.OPEN) client.send(data);
	});
};

http.listen(80);
https.listen(443);
console.log("Server is on!");

const randomColour = (() => {
	const randomInt = (min, max) => { return Math.floor(Math.random() * (max - min + 1)) + min; };

	return () => {
		var h = randomInt(0, 360);
		var s = randomInt(42, 98);
		var l = randomInt(40, 90);
		return `hsl(${h},${s}%,${l}%)`;
	};
})();