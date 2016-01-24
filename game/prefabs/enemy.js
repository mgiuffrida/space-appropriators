'use strict';

var Bomb = require('../prefabs/bomb.js');

var Enemy = function(game, x, y, type) {
  Phaser.Sprite.call(this, game, x, y, type.key, 0);
  this.anchor.setTo(0.5, 0);

  this.type = type;
  this.health = type.health;
  this.score = type.score;

  this.game.physics.arcade.enableBody(this);
  this.body.collideWorldBounds = true;
  this.body.immovable = true;

  this.bombPool = this.game.add.group();

  if (!Enemy.sounds) {
    Enemy.sounds = {
      'explosion': [this.game.add.sound('explosion')],
      'enemy-hit': [this.game.add.sound('enemy-hit')],
    };
  }

  this.animations.add('smoking', [1, 2], 5, true);
  this.frame = 0;
  this.alive = true;
  this.id = Enemy.nextId++;
  this.healthMultiplier = 1;
};

Enemy.prototype = Object.create(Phaser.Sprite.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.BOMB_DELAY = 2000;
Enemy.BOMB_SPEED = 200;

Enemy.nextId = 0;

Enemy.prototype.update = function() {
  // write your prefab's specific update code here
  
};

Enemy.prototype.arm = function(start) {
  if (!this.armed) {
    this.armed = true;
    this.game.time.events.add(this.getNextBombTime(start), this.shoot, this);
  }
};

Enemy.prototype.disarm = function() {
  this.armed = false;
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
  this.animations.stop();

  return this;
};

Enemy.prototype.reset = function(x, y, type) {
  Phaser.Sprite.prototype.reset.call(this, x, y, type.health);

  if (this.type.key !== type.key)
    this.loadTexture(type.key, 0);
  else if (this.frame !== 0)
    this.frame = 0;

  this.type = type;
};

Enemy.prototype.setHealth = function(health) {
  this.health = health;

  if (health <= this.type.health * this.healthMultiplier / 2)
    this.play('smoking');
};

Enemy.prototype.setHealthMultiplier = function(healthMultiplier) {
  this.healthMultiplier = healthMultiplier;
  this.setHealth(this.health * healthMultiplier);
};

Enemy.prototype.shoot = function() {
  if (!this.alive || !this.armed || !this.type.bomb)
    return;
/*
  var bomb = this.bombPool.getFirstDead();
  if (bomb)
    bomb.reset(this.x, this.y + this.height);
  else*/
  Bomb.bombPool.add(new Bomb(this.game,
                             this.x, this.y + this.height,
                             this.type.bomb));

  this.game.time.events.add(this.getNextBombTime(), this.shoot, this);
};

Enemy.prototype.getNextBombTime = function(start) {
  var minDelay = this.type.minBombDelay;
  var maxDelay = this.type.maxBombDelay;

  if (!this.hasFired) {
    this.hasFired = true;
    minDelay = 500;
    if (!start)
      maxDelay /= 3;
    else
      maxDelay /= 1.5;
  }

  // Fuzz the min delay so enemies don't always fire simultaneously.
  var next = Math.max(minDelay + Math.random() * 1000,
                      Math.random() * maxDelay);

  return next;
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
    bomb: 'bomb-base3',
    minBombDelay: 4 * 1000,
    maxBombDelay: 20 * 1000,
  },
  Normal1: {
    key: 'enemy-base',
    health: 1,
    score: 10,
    bomb: 'bomb-base2',
    minBombDelay: 5 * 1000,
    maxBombDelay: 25 * 800,
  },
  Normal2: {
    key: 'enemy-base',
    health: 2,
    score: 25,
    bomb: 'bomb-base2',
    minBombDelay: 5 * 1000,
    maxBombDelay: 25 * 1000,
  },
};

module.exports = Enemy;
