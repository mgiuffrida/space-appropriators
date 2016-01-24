'use strict';

var Bomb = function(game, x, y, bomb) {
  Phaser.Sprite.call(this, game, x, y, bomb);
  this.anchor.setTo(0.5, 0);

  this.game.physics.arcade.enableBody(this);

  this.checkWorldBounds = true;
  this.outOfBoundsKill = true;

  this.body.velocity.y = 120;
};

Bomb.prototype = Object.create(Phaser.Sprite.prototype);
Bomb.prototype.constructor = Bomb;

Bomb.prototype.update = function() {
  if (!this.exists)
    Bomb.bombPool.remove(this, true);
};

Bomb.prototype.reset = function(x, y) {
  Phaser.Sprite.prototype.reset.call(this, x, y);

  this.body.velocity.y = 120;
};

module.exports = Bomb;
