/*global socket Huebee*/
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
var coord = { x: 0, y: 0 };
var current = {
    color: "black",
    size: 5,
    type: "pen"
};
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};
var startX, startY;
canvas.addEventListener("touchstart", startmob);
canvas.addEventListener("mouseup", stop);
canvas.addEventListener("mouseleave", stop);
canvas.addEventListener("mousedown", start);
canvas.addEventListener("mouseup", stop);
canvas.addEventListener("mouseleave", stop);
canvas.addEventListener("resize", resize);
resize();
function resize() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}
function reposition(evt) {
  var rect = canvas.getBoundingClientRect();
  coord.x = (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
  coord.y = (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;
}
function startmob(evt) {
  var rect = canvas.getBoundingClientRect();
  startX = (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
  startY = (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;
  document.addEventListener("touchmove", begindraw);
  reposition(evt);
}
function start(evt) {
  var rect = canvas.getBoundingClientRect();
  startX = (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
  startY = (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;
  document.addEventListener("mousemove", begindraw);
  reposition(evt);
}
function stop(evt) {
  document.removeEventListener("mousemove", begindraw);
  if (current.type=="circle") {
    publish(["circle",current.color,startX,startY,coord.x,coord.y])
  } else if (current.type=="square") {
    publish(["square",current.color,startX,startY,coord.x-startX,coord.y-startY]);
  }
}
function begindraw(e) {
  e.preventDefault();
  e.stopPropagation();
  ctx.fillStyle = ctx.strokeStyle = current.color;
  if (current.type=="pen") {
    draw(e);
  } else if (current.type=="circle") {
    circle(e);
  } else if (current.type=="square") {
    square(e);
  }
}
function circle(e) {
    reposition(e);
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    var a = startX - coord.x;
    var b = startY - coord.y;
    var c = Math.sqrt( a*a + b*b );
    ctx.arc(startX, startY, c, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
}
function square(e) {
  reposition(e);
  ctx.beginPath();
  ctx.fillRect(startX, startY, coord.x-startX, coord.y-startY);
  ctx.closePath();
  ctx.fill();
}
function draw(evt) {
  ctx.beginPath();
  ctx.lineWidth = current.size;
  ctx.lineCap = ctx.lineJoin = "round";
  var x0 = coord.x;
  var y0 = coord.y;
  ctx.moveTo(coord.x, coord.y);
  reposition(evt);
  var x1 = coord.x;
  var y1 = coord.y;
  ctx.lineTo(coord.x, coord.y);
  ctx.closePath();
  ctx.stroke();
  var w = canvas.width;
  var h = canvas.height;
  publish(["line",current.color,x0,y0,x1,y1,current.size])
}
function drawStream(e) {
  ctx.beginPath();
  ctx.fillStyle = ctx.strokeStyle = e[1];
  if (e[0]=="line") {
    ctx.lineWidth = e[6];
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.moveTo(e[2], e[3]);
    ctx.lineTo(e[4], e[5]);
    ctx.stroke();
  } else if (e[0]=="square") {
    ctx.fillRect(e[2],e[3],e[4],e[5]);
    ctx.fill();
  } else if (e[0]=="circle") {
    var a = e[2] - e[4];
    var b = e[3] - e[5];
    var c = Math.sqrt( a*a + b*b );
    ctx.arc(e[2], e[3], c, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }
}
function publish(data) {
  socket.emit("draw", data)
}
var colorel = document.getElementById("color");
$("#undo").on("click", function() {
    socket.emit("undo");
});
var hueb = new Huebee( colorel, {
  setText: false,
  saturations: 1
}).on( "change", function( color, hue, sat, lum ) {
  current.color = color;
});