var express = require("express");
var app = express();
app.enable('trust proxy');
app.use(function(req, res, next) {
  if((!req.secure) && (req.protocol !== 'https')) {res.redirect('https://' + req.get('host') + req.url)};
  next();
});
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var peers = {}
app.get("/", (req, res) => {res.sendFile(__dirname + "/views/index.html")});
app.get('/favicon.ico', (req, res) => res.status(204));
app.use(express.static("views"));
function configNameSpaceChannel(room) {
		var nsp = '/' + room;
		var socketNamespace = io.of(nsp);

		console.log('ConfigNameSpaceChannel:' + nsp);

		socketNamespace.on('connection', function (socket) {
			socket.on('message', function (message) {
				socket.broadcast.emit('message', message);
			});

});

		return socketNamespace;
	}
//   socket.on("refresh", data => io.emit("refresh"));
//   socket.on("rr", url => io.emit("rr", url));
io.on('connect', (socket) => {
        console.log('a client is connected')
        peers[socket.id] = socket
        for(let id in peers) {
            if(id === socket.id) continue
            console.log('sending init receive to ' + socket.id)
            peers[id].emit('initReceive', socket.id)
        }
        socket.on('signal', data => {
            console.log('sending signal from ' + socket.id + ' to ', data.socket_id)
            if(!peers[data.socket_id])return
            peers[data.socket_id].emit('signal', {
                socket_id: socket.id,
                signal: data.signal
            })
        });
        socket.on('chat', (data) => io.sockets.emit('chat', data));
        socket.on('disconnect', () => {
            console.log('socket disconnected ' + socket.id)
            socket.broadcast.emit('removePeer', socket.id)
            delete peers[socket.id]
        })
        socket.on('initSend', init_socket_id => {
            console.log('init send by ' + socket.id + ' for ' + init_socket_id)
            peers[init_socket_id].emit('initSend', socket.id)
        })
    })
http.listen(3000);