var express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
app.enable("trust proxy");
app.use(function(req, res, next) {
  if (!req.secure && req.protocol !== "https") {res.redirect("https://" + req.get("host") + req.url)}
  next();
});
app.use(express.static("views"));
app.get("/", (req, res) => {res.sendFile(__dirname + "/views/index.html")});
app.get("/favicon.ico", (req, res) => res.status(204));
var peers = {};
var plots = [];
var redoStack = [];
io.on("connect", socket => {
  socket.on("login", username => {
    socket.username = username;
    console.log("a client is connected");
    peers[socket.id] = socket;
    var usernames = [];
    for (let id in peers) {
      usernames.push([peers[id].username, peers[id].id]);
      if (id === socket.id) continue;
      console.log("sending init receive to " + socket.id);
      peers[id].emit("initReceive", socket.id);
    }

    socket.emit("history", plots);
    io.emit("username", usernames);
  });
  socket.on("needname", data => {socket.emit("needname", {id: data, username: peers[data].username});});
  socket.on("refresh", data => io.sockets.emit("refresh"));
  socket.on("clear", data => io.sockets.emit("clear"));
  socket.on("chat", data => io.sockets.emit("chat", data));
  socket.on("kick", client => {io.to(client).emit("refresh");});
  socket.on("rr", data => io.sockets.emit("rr", data));
  socket.on("draw", data => {
    if (data == "clear") {
      plots.splice(0, plots.length);
      return;
    }
    plots.push(data);
    if (plots.length > 100000) {
      plots.splice(0, 1);
    }
    io.sockets.emit("draw", data);
  });
  socket.on("disconnect", () => {
    console.log("socket disconnected " + socket.id);
    socket.broadcast.emit("removePeer", socket.id);
    delete peers[socket.id];
    var usernames = [];
    for (let id in peers) {
      usernames.push([peers[id].username, peers[id].id]);
    }
    io.emit("username", usernames);
  });
  socket.on("undo", () => {
    var lastPlot = plots.pop();
    redoStack.unshift(lastPlot);
    socket.emit("history", plots);
  });
  socket.on("initSend", init_socket_id => {
    console.log("init send by " + socket.id + " for " + init_socket_id);
    peers[init_socket_id].emit("initSend", socket.id);
  });
  socket.on("signal", data => {
    //console.log("sending signal from " + socket.id + " to ", data.socket_id);
    if (!peers[data.socket_id]) return;
    peers[data.socket_id].emit("signal", {socket_id: socket.id, signal: data.signal});
  });
});
http.listen(3000);
=======
//   socket.on("rr", url => io.emit("rr", url));
io.on('connect', (socket) => {
        socket.on("login", username => {
          socket.username = username
          console.log('a client is connected')
          peers[socket.id] = socket
          var usernames = [];
          for(let id in peers) {
              usernames.push(peers[id].username)
              if(id === socket.id) continue
              console.log('sending init receive to ' + socket.id)
              peers[id].emit('initReceive', socket.id)
          }
          socket.emit('history', plots)
          io.emit('username', usernames)
        });
        socket.on('signal', data => {
            console.log('sending signal from ' + socket.id + ' to ', data.socket_id)
            if(!peers[data.socket_id])return
            peers[data.socket_id].emit('signal', {
                socket_id: socket.id,
                signal: data.signal
            })
        });
        socket.on("refresh", data => io.sockets.emit('refresh'));
        socket.on("clear", data => io.sockets.emit('clear'));
        socket.on('chat', (data) => io.sockets.emit('chat', data));
        socket.on('draw', (data) => {
          if (data=="clear"){
            plots.splice(0, plots.length);
            return;
          }
          plots.push(data);
          if (plots.length>10000){
            plots.splice(0, 1);
          }
          io.sockets.emit('draw', data)
        });
        socket.on('disconnect', () => {
            console.log('socket disconnected ' + socket.id)
            socket.broadcast.emit('removePeer', socket.id)
            delete peers[socket.id]
            var usernames = [];
            for(let id in peers) {
              usernames.push(peers[id].username)
            }
            io.emit('username', usernames)
        });
        socket.on('initSend', init_socket_id => {
            console.log('init send by ' + socket.id + ' for ' + init_socket_id)
            peers[init_socket_id].emit('initSend', socket.id)
        });
    })
http.listen(process.env.PORT || 3000);