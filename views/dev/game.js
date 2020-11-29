/* eslint-disable no-undef */
const speed = 7;
const friction = .98;
var players = {}
var coins = {}

const gameSize = 2500;
const playerSize = 100;
const coinSize = 50;

function checkCollision(obj1, obj2) {
  return(Math.abs(obj1.x - obj2.x) <= playerSize && Math.abs(obj1.y - obj2.y) <= playerSize)
}
function respawn(player) {
  player.x = Math.floor(Math.random() * Number(6000) - 100) + 10;
  player.y = Math.floor(Math.random() * Number(gameSize) - 100) + 10;
}
function isValidPosition(newPosition, playerId, shouldRespawn) {
  // bounds check
  if (newPosition.x < 0 || newPosition.x + playerSize > 6000) return false
  if (newPosition.y < 0 || newPosition.y + playerSize > gameSize) return false
  // collision check
  var hasCollided = false
  Object.keys(players).forEach((key) => {
    if (key == playerId) { return }
    var player = players[key]
    if (checkCollision(player, newPosition)) {
      hasCollided = true
      players[playerId].score++
      respawn(player);
      return
    }
  })
  if (hasCollided) {
    return false
  }

  return true
}

function shuffleCoin() {
  var posX = Math.floor(Math.random() * Number(6000) - 100) + 10
  var posY = Math.floor(Math.random() * Number(gameSize) - 100) + 10

  while (!isValidPosition({ x: posX, y: posY }, '_coin')) {
    if (!this.navigator) {
      posX = Math.floor(Math.random() * Number(gameSize) - 100) + 10
      posY = Math.floor(Math.random() * Number(gameSize) - 100) + 10
    }
  }
  coins.x = posX
  coins.y = posY
}

function movePlayer(id, keys) {
    var player = players[id];
    if (player) {
      var newPosition = {
        x: player.x + player.accel.x,
        y: player.y + player.accel.y
      };
      if (keys[38]) {
        if (player.accel.y > -speed) player.accel.y--;
      }
      if (keys[40]) {
        if (player.accel.y < speed) player.accel.y++;
      }
      if (keys[39]) {
        if (player.accel.x < speed) player.accel.x++;
      }
      if (keys[37]) {
        if (player.accel.x > -speed) player.accel.x--;
      }
      player.accel.y *= friction;
      newPosition.y += player.accel.y;
      player.accel.x *= friction;
      newPosition.x += player.accel.x;
      if (isValidPosition(newPosition, id)) {
        player.x = newPosition.x;
        player.y = newPosition.y;
      } else {
        player.accel.x = 0;
        player.accel.y = 0;
      }
      if (checkCollision(player, coins)) {
        player.score++;
        shuffleCoin();
      }
    }
}

function stringToColour(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
}

if (!this.navigator) {
  module.exports = {
    players: players,
    stringToColour: stringToColour,
    movePlayer: movePlayer,
    playerSize: playerSize,
    gameSize: gameSize,
    isValidPosition: isValidPosition,
    coins: coins,
    shuffleCoin: shuffleCoin
  }
}