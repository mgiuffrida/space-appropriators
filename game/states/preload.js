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

    this.load.image('bomber', 'assets/images/enemy.png');
    this.load.image('bomber-red', 'assets/images/enemy-red.png');

    this.load.image('bullet', 'assets/images/bullet.png');

    var extension = (getInternetExplorerVersion() === -1) ? 'wav' : 'mp3';
    this.load.audio('shoot', 'assets/sounds/shoot-sin.' + extension);
    this.load.audio('shoot-soft', 'assets/sounds/shoot-triangle.' + extension);
    this.load.audio('explosion', 'assets/sounds/explosion.' + extension);
    this.load.audio('enemy-hit', 'assets/sounds/enemy-hit.' + extension);
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
