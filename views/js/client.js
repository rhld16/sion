/* global playerSize socket playerSpeed accelPlayer movePlayer*/
var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");
var keys = [];
var coin, players, rooms;
function resize() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}
resize();
var localDirection; // used to display accel direction

function drawPlayers(players) {
  Object.keys(players).forEach(playerId => {
    let player = players[playerId];
    ctx.fillStyle = player.colour;
    ctx.fillRect(player.x / 5, player.y / 5, playerSize / 5, playerSize / 5);
  });
}

function updateGameState(gameState) {
  players = gameState.players;
  coin = gameState.coin;
  if (coin) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc((coin.x + coinSize / 2) / 5, (coin.y + coinSize / 2) / 5, coinSize / 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = "gold";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#003300";
    ctx.stroke();
  }

  drawPlayers(players);
}

document.body.addEventListener("keydown", e => keys[e.keyCode] = true);
document.body.addEventListener("keyup", e => keys[e.keyCode] = false);
function gameLoop() {
  if (socket) {
    socket.emit("keys", keys);
    movePlayer(socket.id, keys);
  }
  updateGameState({ players: players, coin: coin });
    // move everyone around
    Object.keys(players).forEach(playerId => {
      let player = players[playerId];
      movePlayer(playerId, player.keys);
    });
}
function nameLoop() {
  var playerCount = Object.keys(players).length;
  var scores = "";
  $("#userslist").empty();
  Object.values(players).sort((a, b) => b.score - a.score).forEach((player, index) => scores+=`<li><span style='border-bottom: 1px solid ${player.colour};'>${player.name}</span> - ${player.score}</li>`);
  $("#userslist").append(scores);

}

function drawGame() {
  drawPlayers(players);
  requestAnimationFrame(drawGame);
}

setInterval(gameLoop, 40);
setInterval(nameLoop, 2000);
requestAnimationFrame(drawGame);