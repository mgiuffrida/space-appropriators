'use strict';

//global variables
window.onload = function () {
  var game = new Phaser.Game(500, 500, Phaser.AUTO, 'space-appropriators');

  // Game States
  game.state.add('boot', require('./states/boot'));
  game.state.add('gameover', require('./states/gameover'));
  game.state.add('menu', require('./states/menu'));
  game.state.add('play', require('./states/play'));
  game.state.add('preload', require('./states/preload'));
  game.state.add('score', require('./states/score'));
  

  game.state.start('boot');
};