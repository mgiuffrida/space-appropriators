'use strict';

var debug = window.location.href.indexOf('debug') > -1;

var Player = function(game, x, y, frame) {
  Phaser.Sprite.call(this, game, x, y, 'player', frame);
  this.anchor.setTo(0.5, 0);
  this.y = this.game.height - this.height;

  this.game.physics.arcade.enableBody(this);

  this.body.collideWorldBounds = true;
  this.body.maxVelocity.setTo(Player.MAX_SPEED, 0);
  this.body.drag.setTo(Player.DRAG, 0);

  this.game.input.keyboard.addKeyCapture([
    Phaser.Keyboard.LEFT,
    Phaser.Keyboard.RIGHT,
    Phaser.Keyboard.UP,
    Phaser.Keyboard.DOWN,
    Phaser.Keyboard.SPACEBAR,
  ]);

  this.defaultWeapon = debug ? Player.Weapons.rapid2 : Player.Weapons.gun;
  this.weapon = this.defaultWeapon;
  this.weaponTimer = null;

  this.weaponSounds = {};
  for (var w in Player.Weapons) {
    this.weaponSounds[Player.Weapons[w].name] =
      this.game.sound.add(Player.Weapons[w].sound);
  }

  this.lastShotAt = 0;

  this.bulletPool = this.game.add.group();

  this.laser = null;
  this.laserTimer = null;

  // Calculate min fire delay to prevent bullet overlap.
  this.setFireDelays();

  this.frozen = true;
};

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;

Player.MAX_SPEED = 500;
Player.ACCELERATION = 1500;
Player.DRAG = 2500;

Player.MAX_SPEED_SHOOTING = 100;

Player.prototype.update = function() {
  if (this.laserTimer && !this.laserTimer.expired)
    return;

  if (this.frozen)
    return;

  if (this.leftInputIsActive())
    this.body.acceleration.x = -Player.ACCELERATION;
  else if (this.rightInputIsActive())
    this.body.acceleration.x = Player.ACCELERATION;
  else
    this.body.acceleration.x = 0;

  if (this.upInputIsActive() && !this.neutered) {
    this.body.maxVelocity.x = Player.MAX_SPEED_SHOOTING;
    this.shootBullet();
  } else {
    this.body.maxVelocity.x = Player.MAX_SPEED;
  }
};

Player.prototype.shootBullet = function() {
  if (this.game.time.now - this.lastShotAt <
      this.fireDelay) {
    return;
  }

  this.lastShotAt = this.game.time.now;
  this.weaponSounds[this.weapon.name].play();

  if (this.weapon.passThru) {
    this.shootLaser();
    return;
  }

  for (var i = 0; i < this.weapon.numBullets; i++) {
    var bullet = this.bulletPool.getFirstDead();
    if (!bullet) {
      bullet = this.game.add.sprite(0, 0, 'bullet');
      this.game.physics.arcade.enableBody(bullet);
      this.bulletPool.add(bullet);
      bullet.immovable = true;
    } else {
      bullet.fadeTween.stop();
      bullet.alpha = 1;
    }

    this.setUpBullet(bullet, i);
  }
};

Player.prototype.shootLaser = function() {
  var x = this.body.center.x + this.body.velocity.x *
    this.game.time.elapsed / 1000;
  this.body.velocity.x = this.body.acceleration.x = 0;
  this.laser = this.game.add.sprite(x, this.y, 'bullet');
  this.laser.anchor.setTo(0.5, 1);
  this.laser.width = 15;
  this.laser.height = this.game.height;

  this.game.physics.arcade.enableBody(this.laser);
  this.laser.body.immovable = true;

  if (this.laserTimer)
    this.laserTimer.destroy();
  this.laserTimer = this.game.time.create(true);
  this.laserTimer.add(this.weapon.fireDuration, this.killLaser.bind(this));
  this.laserTimer.start();
};

Player.prototype.killLaser = function() {
  if (this.laser) {
    this.laser.destroy();
    this.laser = null;
  }
};

