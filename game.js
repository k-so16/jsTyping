var jDict;
var wordList;

$.getJSON("jDict.json", data => jDict = data);
$.getJSON("wordList.json", data => wordList = data);

$(() => {
  var game = new Game();

  $(window).on('keydown', e => {
    if(String.fromCharCode(e.keyCode) == ' ') {
      game.start();
    }
  });
});


class Quiz {
  constructor() {
    var index = Math.floor(Math.random() * wordList.length);
    var quiz = wordList[index];

    this.list = [];
    for(var i = 0; i < quiz.ruby.length; i++) {
      this.list.push(new Roman((quiz.ruby)[i]));
    }
    console.log(this.list);

    this.pos = 0;
    this.word = quiz.word;
    this.ruby = quiz.ruby;
    this.roman = this.list.map(item => {
      return item.getCandidate();
    }).join('');

    console.log(this.roman);
  }

  getWord() {
    return this.word;
  }

  getRuby() {
    return this.ruby;
  }

  getRoman() {
    return this.list.map(item => {
      return item.getCandidate();
    }).join('');
  }

  checkKey(key) {
    var result = this.list[this.pos].checkKey(key);
    if(this.list[this.pos].isEndOfKana()) {
      this.pos++;
    }

    return result;
  }

  isEndOfWord() {
    return this.pos == this.list.length;
  }
}


class Roman {
  constructor(kana) {
    this.wordPos = 0;
    this.candidatePos = 0;
    this.candidates = [];

    var romanList = jDict[kana];
    for(var i = 0; i < romanList.length; i++) {
      this.candidates.push(romanList[i]);
    }
  }

  getCandidate() {
    return this.candidates[this.candidatePos];
  }

  checkKey(key) {
    for(var pos = this.candidatePos; pos < this.candidates.length; pos++) {
      if(this.candidates[pos].charAt(this.wordPos) == key) {
        this.candidatePos = pos;
        this.wordPos++;
        return true;
      }
    }
    return false;
  }

  isEndOfKana() {
    return this.wordPos == this.candidates[this.candidatePos].length;
  }
}



class GameWindow {
  constructor(tag, attr) {
    if(attr === undefined) {
      this.jQueryNode = $('<' + tag + '>');
    } else {
      this.jQueryNode = $('<' + tag + '>').attr(attr);
    }
  }

  getJqueryNode() {
    return this.jQueryNode;
  }

  setJqueryNode(jNode) {
    this.jQueryNode = jNode;
  }

  append(content) {
    this.jQueryNode.append(content.jQueryNode);
  }

  appendToBody() {
    this.jQueryNode.appendTo('body');
  }

  show() {
    this.jQueryNode.show();
  }

  hide() {
    this.jQueryNode.hide();
  }  
}

class GameFrame extends GameWindow {
  constructor(attr) {
    super('div', attr);
  }
}

class GameLabel extends GameWindow {
  constructor(text, attr) {
    super('p', attr);
    this.jQueryNode.text(text);
  }

  setText(text) {
    this.jQueryNode.html(text);
  }
}


class Game {
  constructor() {
    this.timeLimit = 30 * 1000;
    this.gWin = {
      frame   : new GameFrame({id : 'window'}),
      message : new GameLabel('スペースキーを押してください', {id : 'message'}),
      word    : new GameLabel(''),
      roman   : new GameLabel(''),
      answer  : new GameLabel('', {id: 'answer'}),
      result  : new GameFrame({id : 'result'}),
      correct : new GameLabel(''),
      wrong   : new GameLabel('')
    };
    this.result = new Result();
    this.correctInput = [];
    this.quiz;
    this.prevWord;

    this.gWin.word.hide();
    this.gWin.roman.hide();
    this.gWin.answer.hide();
    this.gWin.result.hide();

    this.gWin.result.append(this.gWin.correct);
    this.gWin.result.append(this.gWin.wrong);

    this.gWin.frame.append(this.gWin.message);
    this.gWin.frame.append(this.gWin.word);
    this.gWin.frame.append(this.gWin.roman);
    this.gWin.frame.append(this.gWin.answer);
    this.gWin.frame.append(this.gWin.result);
    $('body').append(this.gWin.frame.getJqueryNode());
    // this.gWin.frame.appendToBody();
  }

  start() {
    var game = this;
    var sec  = 3;

    $(window).off('keydown');

    (function countdown() {
      if(sec > 0) {
        game.gWin.message.setText(sec--);
        setTimeout(countdown, 1000);
      } else {
        game.setNewQuiz();
        // setTimeout(() => game.end(), game.timeLimit);
        $(window).on('keydown', e => 
          game.checkTyping(String.fromCharCode(e.keyCode)));
        setTimeout(() => game.end(), game.timeLimit);
      }
    })();
  }

  setNewQuiz() {
    do {
      this.quiz = new Quiz();
    } while(this.prevWord == this.quiz.getWord());
    this.prevWord = this.quiz.getWord();

    this.gWin.message.hide();
    this.gWin.word.show();
    this.gWin.roman.show();
    this.gWin.answer.show();

    this.gWin.word.setText(this.quiz.getWord());
    this.gWin.roman.setText(this.quiz.getRoman());
    this.gWin.answer.setText('&nbsp;', true);
  }

  checkTyping(key) {
    var result = this.quiz.checkKey(key);
    if(result) {
      this.gWin.roman.setText(this.quiz.getRoman());
      this.correctInput.push(key);
      this.gWin.answer.setText(this.correctInput.join(''));
      this.result.addCorrect();
      if(this.quiz.isEndOfWord()) {
        this.setNewQuiz();
        this.correctInput = [];
      }
    } else {
      this.result.addWrong();
    }

    console.log(result);
  }

  end() {
    $(window).off('keydown');

    this.gWin.word.hide();
    this.gWin.roman.hide();
    this.gWin.answer.hide();

    this.gWin.message.setText('お疲れ様でした');
    this.gWin.correct.setText('正しいタイプ数: ' + this.result.getCorrect());
    this.gWin.wrong.setText('ミスタイプ数: ' + this.result.getWrong());

    this.gWin.result.show();
    this.gWin.message.show();

    $(window).on('keydown', e => {
      if(String.fromCharCode(e.keyCode) == ' ') {
        this.restart();
      }
    });
  }

  restart() {
    this.correctInput = [];
    this.result = new Result();
    this.preWord = '';

    this.gWin.result.hide();
    this.start();
  }
}

class Result {
  constructor() {
    this.correct = 0;
    this.wrong   = 0;
  }

  getCorrect() {
    return this.correct;
  }

  getWrong() {
    return this.wrong;
  }

  addCorrect() {
    this.correct++;
  }

  addWrong() {
    this.wrong++;
  }
}
