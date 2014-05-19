
'use strict';
function Menu() {}

Menu.prototype = {
  preload: function() {

  },
  create: function() {
    var style = { font: '60px Verdana', fill: '#ffffff', align: 'center'};

    this.titleText = this.game.add.text(
      this.game.world.centerX, this.game.world.centerY - 20,
      'Space\nAppropriators', style);
    this.titleText.anchor.setTo(0.5, 0.5);

    this.instructionsText = this.game.add.text(
      this.game.world.centerX,
      this.titleText.y + this.titleText.height / 2 + 20,
      'Click anywhere to play Space Appropriators.',
      { font: '16px Verdana', fill: '#ffffff', align: 'center'});
    this.instructionsText.anchor.setTo(0.5, 0);
  },
  update: function() {
    if(this.game.input.activePointer.justPressed() ||
       window.location.href.indexOf('skipMenu') > -1) {
      this.game.state.start('play');
    }
  }
};

module.exports = Menu;
