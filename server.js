const express = require("express");
const app = express();
const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");
const WebSocketServer = WebSocket.Server;
const { nanoid } = require("nanoid");
const engine = require("./views/js/game.js");

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static("views"));
app.get("/status", (req, res) => res.send("OK"));

Set.prototype.find = function(cb) {
    for (let e of this) {
        if (cb(e)) {
            return e;
        }
    }
}
let gameInterval, updateInterval;

const gameLoop = () => Object.keys(engine.players).forEach((playerId) => engine.movePlayer(playerId, engine.players[playerId].keys));
function emitUpdates() {
  wss.broadcast(
    JSON.stringify({
      type: "gameStateUpdate",
      players: engine.players,
      coins: engine.coins,
      rooms: engine.rooms,
    })
  );
}

wss.on("connection", function (ws, req) {
  ws.id = nanoid();
  ws.color = randomColor();
  console.log(`${new Date().toUTCString()} Client has connected | ${ws.id}`);
  // let posX = -10;
  // let posY = -10;
  // while (!engine.isValidPosition({ x: posX, y: posY }, ws.id)) {
  //   posX = Math.floor(Math.random() * Number(6000) - 100) + 10;
  //   posY = Math.floor(Math.random() * Number(engine.gameSize) - 100) + 10;
  // }
  // engine.players[ws.id] = {
  //   accel: { x: 0, y: 0 },
  //   x: posX,
  //   y: posY,
  //   colour: engine.stringToColour(ws.id),
  //   score: 0,
  //   name: ws.id,
  //   keys: [],
  // };
  // if (Object.keys(engine.players).length == 1) {
  //   engine.shuffleCoin();
  //   gameInterval = setInterval(gameLoop, 25);
  //   updateInterval = setInterval(emitUpdates, 40);
  // }
  ws.send(
    JSON.stringify({
      type: "init",
      ids: [...wss.clients].map(i => i.id),
      myid: ws.id,
    })
  );

  ws.on("message", (data, isBinary) => {
    let message = isBinary ? data : data.toString();
    data = JSON.parse(message);
    switch (data.type) {
      case "signal":
        const toWs = wss.clients.find(i => i.id==data.to);
        if (toWs != undefined) {
          toWs.send(
            JSON.stringify({
              type: "signal",
              from: ws.id,
              data: data.data,
            })
          );
        } else {
          console.log("Peer doesn't exist");
        }
        break;
      case "color":
        ws.send(
          JSON.stringify({
            type: "color",
            id: data.id,
            color: wss.clients.find(i => i.id==data.id).color,
          })
        );
        break;
      case "chat":
        wss.broadcast(
          JSON.stringify({
            type: "chat",
            message: data.message,
            id: ws.id,
          })
        );
        break;
      // case "keys":
      //   if (engine.players[ws.id]) engine.players[ws.id].keys = data.keys;
      //   break;
      default:
        console.log(`Received: ${message}`);
    }
  });

  ws.on("error", () => ws.terminate());

  ws.on("close", () => {
    console.log(new Date().toUTCString(), "Client has disconnected |", ws.id);
    wss.broadcast(
      JSON.stringify({
        type: "peer_disconnect",
        id: ws.id,
      })
    );
    // if (engine.players[ws.id]) delete engine.players[ws.id];
    // if (Object.keys(engine.players).length > 0)
    //   wss.broadcast(
    //     JSON.stringify({ type: "gameStateUpdate", players: engine.players })
    //   );
    // else {
    //   clearInterval(gameInterval);
    //   clearInterval(updateInterval);
    // }
  });
});

wss.broadcast = function (data) {
  this.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  });
};

server.listen(process.env.PORT);
console.log("Server is on!");

const randomColor = (() => {
  const randomInt = (min, max) => {return Math.floor(Math.random() * (max - min + 1)) + min};

  return () => {
    var h = randomInt(0, 360);
    var s = randomInt(42, 98);
    var l = randomInt(40, 90);
    return `hsl(${h},${s}%,${l}%)`;
  };
})();