'use strict';

var Player = require('../prefabs/player.js');
var Enemy = require('../prefabs/enemy.js');
var Drop = require('../prefabs/drop.js');

var Levels, Scripts;

var debug = window.location.href.indexOf('debug') > -1;

function Play() {
  this.totalScore = 0;
  this.levelNum = 0;
}

Play.prototype = {
  create: function() {
    this.stage.backgroundColor = '#45147c';

    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.enemyPool = this.game.add.group();

    this.margin = 40;

    this.player = new Player(this.game, 0, 0);
    this.game.add.existing(this.player);

    this.dropPool = this.game.add.group();

    this.scoreText = this.game.add.text(20, 20,
                                        'Score: 0',
                                        { font: '16px Verdana',
                                          'fill': 'white' });
    this.score = 0;
    this.hideScoreText();

    this.powerUpSound = this.game.sound.add('power-up');

    this.roundOver = true;
    this.gameOver = this.lost = this.won = false;

    this.nextLevel();

    this.playerBoundary = this.game.height -
      this.enemyPool.getAt(0).height;
  },

  update: function() {
    this.physics.arcade.overlap(this.player.bulletPool, this.enemyPool,
                                this.shootEnemy, null, this);
    this.physics.arcade.collide(this.player.bulletPool, this.enemyPool,
                                this.shootEnemy, null, this);

    if (this.player.weapon.passThru) {
      this.physics.arcade.overlap(this.player.laser, this.enemyPool,
                                  this.laserEnemy, null, this);
    }

    this.physics.arcade.overlap(this.player, this.dropPool,
                                this.getDrop, null, this);

    this.moveEnemies();
  },

  createEnemies: function() {
    for (var i = 0; i < this.level.enemyRows.length; i++) {
      var enemyType = this.level.enemyTypes[this.level.enemyRows[i]];
      var enemyWidth = 32;
      var enemyHeight = 32;

      // Get the number of enemies per row.
      var availableWidth = this.game.width - 2 * (2 * this.margin);
      var numEnemies = Math.floor((availableWidth + this.level.enemyMargin.x) /
                                  (enemyWidth + this.level.enemyMargin.x));
      var rowWidth = numEnemies * enemyWidth +
        (numEnemies - 1) * this.level.enemyMargin.x;

      // Add half enemyWidth to x to account for x-anchor.
      var x = (this.game.width - rowWidth) / 2 + enemyWidth / 2;
      var y = enemyHeight * (i + 1) + this.level.enemyMargin.y * i +
        this.level.startY;

      // Create the enemies.
      for (var j = 0; j < numEnemies; j++) {
        var enemy = this.enemyPool.getFirstDead();
        if (!enemy)
          enemy = this.enemyPool.add(new Enemy(this.game, x, y, enemyType));
        else
          enemy.reset(x, y, enemyType);
        if (this.level.healthMultiplier)
          enemy.setHealthMultiplier(this.level.healthMultiplier);

        x += enemyWidth + this.level.enemyMargin.x;
      }
    }
  },

  moveEnemies: function() {
    var hitEdge = false;
    if (this.enemyRight) {
      this.enemyPool.forEachAlive(function(enemy) {
        if (!hitEdge &&
            enemy.body.x + enemy.width >=
            this.game.width - this.margin) {
          hitEdge = true;
        }
      }, this);
    } else {
      this.enemyPool.forEachAlive(function(enemy) {
        if (!hitEdge && enemy.body.x <= this.margin)
          hitEdge = true;
      }, this);
    }

    if (hitEdge) {
      this.enemyRight = !this.enemyRight;

      if (!this.roundOver) {
        var maxY = 0;
        this.enemyPool.forEachAlive(function(enemy) {
          if (enemy.body.y + enemy.height > maxY)
            maxY = enemy.body.y + enemy.height;
        }, this);

        this.enemyPool.forEachAlive(
          function(enemy) {
            this.game.add.tween(enemy).to(
              { 'y': enemy.y + this.level.jump }, 400,
              Phaser.Easing.Quadratic.Out, true);
          },
          this);
        this.enemySpeed += this.level.speedIncrement;
        this.enemyPool.setAll('body.velocity.x',
                              this.enemySpeed * (this.enemyRight ? 1 : -1));

        //  Todo: lose warning
        if (maxY + 2 * this.level.jump >
            this.playerBoundary)
          this.lose();
      } else {
        this.enemyPool.multiplyAll('body.velocity.x', -1, true);
      }
    }
  },

  shootEnemy: function(bullet, enemy) {
    if (!bullet.alive)
      return;

    bullet.kill();
    enemy.damage(1, true);

    if (!enemy.alive) {
      this.score += enemy.score;
      this.updateScoreText();

      if (this.totalDrops < this.level.maxDrops &&
          this.dropPool.countLiving() < this.level.maxDropsAlive &&
          Math.random() < this.level.probDrop) {
        var drop =
          new Drop(this.game, enemy.body.center.x, enemy.body.center.y);
        drop.alive = true;
        this.dropPool.add(drop);
        this.totalDrops++;
      }
    }

    if (!this.enemyPool.countLiving())
      this.win();
  },

  laserEnemy: function(laser, enemy) {
    enemy.damage(this.game.time.elapsed / 500, false);

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
    player.switchWeapon(Math.random() > 0.5 ? Player.Weapons.rapid1 :
                        Player.Weapons.laser);
    drop.kill();
    this.powerUpSound.play();
  },

  lose: function() {
    if (this.roundOver)
      return;
    this.gameOver = true;
    this.roundOver = true;
    this.lost = true;
    this.player.neutered = true;

    this.setGameOverText('You lose!');
  },

  win: function() {
    if (this.roundOver)
      return;

    this.totalScore += this.score;

    if (this.levelNum === Levels.length - 1) {
      this.setGameOverText('You win!');
      this.gameOver = true;
      this.roundOver = true;
      this.won = true;
    } else {
      this.levelNum++;
      var timer = this.game.time.create(true);
      timer.add(1000, this.showScore, this);
      timer.start();
    }
  },

  showScore: function() {
    this.game.state.start('score', true, false, this.score, this.totalScore);
  },

  nextLevel: function() {
    this.player.world.setTo(this.game, this.game.width / 2);
    this.player.position.x = this.game;
    this.player.position.y = this.game.width / 2;
    this.player.anchor.setTo(0.5, 0);
    this.player.reset();
    this.player.frozen = true;

    if (this.player.laser)
      this.player.laser.destroy();
    this.player.bulletPool.forEachAlive(
      function(bullet) {
        bullet.kill();
      },
      this);

    this.level = Levels[this.levelNum];
    this.createEnemies();

    this.enemyRight = Math.random() > 0.5;
    this.enemySpeed = this.level.enemySpeed;
    this.enemyPool.setAll('body.velocity.x', 0);

    this.totalDrops = 0;

    this.score = 0;
    this.hideScoreText();

    this.playScripts(this.startLevel.bind(this));
  },

  startLevel: function() {
    this.updateScoreText();
    this.player.frozen = false;
    this.roundOver = false;
    this.enemyPool.setAll('body.velocity.x',
                          this.enemySpeed * (this.enemyRight ? 1 : -1));
  },

  playScripts: function(callback) {
    this.showScript(0, callback);
  },

  showScript: function(i, callback) {
    if (this.levelNum >= Scripts.length || i >= Scripts[this.levelNum].length) {
      if (callback)
        callback();
      return;
    }

    var text = Scripts[this.levelNum][i];
    var scriptText = this.game.add.text(this.game.width / 2, 50,
                                        text,
                                        {
                                          font: '20px Verdana',
                                          'fill': 'white',
                                          'align': 'center',
                                          'wordWrap': true,
                                          wordWrapWidth: this.game.width - 40
                                        });
    scriptText.anchor.setTo(0.5, 0);

    if (this.scriptTimer)
      this.scriptTimer.destroy();
    this.scriptTimer = this.game.time.create();

    var delay = debug ? 0 : 1000;
    var letterTime = debug ? 15 : 45;
    this.scriptTimer.add(
      delay + letterTime * text.length,
      function() {
        scriptText.destroy();
        this.showScript(i + 1, callback);
      },
      this);
    this.scriptTimer.start();
  },

  updateScoreText: function() {
    this.scoreText.setText('Score: ' + this.score);
    this.scoreText.visible = true;
    // todo: bonus for the furthest down the enemy ever got
  },

  hideScoreText: function() {
    this.scoreText.visible = false;
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
  // 4 x 2, no guns
  probDrop: 0,
  maxDrops: 0,
  maxDropsAlive: 0,
  enemyTypes: [Enemy.Types.Base2],
  enemyRows: [0, 0],
  enemyMargin: new Phaser.Point(70, 80),
  jump: 25,
  enemySpeed: debug ? 80 : 6,
  speedIncrement: 0,
  startY: 100,
  healthMultiplier: 2,
}, {
  // 4 x 3, with guns
  probDrop: 0,
  maxDrops: 0,
  maxDropsAlive: 0,
  enemyTypes: [Enemy.Types.Base3],
  enemyRows: [0, 0, 0],
  enemyMargin: new Phaser.Point(60, 50),
  jump: 25,
  enemySpeed: debug ? 60 : 10,
  speedIncrement: 2,
  startY: 100,
  // healthMultiplier...
}, {
  probDrop: 0.15,
  maxDrops: 5,
  maxDropsAlive: 2,
  enemyTypes: [Enemy.Types.Normal1, Enemy.Types.Normal2, Enemy.Types.Base3],
  enemyRows: [0, 1, 2, 1, 0],
  enemyMargin: new Phaser.Point(40, 10),
  jump: 25,
  enemySpeed: 22,
  speedIncrement: 5,
  startY: 70,
//  healthMultiplier: 2,
}, {
  probDrop: 0.1,
  maxDrops: 6,
  maxDropsAlive: 2,
  enemyTypes: [Enemy.Types.Normal1, Enemy.Types.Normal2],
  enemyRows: [1, 1, 0, 1, 0],
  enemyMargin: new Phaser.Point(30, 10),
  jump: 30,
  enemySpeed: 25,
  speedIncrement: 3,
  startY: 60,
}];

// Array of level scripts.
Scripts = [
  [
    'Captain! The enemy is attacking our base!',
    'Press [UP] to fire.',
    'Destroy them all before they reach us!',
  ],
  [
    'The enemy has become more advanced!',
    'Use [LEFT] and [RIGHT] to dodge their attacks.',
  ],
];


module.exports = Play;

