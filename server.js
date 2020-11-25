var express = require("express");
var compression = require('compression');
var engine = require("./views/js/game");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
app.enable("trust proxy");
app.use(function(req, res, next) {
    if (!req.secure && req.protocol !== "https") res.redirect("https://" + req.get("host") + req.url);
    next();
});
app.use(compression());
app.use(express.static("views"));
app.get("/", (req, res) => res.sendFile(__dirname + "/views/index.html"));
var peers = {};
var plots = [];
var redoStack = [];
var rooms = [];
var gameInterval, updateInterval, roomInterval;
var main = "draw";

function gameLoop() {
    Object.keys(engine.players).forEach((playerId) => engine.movePlayer(playerId, engine.players[playerId].keys))
};

function roomList() {
  rooms = [];
  io.sockets.adapter.rooms.forEach(roomCheck);
  io.sockets.emit("rooms", rooms)
}
function roomCheck(room, p) {
  var it = room.values();
  var frt = it.next();
  var val = frt.value;
  if (p!=val) {
    rooms.push(p);
  }
}

function emitUpdates() {io.sockets.emit("gameStateUpdate", {players: engine.players, coins: engine.coins})};
io.on("connect", (socket) => {
    socket.croom = "lobby";
    socket.on("login", (uname) => {
        console.log("a client is connected "+uname+"-"+socket.id);
        peers[socket.id] = socket;
        // var posX = -10;
        // var posY = -10;
        // while (!engine.isValidPosition({x: posX, y: posY}, socket.id)) {
        //     posX = Math.floor(Math.random() * Number(6000) - 100) + 10;
        //     posY = Math.floor(Math.random() * Number(engine.gameSize) - 100) + 10;
        // }
        engine.players[socket.id] = {
            accel: {x: 0, y: 0},
            // x: posX,
            // y: posY,
            colour: engine.stringToColour(socket.id),
            score: 0,
            name: uname,
            keys: []
        };
        // if (Object.keys(engine.players).length == 1) {
        //     // engine.shuffleCoin();
        //     gameInterval = setInterval(gameLoop, 25);
            roomInterval = setInterval(roomList, 2000);
            updateInterval = setInterval(emitUpdates, 40);
        // }
        io.sockets.emit("history", plots);
        socket.to(socket.croom).emit('initReceive', socket.id);
    });
    socket.on("room", (room, nroom) => {
        socket.leave(room);
        socket.to(socket.croom).emit("removePeer", socket.id);
        socket.join(nroom);
        socket.croom = nroom;
    });
    socket.on("refresh", (data) => io.sockets.emit("refresh"));
    socket.on("clear", (data) => io.sockets.emit("clear"));
    socket.on("chat", (data) => socket.to(socket.croom).emit("chat", data));
    socket.on("kick", (client) => io.to(client).emit("refresh"));
    socket.on("rr", (data) => socket.to(socket.croom).emit("rr", data));
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
        console.log("socket disconnected "+socket.id);
        socket.to(socket.croom).emit("removePeer", socket.id);
        delete peers[socket.id];
    });
    socket.on("undo", () => {
        for (var i = 0; i < 10; i++) redoStack.unshift(plots.pop());
        socket.emit("history", plots);
    });
    socket.on("initSend", (init_socket_id) => {
        console.log("init send by " + socket.id + " for " + init_socket_id);
        peers[init_socket_id].emit("initSend", socket.id);
    });
    socket.on("signal", (data) => {
        if (!peers[data.socket_id]) return;
        peers[data.socket_id].emit("signal", {
            socket_id: socket.id,
            signal: data.signal
        });
    });
    //==========GAME==============
    socket.on("disconnect", function() {
        if (engine.players[socket.id]) delete engine.players[socket.id];
        if (Object.keys(engine.players).length > 0) io.emit("gameStateUpdate", engine.players);
        else {
            clearInterval(gameInterval);
            clearInterval(updateInterval);
            clearInterval(roomInterval);
        }
    });
    // socket.on("keys", function(msg) {
    //     if (engine.players[socket.id]) engine.players[socket.id].keys = msg;
    // });
});
http.listen(3000);
console.log("Server is on!🎉");