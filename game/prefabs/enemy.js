'use strict';

var Enemy = function(game, x, y, health) {
  Phaser.Sprite.call(this, game, x, y, 'bomber');
  this.anchor.setTo(0.5, 0);

  this.setHealth(health);

  this.game.physics.arcade.enableBody(this);
  this.body.collideWorldBounds = true;
  this.body.immovable = true;

  if (!Enemy.sounds) {
    Enemy.sounds = {
      'explosion': [this.game.add.sound('explosion')],
      'enemy-hit': [this.game.add.sound('enemy-hit')],
    };
  }
  this.alive = true;
};

Enemy.prototype = Object.create(Phaser.Sprite.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.BOMB_DELAY = 2000;
Enemy.BOMB_SPEED = 200;

Enemy.prototype.update = function() {
  // write your prefab's specific update code here
  
};

Enemy.prototype.damage = function(damage) {
  if (this.alive) {
    this.setHealth(this.health - damage);
//  Phaser.Sprite.prototype.damage.call(this, damage);

    if (this.health > 0)
      this.playSound('enemy-hit');
    else
      this.kill();
  }

  return this;
};

Enemy.prototype.kill = function() {
  Phaser.Sprite.prototype.kill.call(this);

  this.playSound('explosion');

  return this;
};

Enemy.prototype.setHealth = function(health) {
  this.health = health;
  if (health > 1) {
    this.loadTexture('bomber-red');
  } else {
    this.loadTexture('bomber');
  }
};

Enemy.prototype.playSound = function(sound) {
  var soundPlayed = false;
  // Play an existing sound or add a new one to the pool.
  for (var i = 0; i < Enemy.sounds[sound].length; i++) {
    if (!Enemy.sounds[sound][i].isPlaying) {
      Enemy.sounds[sound][i].play();
      soundPlayed = true;
      break;
    }
  }
  if (!soundPlayed)
    Enemy.sounds[sound].push(this.game.sound.play(sound));
};

module.exports = Enemy;
