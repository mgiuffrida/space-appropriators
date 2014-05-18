'use strict';

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
  ]);

  this.weapon = Player.Weapons.gun;
  this.weaponTimer = null;

  this.weaponSounds = {};
  this.weaponSounds[this.weapon.name] = this.game.sound.add('shoot');

  this.lastShotAt = 0;

  this.bulletPool = this.game.add.group();

  // Calculate min fire delay to prevent bullet overlap.
  this.setFireDelays();
};

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;

Player.MAX_SPEED = 500;
Player.ACCELERATION = 1500;
Player.DRAG = 2500;

Player.MAX_SPEED_SHOOTING = 100;

Player.prototype.update = function() {
  if (this.leftInputIsActive())
    this.body.acceleration.x = -Player.ACCELERATION;
  else if (this.rightInputIsActive())
    this.body.acceleration.x = Player.ACCELERATION;
  else
    this.body.acceleration.x = 0;

  if (this.upInputIsActive()) {
    this.body.maxVelocity.x = Player.MAX_SPEED_SHOOTING;
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
  this.weaponSounds[this.weapon.sound].play();

  for (var i = 0; i < this.weapon.numBullets; i++) {
    var bullet = this.bulletPool.getFirstDead();
    if (!bullet) {
      bullet = this.game.add.sprite(0, 0, 'bullet');
      this.game.physics.arcade.enableBody(bullet);
      this.bulletPool.add(bullet);
    } else {
      bullet.fadeTween.stop();
      bullet.alpha = 1;
    }

    this.setUpBullet(bullet, i);
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
  this.weapon = Player.Weapons[weapon];
  if (this.weaponTimer)
    this.weaponTimer.destroy();
  this.weaponTimer = this.game.time.create(true);

  this.weaponTimer.add(3000, this.switchWeapon.bind(this, 'gun'));
  this.weaponTimer.start();
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
  var isActive = this.game.input.keyboard.isDown(Phaser.Keyboard.UP);
  isActive |= (this.game.input.activePointer.isDown &&
               this.game.input.activePointer.y < this.game.height * 3 / 4);
  return isActive;
};

Player.Weapons = {
  gun: {
    name: 'gun',
    sound: 'gun',
    fireDelay: 1000,
    bulletSpeed: 400,
    bulletPadding: 5,
    numBullets: 1,
  },
  rapid: {
    name: 'rapid',
    sound: 'rapid',
    fireDelay: 100,
    bulletSpeed: 400,
    bulletPadding: 5,
    numBullets: 1,
  },
  cannon: {
    name: 'cannon',
    sound: 'gun',
    fireDelay: 0,
    maxBullets: 1,
    bulletSpeed: 200,
    bulletPadding: 20,
    numBullets: 3,
  },
};

module.exports = Player;
