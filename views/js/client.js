/* eslint-disable no-undef */
var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");
var keys = [];
var coins, players;
function resize() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}
resize();

function drawPlayers(players) {
  Object.keys(players).forEach(playerId => {
    let player = players[playerId];
    ctx.fillStyle = player.colour;
    ctx.fillRect(player.x / 5, player.y / 5, playerSize / 5, playerSize / 5);
  });
}

function updateGameState(gameState) {
  Object.keys(gameState.players).forEach(playerId => {
    let player = gameState.players[playerId];
    players[playerId] = player;
  });
  coins = gameState.coins;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let coin of coins) {
    ctx.beginPath();
    ctx.arc((coin.x + coinSize / 2) / 5, (coin.y + coinSize / 2) / 5, coinSize / 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = "gold";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#003300";
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.lineWidth = 2;
  ctx.strokeStyle="#FF0000";
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

document.body.addEventListener("keydown", e => keys[e.keyCode] = true);
document.body.addEventListener("keyup", e => keys[e.keyCode] = false);
function gameLoop() {
  movePlayer(localId, keys);
  server.send(JSON.stringify({ type: "keys", keys }))
  updateGameState({players, coins});
  Object.keys(players).forEach(playerId => {
    let player = players[playerId];
    movePlayer(playerId, player.keys);
  });
}

function nameLoop() {
  var playerCount = Object.keys(players).length;
  var scores = "";
  let usersList = document.getElementById('userslist')
  while(usersList.firstChild) usersList.removeChild(usersList.firstChild);
  Object.values(players).sort((a, b) => b.score - a.score).forEach((player, index) => scores+=`<li><span style='border-bottom: 1px solid ${player.colour};'>${player.name}</span> - ${player.score}</li>`);
  usersList.parent.appendChild(scores);
}

function drawGame() {
  drawPlayers(players);
  requestAnimationFrame(drawGame);
}

function lerp(start, end, amt) {
  return (1-amt)*start+amt*end
}

// setInterval(nameLoop, 2000);
setInterval(gameLoop, 40);
requestAnimationFrame(drawGame);