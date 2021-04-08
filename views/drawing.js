const mcanvas = document.getElementById("myCanvas");
const mctx = mcanvas.getContext("2d");
var current = {color: "black", size: 5, type: "pen", x: 0, y: 0};
function clearCanvas() {mctx.clearRect(0, 0, mcanvas.width, mcanvas.height);};
var startX, startY;
mcanvas.addEventListener("mouseup", stop);
mcanvas.addEventListener("mouseleave", stop);
mcanvas.addEventListener("mousedown", start);
mcanvas.addEventListener("mouseup", stop);
mcanvas.addEventListener("resize", resize);
resize();
function resize() {
  mctx.canvas.width = window.innerWidth;
  mctx.canvas.height = window.innerHeight;
}
function reposition(evt) {
  var rect = mcanvas.getBoundingClientRect();
  current.x = (evt.clientX - rect.left) / (rect.right - rect.left) * mcanvas.width;
  current.y = (evt.clientY - rect.top) / (rect.bottom - rect.top) * mcanvas.height;
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
  mctx.closePath();
  if (current.type=="circle") publish(["circle",current.color,startX,startY,current.x,current.y])
  else if (current.type=="square") publish(["square",current.color,startX,startY,current.x-startX,current.y-startY]);
}
function begindraw(e) {
  e.preventDefault();
  mctx.fillStyle = mctx.strokeStyle = current.color;
  if (current.type=="pen") draw(e);
  else if (current.type=="circle") circle(e);
  else if (current.type=="square") square(e);
}
function circle(e) {
    reposition(e);
    // mctx.clearRect(0, 0, canvas.width, canvas.height);
    mctx.beginPath();
    var a = startX - current.x;
    var b = startY - current.y;
    var c = Math.sqrt( a*a + b*b );
    mctx.arc(startX, startY, c, 0, Math.PI * 2);
    mctx.closePath();
    mctx.fill();
}
function square(e) {
  reposition(e);
  mctx.beginPath();
  mctx.fillRect(startX, startY, current.x-startX, current.y-startY);
  mctx.closePath();
  mctx.fill();
}
function draw(evt) {
  mctx.beginPath();
  mctx.lineWidth = current.size;
  mctx.lineCap = mctx.lineJoin = "round";
  var x0 = current.x;
  var y0 = current.y;
  mctx.moveTo(current.x, current.y);
  reposition(evt);
  var x1 = current.x;
  var y1 = current.y;
  mctx.lineTo(current.x, current.y);
  mctx.closePath();
  mctx.stroke();
  var w = mcanvas.width;
  var h = mcanvas.height;
  publish(["line",current.color,x0/mctx.canvas.width,y0/mctx.canvas.height,x1/mctx.canvas.width,y1/mctx.canvas.height,current.size])
}
function drawStream(e) {
  mctx.beginPath();
  mctx.fillStyle = mctx.strokeStyle = e[1];
  if (e[0]=="line") {
    mctx.lineWidth = e[6];
    mctx.lineCap = mctx.lineJoin = "round";
    mctx.moveTo(e[2]*mctx.canvas.width, e[3]*mctx.canvas.height);
    mctx.lineTo(e[4]*mctx.canvas.width, e[5]*mctx.canvas.height);
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
function publish(data) {socket.emit("draw", data)};
$("#undo").on("click", function() {socket.emit("undo")});
var hueb = new Huebee( document.getElementById("color"), {setText: false, saturations: 1}).on( "change", function( color, hue, sat, lum ) {current.color = color;});