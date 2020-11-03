var socket;
onmessage = function(e) {
  if (e.data.socket) {
    socket = e.data.socket;
    return;
  }
  console.log(socket)
  //socket.emit('chat', {x: e.data[0], y: e.data[1], color: e.data[2], size: e.data[3]});
};