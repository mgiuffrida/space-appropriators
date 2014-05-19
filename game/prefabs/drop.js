'use strict';

var Drop = function(game, x, y, frame) {
  Phaser.Sprite.call(this, game, x, y, 'power-up', frame);
  this.anchor.setTo(0.5, 0.5);

  this.game.physics.arcade.enableBody(this);
  this.body.immovable = true;
  this.checkWorldBounds = true;
  this.outOfBoundsKill = true;

  this.body.velocity.y = 80;
};

Drop.prototype = Object.create(Phaser.Sprite.prototype);
Drop.prototype.constructor = Drop;

Drop.prototype.update = function() {
  
  // write your prefab's specific update code here
  
};

module.exports = Drop;
