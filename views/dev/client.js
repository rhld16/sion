/* eslint-disable no-undef */
var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");
var keys = [];
var coin, players, rooms, input=false;
function gesize() {ctx.canvas.width = window.innerWidth;ctx.canvas.height = window.innerHeight;}
gesize();

function drawPlayers(players) {
  Object.keys(players).forEach(playerId => {
    let player = players[playerId];
    ctx.fillStyle = player.colour;
    ctx.fillRect(player.x / 5, player.y / 5, playerSize / 5, playerSize / 5);
  });
}
function updateGameState(gameState) {
  players = gameState.players;
  coins = gameState.coins;
  if (gameState.rooms) {
    rooms = gameState.rooms;
  }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc((coins.x + coinSize / 2) / 5, (coins.y + coinSize / 2) / 5, coinSize / 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = "gold";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#003300";
    ctx.stroke();
}
document.body.addEventListener("keydown", e => keys[e.keyCode] = true);
document.body.addEventListener("keyup", e => keys[e.keyCode] = false);
function gameLoop() {
  movePlayer(socket.id, keys);
  socket.emit("keys", keys);
  updateGameState({players: players, coins: coins});
  Object.keys(players).forEach(playerId => {
    let player = players[playerId];
    movePlayer(playerId, player.keys);
  });
}
function nameLoop() {
  var scores = "";
  var roomlist = "";
  $("#userslist").empty();
  Object.values(players).sort((a, b) => b.score - a.score).forEach((player, index) => scores+=`<li><span style='border-bottom: 1px solid ${player.colour};'>${player.name}</span> - ${player.score}</li>`);
  $("#userslist").append(scores);
  if (rooms && !input) {
    $("#roomlist").empty();
    rooms.forEach(function(r) {roomlist += `<li onclick="changeRoom('${r}')" style="cursor: pointer;">${r}</li>`});
    roomlist += `<li style="cursor: pointer;"><span data-editable><i class="fas fa-plus-circle"></i> Create Room</span></li>`
    $("#roomlist").append(roomlist);
  }
}
$('body').on('click', '[data-editable]', function(){
  input = true;
  var $el = $(this);      
  var $input = $('<input />')
  $el.replaceWith( $input );
  var save = function(){
    var v=$input.val()
    var $li = $('<span data-editable />').text(v);
    changeRoom(v);
    $input.replaceWith( $li );
    input=false;
  };
  $input.one('blur', save).focus();
  $input.keypress(function(e) {if(e.which == 13) $input.blur()});
});
function drawGame() {
  drawPlayers(players);
  requestAnimationFrame(drawGame);
}

requestAnimationFrame(drawGame);