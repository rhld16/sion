/*global socket Huebee*/
const mcanvas = document.getElementById("myCanvas");
const mctx = mcanvas.getContext("2d");
var coord = { x: 0, y: 0 };
var current = {color: "black", size: 5, type: "pen"};
function clearCanvas() {
  mctx.clearRect(0, 0, mcanvas.width, mcanvas.height);
};
var startX, startY;
mcanvas.addEventListener("touchstart", startmob);
mcanvas.addEventListener("mouseup", stop);
mcanvas.addEventListener("mouseleave", stop);
mcanvas.addEventListener("mousedown", start);
mcanvas.addEventListener("mouseup", stop);
mcanvas.addEventListener("mouseleave", stop);
mcanvas.addEventListener("resize", resize);
resize();
function resize() {
  mctx.canvas.width = window.innerWidth;
  mctx.canvas.height = window.innerHeight;
}
function reposition(evt) {
  var rect = mcanvas.getBoundingClientRect();
  coord.x = (evt.clientX - rect.left) / (rect.right - rect.left) * mcanvas.width;
  coord.y = (evt.clientY - rect.top) / (rect.bottom - rect.top) * mcanvas.height;
}
function startmob(evt) {
  var rect = mcanvas.getBoundingClientRect();
  startX = (evt.clientX - rect.left) / (rect.right - rect.left) * mcanvas.width;
  startY = (evt.clientY - rect.top) / (rect.bottom - rect.top) * mcanvas.height;
  document.addEventListener("touchmove", begindraw);
  reposition(evt);
}
function start(evt) {
  var rect = mcanvas.getBoundingClientRect();
  startX = (evt.clientX - rect.left) / (rect.right - rect.left) * mcanvas.width;
  startY = (evt.clientY - rect.top) / (rect.bottom - rect.top) * mcanvas.height;
  document.addEventListener("mousemove", begindraw);
  reposition(evt);
}
function stop(evt) {
  document.removeEventListener("mousemove", begindraw);
  if (current.type=="circle") publish(["circle",current.color,startX,startY,coord.x,coord.y])
  else if (current.type=="square") publish(["square",current.color,startX,startY,coord.x-startX,coord.y-startY]);
}
function begindraw(e) {
  e.preventDefault();
  e.stopPropagation();
  mctx.fillStyle = mctx.strokeStyle = current.color;
  if (current.type=="pen") draw(e);
  else if (current.type=="circle") circle(e);
  else if (current.type=="square") square(e);
}
function circle(e) {
    reposition(e);
    // mctx.clearRect(0, 0, canvas.width, canvas.height);
    mctx.beginPath();
    var a = startX - coord.x;
    var b = startY - coord.y;
    var c = Math.sqrt( a*a + b*b );
    mctx.arc(startX, startY, c, 0, Math.PI * 2);
    mctx.closePath();
    mctx.fill();
}
function square(e) {
  reposition(e);
  mctx.beginPath();
  mctx.fillRect(startX, startY, coord.x-startX, coord.y-startY);
  mctx.closePath();
  mctx.fill();
}
function draw(evt) {
  mctx.beginPath();
  mctx.lineWidth = current.size;
  mctx.lineCap = mctx.lineJoin = "round";
  var x0 = coord.x;
  var y0 = coord.y;
  mctx.moveTo(coord.x, coord.y);
  reposition(evt);
  var x1 = coord.x;
  var y1 = coord.y;
  mctx.lineTo(coord.x, coord.y);
  mctx.closePath();
  mctx.stroke();
  var w = mcanvas.width;
  var h = mcanvas.height;
  publish(["line",current.color,x0,y0,x1,y1,current.size])
}
function drawStream(e) {
  mctx.beginPath();
  mctx.fillStyle = mctx.strokeStyle = e[1];
  if (e[0]=="line") {
    mctx.lineWidth = e[6];
    mctx.lineCap = mctx.lineJoin = "round";
    mctx.moveTo(e[2], e[3]);
    mctx.lineTo(e[4], e[5]);
    mctx.stroke();
  } else if (e[0]=="square") {
    mctx.fillRect(e[2],e[3],e[4],e[5]);
    mctx.fill();
  } else if (e[0]=="circle") {
    var a = e[2] - e[4];
    var b = e[3] - e[5];
    var c = Math.sqrt( a*a + b*b );
    mctx.arc(e[2], e[3], c, 0, Math.PI * 2);
    mctx.closePath();
    mctx.fill();
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