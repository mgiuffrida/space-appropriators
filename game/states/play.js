'use strict';

var Player = require('../prefabs/player.js');
var Enemy = require('../prefabs/enemy.js');
var Drop = require('../prefabs/drop.js');

var Levels;

function Play() {}

Play.prototype = {
  create: function() {
    this.level = Levels[1];

    this.stage.backgroundColor = '#000';

    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.enemyPool = this.game.add.group();

    // Add enemy first, so player's bullets are positioned over enemy.
    this.numRows = 5;

    this.createEnemies();

    this.enemyRight = Math.random() > 0.5;
    this.enemySpeed = this.level.enemySpeed;
    this.enemyPool.setAll('body.velocity.x',
                          this.enemySpeed * (this.enemyRight ? 1 : -1));

    this.player = new Player(this.game, this.game.width / 2, 0);
    this.game.add.existing(this.player);

    this.dropPool = this.game.add.group();
    this.totalDrops = 0;

    this.scoreText = this.game.add.text(20, 20,
                                        'Score: 0',
                                        { font: '16px Verdana',
                                          'fill': 'white' });
    this.score = 0;

    this.powerUpSound = this.game.sound.add('power-up');

    this.playerBoundary = this.game.height -
      this.enemyPool.getAt(0).height;

    this.gameOver = this.lost = this.won = false;
  },

  update: function() {
    if (!this.player.weapon.passThru) {
      this.physics.arcade.overlap(this.player.bulletPool, this.enemyPool,
                                  this.shootEnemy, null, this);
    } else {
      this.physics.arcade.collide(this.player.bulletPool, this.enemyPool,
                                  this.shootEnemy, null, this);
    }
    this.physics.arcade.overlap(this.player, this.dropPool,
                                this.getDrop, null, this);

    this.moveEnemies();
    if (!this.lost && this.player.upInputIsActive())
      this.player.shootBullet();
  },

  createEnemies: function() {
    var enemy = new Enemy(this.game, this.game.width / 2, 0, 1);
    this.enemyPool.add(enemy);
    enemy.alive = false;
    enemy.visible = false;

    var enemyWidth = enemy.width;
    var enemyHeight = enemy.height;

    // Get the number of enemies per row.
    var availableWidth = this.game.width - 2 * (2 * this.level.enemyMargin);
    var numEnemies = Math.floor((availableWidth + this.level.enemyMargin) /
                              (enemyWidth + this.level.enemyMargin));
    var rowWidth = numEnemies * enemyWidth +
      (numEnemies - 1) * this.level.enemyMargin;

    for (var i = 0; i < this.level.enemyRows.length; i++) {
      // add half enemyWidth to x to account for x-anchor
      var x = (this.game.width - rowWidth) / 2 + enemyWidth / 2;
      var y = enemyHeight * (i + 1) + 10 * i + 70;

      for (var j = 0; j < numEnemies; j++) {
        enemy = this.enemyPool.getFirstDead();
        var health = this.level.enemyRows[i];
        if (!enemy)
          enemy = this.enemyPool.add(new Enemy(this.game, x, y, health));
        else {
          enemy.reset(x, y);
          enemy.setHealth(health);
        }
        enemy.score = health * 10;

        x += enemyWidth + this.level.enemyMargin;
      }
    }
  },

  moveEnemies: function() {
    var hitEdge = false;
    if (this.enemyRight) {
      this.enemyPool.forEachAlive(function(enemy) {
        if (!hitEdge &&
            enemy.body.x + enemy.width >=
            this.game.width - this.level.enemyMargin) {
          hitEdge = true;
        }
      }, this);
    } else {
      this.enemyPool.forEachAlive(function(enemy) {
        if (!hitEdge && enemy.body.x <= this.level.enemyMargin)
          hitEdge = true;
      }, this);
    }

    if (hitEdge) {
      this.enemyRight = !this.enemyRight;

      if (!this.gameOver) {
        var maxY = 0;
        this.enemyPool.forEachAlive(function(enemy) {
          if (enemy.body.y + enemy.height > maxY)
            maxY = enemy.body.y + enemy.height;
        }, this);

        this.enemyPool.addAll('body.y', this.level.jump, true);
        this.enemySpeed += this.level.speedIncrement;
        this.enemyPool.setAll('body.velocity.x',
                              this.enemySpeed * (this.enemyRight ? 1 : -1));

        if (maxY + 2 * this.level.jump >
            this.playerBoundary)
          this.lose();
      } else {
        this.enemyPool.multiplyAll('body.velocity.x', -1, true);
      }
    }
  },

  shootEnemy: function(bullet, enemy) {
/*    if (!this.player.weapon.passThru)*/ bullet.kill();
/*    else {
      bullet.body.y--;
      bullet.body.velocity.y = -this.player.weapon.bulletSpeed;
      for (var i = 0; i < bullet.shotEnemies.length; i++) {
        if (enemy.id === bullet.shotEnemies[i]) {
          console.log('Enemy already shot');
          return;
        }
      }
      console.log('0 enemies of ' + bullet.shotEnemies.length + ' matched');
      console.log('Adding enemy id ' + enemy.id);
      bullet.shotEnemies.push(enemy.id);
    }
*/
    enemy.damage(1);

    if (!enemy.alive) {
      this.score += enemy.score;
      this.updateScoreText();

      if (this.totalDrops < this.level.maxDrops &&
          this.dropPool.countLiving() < this.level.maxDropsAlive &&
          Math.random() < this.level.probDrop) {
        this.dropPool.add(
          new Drop(this.game, enemy.body.center.x, enemy.body.center.y));
        this.totalDrops++;
      }
    }

    if (!this.enemyPool.countLiving())
      this.win();
  },

  getDrop: function(player, drop) {
    player.switchWeapon(Player.Weapons.rapid1);
    drop.kill();
    this.powerUpSound.play();
  },

  lose: function() {
    if (this.gameOver)
      return;
    this.gameOver = true;
    this.lost = true;

    this.setGameOverText('You lose!');
  },

  win: function() {
    if (this.gameOver)
      return;
    this.gameOver = true;
    this.won = true;

    this.setGameOverText('You win!');
  },

  updateScoreText: function() {
    this.scoreText.setText('Score: ' + this.score);
    // todo: bonus for the furthest down the enemy ever got
  },

  setGameOverText: function(text) {
    this.gameOverText = this.game.add.text(this.game.width / 2, 50,
                                           text,
                                           { font: '30px Verdana',
                                             'fill': 'white' });
    this.gameOverText.anchor.setTo(0.5, 0);
  },
};

Levels = [{
  probDrop: 0.1,
  maxDrops: 4,
  maxDropsAlive: 2,
  enemyRows: [1, 2, 1, 2, 1],
  enemyMargin: 40,
  jump: 30,
  enemySpeed: 22,
  speedIncrement: 5,
  startY: 70,
}, {
  probDrop: 0.1,
  maxDrops: 6,
  maxDropsAlive: 2,
  enemyRows: [2, 2, 1, 2, 1],
  enemyMargin: 30,
  jump: 30,
  enemySpeed: 25,
  speedIncrement: 3,
  startY: 60,
}];

module.exports = Play;
