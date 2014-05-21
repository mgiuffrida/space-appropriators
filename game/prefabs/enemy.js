'use strict';

var Enemy = function(game, x, y, type) {
  Phaser.Sprite.call(this, game, x, y, type.key);
  this.anchor.setTo(0.5, 0);

  this.health = type.health;
  this.score = type.score;

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
  this.id = Enemy.nextId++;
};

Enemy.prototype = Object.create(Phaser.Sprite.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.BOMB_DELAY = 2000;
Enemy.BOMB_SPEED = 200;

Enemy.nextId = 0;

Enemy.prototype.update = function() {
  // write your prefab's specific update code here
  
};

Enemy.prototype.damage = function(damage, sound) {
  if (this.alive) {
    this.setHealth(this.health - damage);
//  Phaser.Sprite.prototype.damage.call(this, damage);

    if (this.health > 0) {
      if (sound)
        this.playSound('enemy-hit');
    } else {
      this.kill();
    }
  }

  return this;
};

Enemy.prototype.kill = function() {
  Phaser.Sprite.prototype.kill.call(this);

  this.playSound('explosion');

  return this;
};

Enemy.prototype.reset = function(x, y, type) {
  Phaser.Sprite.prototype.reset.call(this, x, y, type.health);
  if (this.type.key !== type.key)
    this.loadTexture(type.key);

  this.type = type;
};

Enemy.prototype.setHealth = function(health) {
  this.health = health;
  /* Todo: load half-health texture
  if (health > 1) {
    this.loadTexture('bomber-red');
  } else {
    this.loadTexture('bomber');
  }
  */
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

Enemy.Types = {
  Base2: {
    key: 'enemy-base2',
    health: 1,
    score: 10,
  },
  Base3: {
    key: 'enemy-base3',
    health: 1,
    score: 10,
  },
  Normal1: {
    key: 'bomber',
    health: 1,
    score: 10,
  },
  Normal2: {
    key: 'bomber-red',
    health: 2,
    score: 25,
  },
};

module.exports = Enemy;
