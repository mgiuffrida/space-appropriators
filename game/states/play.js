'use strict';

var Player = require('../prefabs/player.js');
var Enemy = require('../prefabs/enemy.js');

function Play() {}

Play.prototype = {
  create: function() {
    this.stage.backgroundColor = '#000';

    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.enemyPool = this.game.add.group();

    // Add enemy first, so player's bullets are positioned over enemy.
    this.numRows = 5;
    this.enemyMargin = 40;
    this.enemySpeed = 22;
    this.jumpDown = 35;

    this.createEnemies();

    this.enemyRight = Math.random() > 0.5;
    this.enemyPool.setAll('body.velocity.x',
                          this.enemySpeed * (this.enemyRight ? 1 : -1));

    this.player = new Player(this.game, this.game.width / 2, 0);
    this.game.add.existing(this.player);

    this.scoreText = this.game.add.text(20, 20,
                                        'Score: 0',
                                        { font: '16px Verdana',
                                          'fill': 'white' });
    this.score = 0;

    this.playerBoundary = this.game.height -
      this.enemyPool.getAt(0).height;

    this.gameOver = false;
    this.lost = this.won = false;
  },

  update: function() {
    this.physics.arcade.collide(this.player.bulletPool, this.enemyPool,
                                this.shootEnemy, null, this);
    this.physics.arcade.overlap(this.player.bulletPool, this.enemyPool,
                                this.shootEnemy, null, this);

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
    var availableWidth = this.game.width - 2 * (2 * this.enemyMargin);
    var numEnemies = Math.floor((availableWidth + this.enemyMargin) /
                              (enemyWidth + this.enemyMargin));
    var rowWidth = numEnemies * enemyWidth +
      (numEnemies - 1) * this.enemyMargin;

    for (var i = 0; i < this.numRows; i++) {
      // add half enemyWidth to x to account for x-anchor
      var x = (this.game.width - rowWidth) / 2 + enemyWidth / 2;
      var y = enemyHeight * (i + 1) + 10 * i + 70;

      for (var j = 0; j < numEnemies; j++) {
        enemy = this.enemyPool.getFirstDead();
        var health = 1 + i % 2;
        if (!enemy)
          enemy = this.enemyPool.add(new Enemy(this.game, x, y, health));
        else
          enemy.reset(x, y, health);
        enemy.score = health * 10;

        x += enemyWidth + this.enemyMargin;
      }
    }
  },

  moveEnemies: function() {
    var hitEdge = false;
    if (this.enemyRight) {
      this.enemyPool.forEachAlive(function(enemy) {
        if (!hitEdge &&
            enemy.body.x + enemy.width >=
            this.game.width - this.enemyMargin) {
          hitEdge = true;
        }
      }, this);
    } else {
      this.enemyPool.forEachAlive(function(enemy) {
        if (!hitEdge && enemy.body.x <= this.enemyMargin)
          hitEdge = true;
      }, this);
    }

    if (hitEdge) {
      this.enemyRight = !this.enemyRight;
      this.enemyPool.multiplyAll('body.velocity.x', -1, true);

      if (!this.gameOver) {
        var maxY = 0;
        this.enemyPool.forEachAlive(function(enemy) {
          if (enemy.body.y + enemy.height > maxY)
            maxY = enemy.body.y + enemy.height;
        }, this);

        this.enemyPool.addAll('body.y', this.jumpDown, true);

        if (maxY + 2 * this.jumpDown >
            this.playerBoundary)
          this.lose();
      }
    }
  },

  shootEnemy: function(bullet, enemy) {
    bullet.kill();
    enemy.damage(1);

    if (!enemy.alive) {
      this.score += enemy.score;
      this.updateScoreText();
    }

    if (!this.enemyPool.countLiving())
      this.win();
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
  },

  setGameOverText: function(text) {
    this.gameOverText = this.game.add.text(this.game.width / 2, 50,
                                           text,
                                           { font: '30px Verdana',
                                             'fill': 'white' });
    this.gameOverText.anchor.setTo(0.5, 0);
  },
};

module.exports = Play;
