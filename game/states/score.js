'use strict';

function Score() {
  this.onInitCallback = this.init;
}

Score.prototype = {
  create: function() {
    this.createTime = this.game.time.now;
    this.stage.backgroundColor = '#000';

    this.scoreText = this.game.add.text(this.game.width / 2, 120,
                                        'Score: ' + this.score +
                                        '\nTotal: ' + this.totalScore,
                                        { font: '16px Verdana',
                                          'fill': 'white' });
    this.scoreText.anchor.setTo(0.5, 0);

    this.prompt = this.game.add.text(this.game.width / 2, 200,
                                     'Press any key to continue',
                                     { font: '16px Verdana',
                                       'fill': 'white' });
    this.prompt.anchor.setTo(0.5, 0);

    this.continueBtn = this.game.add.button(this.game.width / 2,
                                            265,
                                           'continue',
                                           this.closeScreen,
                                           this,
                                           1, 0);
//    this.continueBtn.frame = 1;
    this.continueBtn.anchor.setTo(0.5, 0);

    this.game.input.keyboard.onDownCallback = this.closeScreen.bind(this);
  },

  init: function(score, totalScore) {
    this.score = score;
    this.totalScore = totalScore;
  },

  update: function() {
  },

  closeScreen: function() {
    if (this.game.time.now - this.createTime > 1000)
      this.game.state.start('play');
  },

  shutdown: function() {
    this.game.input.keyboard.onDownCallback = null;
  },
};

module.exports = Score;
