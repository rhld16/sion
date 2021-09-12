const express = require("express");
const app = express();
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const WebSocketServer = require('ws').Server;
const { nanoid } = require('nanoid');

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static("views"));
app.get('/status', (req, res) => res.send('OK'));

var peers = new Map();

wss.on('connection', function (ws, req) {
  ws.id = nanoid();
  console.log(new Date().toUTCString(), "Client has connected |", ws.id);
  peers.set(ws.id, {
    ws: ws,
    color: randomColor()
  });
  ws.send(JSON.stringify({
    type: 'initialise',
    ids: [...peers.keys()],
    myid: ws.id
  }));

  ws.on('message', function (data) {
    data = JSON.parse(data);
    switch (data.type) {
      case ('signal'):
        if (peers.has(data.to)) {
          peers.get(data.to).ws.send(JSON.stringify({
            type: 'signal',
            from: ws.id,
            data: data.data
          }));
        } else {
          console.log('Peer doesn\'t exist');
        }
        break;
      case ('color'):
        peers.get(ws.id).ws.send(JSON.stringify({
          type: 'color',
          id: data.id,
          color: peers.get(data.id).color
        }));
        break;
      case ('chat'):
        wss.broadcast(JSON.stringify({
          type: 'chat',
          message: data.message,
          id: ws.id
        }));
        break;
      default:
        console.log(`Received: ${data}`);
    }
  });

  ws.on('error', () => ws.terminate());

  ws.on('close', () => {
    console.log(new Date().toUTCString(), 'Client has disconnected |', ws.id);
    wss.broadcast(JSON.stringify({
      type: 'peer_disconnect',
      id: ws.id
    }));
    peers.delete(ws.id);
  });
});

wss.broadcast = function (data) {
  this.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  });
};

server.listen(3000);
console.log("Server is on!");

const randomColor = (() => {
  const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  return () => {
    var h = randomInt(0, 360);
    var s = randomInt(42, 98);
    var l = randomInt(40, 90);
    return `hsl(${h},${s}%,${l}%)`;
  };
})();