'use strict';

function Preload() {
  this.asset = null;
  this.ready = false;
}

Preload.prototype = {
  preload: function() {
    this.asset = this.add.sprite(this.width/2,this.height/2, 'preloader');
    this.asset.anchor.setTo(0.5, 0.5);

    this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
    this.load.setPreloadSprite(this.asset);

    this.load.image('player', 'assets/images/player.png');

    this.load.image('bomber', 'assets/images/enemy.png');
    this.load.image('bomber-red', 'assets/images/enemy-red.png');

    this.load.image('bullet', 'assets/images/bullet.png');

    this.load.audio('shoot', 'assets/sounds/shoot-sin.wav');
    this.load.audio('shoot-soft', 'assets/sounds/shoot-triangle.wav');
    this.load.audio('explosion', 'assets/sounds/explosion.wav');
    this.load.audio('enemy-hit', 'assets/sounds/enemy-hit.wav');

//    this.load.bitmapFont('hiscorefont', 'assets/fonts/hiscoreletters.png');
  },

  create: function() {
    this.asset.cropEnabled = false;
  },

  update: function() {
    if(this.ready) {
      this.game.state.start('play');
    }
  },

  onLoadComplete: function() {
    this.ready = true;
  }
};

module.exports = Preload;
