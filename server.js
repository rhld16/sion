var express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var engine = require("./views/js/game");
app.enable("trust proxy");
// app.use(function (req, res, next) {
//   if (!req.secure && req.protocol !== "https") res.redirect("https://" + req.get("host") + req.url);
//   next();
// });
app.use(express.static("views"));
app.get("/", (req, res) => res.sendFile(__dirname + "/views/index.html"));
var peers = {};
var plots = [];
var redoStack = [];
var gameInterval, updateInterval;
var main = "draw";

function gameLoop() {Object.keys(engine.players).forEach((playerId) => engine.movePlayer(playerId, engine.players[playerId].keys))};
function emitUpdates() {io.emit("gameStateUpdate", {players: engine.players, doubloon: engine.doubloon})};
io.on("connect", (socket) => {
  socket.curroom="lobby";
  socket.on("login", (uname) => {
    socket.username = uname;
    console.log("a client is connected "+uname+" - "+socket.id);
    peers[socket.id] = socket;
    socket.to(socket.curroom).emit('initReceive', socket.id);
    socket.to(socket.curroom).emit("history", plots);
    var posX = -10;
    var posY = -10;
    while (!engine.isValidPosition({ x: posX, y: posY }, socket.id)) {
      posX = Math.floor(Math.random() * Number(6000) - 100) + 10;
      posY = Math.floor(Math.random() * Number(engine.gameSize) - 100) + 10;
    }
    engine.players[socket.id] = {
      accel: {x: 0, y: 0},
      x: posX,
      y: posY,
      colour: engine.stringToColour(socket.id),
      score: 0,
      name: uname,
      keys: [],
    };
  });
  socket.on("room", (room, newroom) => {
    socket.leave(room);
    socket.join(newroom);
    socket.curroom=newroom;
  });
  socket.on("refresh", (data) => io.sockets.emit("refresh"));
  socket.on("clear", (data) => io.sockets.emit("clear"));
  socket.on("chat", (data) => io.sockets.emit("chat", data));
  socket.on("kick", (client) => io.to(client).emit("refresh"));
  socket.on("rr", (data) => io.sockets.emit("rr", data));
  socket.on("draw", (data) => {
    if (data == "clear") {
      plots.splice(0, plots.length);
      return;
    }
    plots.push(data);
    if (plots.length > 100000) plots.splice(0, 1);
    io.sockets.emit("draw", data);
  });
  socket.on("disconnect", () => {
    console.log("socket disconnected " + socket.username + " - " + socket.id);
    socket.broadcast.emit("removePeer", socket.id);
    delete peers[socket.id];
  });
  socket.on("undo", () => {
    redoStack.unshift(plots.pop());
    socket.emit("history", plots);
  });
  socket.on("initSend", (init_socket_id) => {
    console.log("init send by " + socket.id + " for " + init_socket_id);
    peers[init_socket_id].emit("initSend", socket.id);
  });
  socket.on("signal", (data) => {
    if (!peers[data.socket_id]) return;
    peers[data.socket_id].emit("signal", {socket_id: socket.id, signal: data.signal});
  });
  //==========GAME==============
  if (Object.keys(engine.players).length == 0) {
    engine.shuffleDoubloon();
    gameInterval = setInterval(gameLoop, 25);
    updateInterval = setInterval(emitUpdates, 40);
  }

  socket.on("disconnect", function () {
    delete engine.players[socket.id];
    if (Object.keys(engine.players).length > 0) io.emit("gameStateUpdate", engine.players);
    else {
      clearInterval(gameInterval);
      clearInterval(updateInterval);
    }
  });

  socket.on("keys", function (msg) {if (engine.players[socket.id]) engine.players[socket.id].keys = msg;});
});
http.listen(3000);
console.log("Server is on!🎉");