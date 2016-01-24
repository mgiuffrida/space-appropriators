'use strict';

// Returns the version of Internet Explorer or a -1
// (indicating the use of another browser).
function getInternetExplorerVersion()
{
  var rv = -1;
  var ua = window.navigator.userAgent;
  var re;
  if (window.navigator.appName === 'Microsoft Internet Explorer') {
    re = new RegExp('MSIE ([0-9]{1,}[\\.0-9]{0,})');
    if (re.exec(ua) !== null)
      rv = parseFloat(RegExp.$1);
  } else if (window.navigator.appName === 'Netscape') {
    re = new RegExp('Trident/.*rv:([0-9]{1,}[\\.0-9]{0,})');
    if (re.exec(ua) !== null)
      rv = parseFloat(RegExp.$1);
  }
  return rv;
}

function Preload() {
  this.asset = null;
  this.ready = false;
}

Preload.prototype = {
  preload: function() {
    this.asset = this.add.sprite(this.width/2,this.height/2, 'preloader');
    this.asset.anchor.setTo(0.5, 0.5);

    this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
    this.load.setPreloadSprite(this.asset);

    this.load.image('player', 'assets/images/player.png');

    this.load.spritesheet('enemy-base',
                          'assets/images/enemy-base-sheet.png',
                          32, 32);

    this.load.spritesheet('enemy-base2',
                          'assets/images/enemy-base2-sheet.png',
                          32, 32);

    this.load.image('enemy-base3', 'assets/images/enemy-base3.png');
/*
    this.load.image('bomber', 'assets/images/enemy.png');
    this.load.image('bomber-red', 'assets/images/enemy-red.png');
*/
    this.load.image('bullet', 'assets/images/bullet.png');

    this.load.image('bomb-base2', 'assets/images/bomb-base2.png');
    this.load.image('bomb-base3', 'assets/images/bomb-base3.png');

    this.load.image('power-up', 'assets/images/power-up.png');

    this.load.spritesheet('continue', 'assets/images/continue-sheet.png',
                          500, 75);

    var extension = (getInternetExplorerVersion() === -1) ? 'wav' : 'mp3';
    this.load.audio('shoot', 'assets/sounds/shoot-sin.' + extension);
    this.load.audio('shoot-soft', 'assets/sounds/shoot-triangle.' + extension);
    this.load.audio('explosion', 'assets/sounds/explosion.' + extension);
    this.load.audio('enemy-hit', 'assets/sounds/enemy-hit.' + extension);
    this.load.audio('power-up', 'assets/sounds/power-up.' + extension);
  },

  create: function() {
    this.asset.cropEnabled = false;
  },

  update: function() {
    if(this.ready) {
      this.game.state.start('play');
    }
  },

  onLoadComplete: function() {
    this.ready = true;
  }
};

module.exports = Preload;