Player.prototype.setUpBullet = function(bullet, i) {
  bullet.revive();
  var tweenTime = this.game.height / this.weapon.bulletSpeed * 1000;
  bullet.fadeTween = this.game.add.tween(bullet)
    .to({ alpha: 0.45 }, tweenTime).start();

  bullet.checkWorldBounds = true;
  bullet.outOfBoundsKill = true;

  bullet.anchor.setTo(0.5, 0.5);

  var bulletX = this.x;
  if (this.weapon.numBullets > 1) {
    var bulletSpacing = bullet.width + this.weapon.bulletPadding;
    bulletX += -(this.weapon.numBullets - 1) *
      bulletSpacing / 2 + i * bulletSpacing;
  }
  bullet.reset(bulletX, this.y - bullet.height / 2);
  bullet.body.velocity.y = -this.weapon.bulletSpeed;
};

Player.prototype.switchWeapon = function(weapon) {
  this.weapon = weapon;
  this.fireDelay = this.weapon.fireDelay;
  this.killLaser();

  if (this.weaponTimer)
    this.weaponTimer.destroy();
  if (this.weapon !== this.defaultWeapon) {
    this.lastShotAt = 0;
    this.weaponTimer = this.game.time.create(true);

    this.weaponTimer.add(this.weapon.lifeTime,
                         this.switchWeapon.bind(this, this.defaultWeapon));
    this.weaponTimer.start();
  }
};

Player.prototype.setFireDelays = function() {
  var bulletHeight = this.game.cache.getImage('bullet').height;
  for (var w in Player.Weapons) {
    var weapon = Player.Weapons[w];
    weapon.minFireDelay = bulletHeight / weapon.bulletSpeed * 1000;
    weapon.fireDelay = Math.max(weapon.minFireDelay, weapon.fireDelay);
  }

  this.fireDelay = this.weapon.fireDelay;
};

Player.prototype.leftInputIsActive = function() {
  var isActive = this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT);
  isActive |= (this.game.input.activePointer.isDown &&
               this.game.input.activePointer.x < this.game.width / 4);
  return isActive;
};

Player.prototype.rightInputIsActive = function() {
  var isActive = this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT);
  isActive |= (this.game.input.activePointer.isDown &&
               this.game.input.activePointer.x > this.game.width * 3 / 4);
  return isActive;
};

Player.prototype.upInputIsActive = function() {
  var isActive = this.game.input.keyboard.isDown(Phaser.Keyboard.UP) ||
                 this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR);
  isActive |= (this.game.input.activePointer.isDown &&
               this.game.input.activePointer.y < this.game.height * 3 / 4);
  return isActive;
};

Player.prototype.reset = function() {
  Phaser.Sprite.prototype.reset.call(this,
                                     this.game.width / 2,
                                     this.game.height - this.height);
};

Player.Weapons = {
  gun: {
    name: 'gun',
    sound: 'shoot',
    fireDelay: 800,
    bulletSpeed: 400,
    bulletPadding: 5,
    lifeTime: 3000,
    numBullets: 1,
  },
  rapid1: {
    name: 'rapid1',
    sound: 'shoot-soft',
    fireDelay: 175,
    bulletSpeed: 400,
    bulletPadding: 5,
    lifeTime: 3000,
    numBullets: 1,
  },
  rapid2: {
    name: 'rapid2',
    sound: 'shoot-soft',
    fireDelay: 100,
    bulletSpeed: 400,
    bulletPadding: 5,
    lifeTime: 3000,
    numBullets: 1,
  },
  cannon: {
    name: 'cannon',
    sound: 'explosion',
    fireDelay: 0,
    maxBullets: 1,
    bulletSpeed: 200,
    bulletPadding: 20,
    lifeTime: 1000,
    numBullets: 3,
  },
  laser: {
    name: 'laser',
    sound: 'shoot',
    fireDuration: 800,
    fireDelay: 1400,
    maxBullets: 1,
    bulletSpeed: 800,
    bulletPadding: 5,
    lifeTime: 4000,
    numBullets: 1,
    invDamage: 450, // 1000 / DPS
    passThru: true,
  },
};

module.exports = Player;
