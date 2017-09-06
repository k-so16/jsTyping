var jDict;
var wordList;

//  load dictionary data and word list data
$.getJSON("jDict.json", data => jDict = data);
$.getJSON("wordList.json", data => wordList = data);

$(() => {
  var game = new Game();

  $(window).on('keydown', e => {
    // start game if space key typed
    if(e.originalEvent.key == ' ') {
      game.start();
    }
  });
});



/************************/
/*                      */
/*  game manager class  */
/*                      */
/************************/

class Game {
  constructor() {
    this.timeLimit = 30 * 1000;
    this.gWin = {
      frame     : new GameFrame({id : 'window'}),
      message   : new GameLabel('スペースキーを押してください', {id : 'message'}),
      word      : new GameLabel(''),
      ruby      : new GameLabel('', {id: 'ruby'}),
      roman     : new GameLabel(''),
      answer    : new GameLabel('', {id: 'answer'}),
      result    : new GameFrame({id : 'result'}),
      correct   : new GameLabel(''),
      wrong     : new GameLabel(''),
      remainder : new GameLabel('', {id: 'countdown'})
    };
    this.result = new Result();
    this.correctInput = [];
    this.quiz;
    this.prevWord;

    // set game window
    this.gWin.word.hide();
    this.gWin.ruby.hide();
    this.gWin.roman.hide();
    this.gWin.answer.hide();
    this.gWin.result.hide();
    this.gWin.remainder.hide();

    this.gWin.result.append(this.gWin.correct);
    this.gWin.result.append(this.gWin.wrong);

    this.gWin.frame.append(this.gWin.message);
    this.gWin.frame.append(this.gWin.ruby);
    this.gWin.frame.append(this.gWin.word);
    this.gWin.frame.append(this.gWin.roman);
    this.gWin.frame.append(this.gWin.answer);
    this.gWin.frame.append(this.gWin.result);
    this.gWin.frame.append(this.gWin.remainder);
    $('body').append(this.gWin.frame.getJqueryNode());
  }


  start() {
    var game = this;
    var sec  = 3;

    $(window).off('keydown');

    (function countdown() {
      if(sec > 0) {
        // countdown for starting game
        game.gWin.message.setText(sec--);
        setTimeout(countdown, 1000);
      } else {
        game.setNewQuiz();
        $(window).on('keydown', e => 
          // game.checkTyping(String.fromCharCode(e.keyCode)));
          game.checkTyping(e.originalEvent.key));


        sec = game.timeLimit / 1000;
        game.gWin.remainder.show();
        // countdown for ending game
        (function showRemainderTime() {
          if(sec > 0) {
            game.gWin.remainder.setText('残り ' + (--sec) + ' 秒');
            setTimeout(showRemainderTime, 1000);
          } else {
            game.end();
          }
         })();
      }
     })();
  }


  setNewQuiz() {
    do {
      // set quiz which is different from previous quiz word
      this.quiz = new Quiz();
    } while(this.prevWord == this.quiz.getWord());
    this.prevWord = this.quiz.getWord();

    // change game window
    this.gWin.message.hide();
    this.gWin.ruby.show();
    this.gWin.word.show();
    this.gWin.roman.show();
    this.gWin.answer.show();

    this.gWin.ruby.setText(this.quiz.getRuby());
    this.gWin.word.setText(this.quiz.getWord());
    this.gWin.roman.setText(this.quiz.getRoman());
    this.gWin.answer.setText('&nbsp;');
  }


  checkTyping(key) {
    var result = this.quiz.checkKey(key);
    if(result) {
      // update appropriate input method
      this.gWin.roman.setText(this.quiz.getRoman());

      // display typed key
      this.correctInput.push(key);
      this.gWin.answer.setText(this.correctInput.join(''));

      this.result.addCorrect();

      if(this.quiz.isEndOfWord()) {
        this.setNewQuiz();
        this.correctInput = [];
      }
    } else {
      this.result.addWrong();
      this.gWin.frame.blink("blink");
    }

    // console.log(result);
  }


  end() {
    $(window).off('keydown');

    // change game window
    this.gWin.word.hide();
    this.gWin.ruby.hide();
    this.gWin.roman.hide();
    this.gWin.answer.hide();
    this.gWin.remainder.hide();

    // show result
    this.gWin.message.setText(
      'お疲れ様でした<br>スペースキーを押して再挑戦');
    this.gWin.correct.setText('正しいタイプ数: ' + this.result.getCorrect());
    this.gWin.wrong.setText('ミスタイプ数: ' + this.result.getWrong());

    this.gWin.result.show();
    this.gWin.message.show();

    // listen to retry
    $(window).on('keydown', e => {
      // if(String.fromCharCode(e.keyCode) == ' ') {
      if(e.originalEvent.key == ' ') {
        this.retry();
      }
    });
  }


  retry() {
    this.correctInput = [];
    this.result = new Result();
    this.preWord = '';

    this.gWin.result.hide();
    this.start();
  }
}



/***********************/
/*                     */
/*  game window class  */
/*                     */
/***********************/

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

  blink(blink_class) {
    this.jQueryNode.addClass(blink_class);
    setTimeout(() => this.jQueryNode.removeClass(blink_class), 100);
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



/**************************/
/*                        */
/*  result manager class  */
/*                        */
/**************************/

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



/*******************************/
/*                             */
/*  input method class         */
/*    with managing candidate  */
/*                             */
/*******************************/

class InputMethod {
  constructor(method) {
    this.method    = method;
    this.candidate = true;
    this.length    = method.length;
  }

  getMethod() {
    return this.method;
  }

  getKey(index) {
    return this.method.charAt(index);
  }

  isCandidate() {
    return this.candidate;
  }

  takeOffCandidate() {
    this.candidate = false;
  }
}



/******************************/
/*                            */
/*  kana input manager class  */
/*                            */
/******************************/

class Roman {
  constructor(kana, methods) {
    this.candidates     = [];
    if(methods) {
      this.candidates = methods.map(method => new InputMethod(method));
    } else {
      var romanCandidates = jDict[kana];
      // console.log(kana);
      for(var i = 0; i < romanCandidates.length; i++) {
        this.candidates.push(new InputMethod(romanCandidates[i]));
      }
    }

    this.romanPos     = 0;
    this.candidatePos = 0;
  }

  getCandidate() {
    return this.candidates[this.candidatePos].getMethod();
  }

  checkKey(key) {
    for(var pos = this.candidatePos; pos < this.candidates.length; pos++) {
      if(this.candidates[pos].getKey(this.romanPos) == key) {
        if(this.candidates[pos].isCandidate()) {
          // check candidate
          for(var i = pos; i < this.candidates.length; i++) {
            if(this.candidates[i].getKey(this.romanPos) != key) {
              this.candidates[i].takeOffCandidate();
            }
          }

          // modify position
          this.candidatePos = pos;
          this.romanPos++;
          return true;
        }
      }
    }

    return false;
  }


  isEndOfKana() {
    return this.romanPos == this.candidates[this.candidatePos].length;
  }
}



/***********************/
/*                     */
/*  quiz string class  */
/*                     */
/***********************/
class Quiz {
  constructor() {
    var index = Math.floor(Math.random() * wordList.length);
    var quiz = wordList[index];

    this.list = [];
    for(var i = 0; i < quiz.ruby.length; i++) {
      if((quiz.ruby)[i] == 'ん') {
        if(i + 1 < quiz.ruby.length) {
          // check whether default pattern or not
          if((quiz.ruby)[i+1].match(/[あいうえおなにぬねのやゆよん]/)) {
            this.list.push(new Roman((quiz.ruby)[i]));
          } else {
            var next       = quiz.ruby[i+1];
            var candidates = jDict[next];
            var additional = candidates.map(item => "n" + item);
            additional.map(item => candidates.push(item));

            this.list.push(new Roman((quiz.ruby)[i], ["n"]));
            this.list.push(new Roman((quiz.ruby)[i+1], candidates));

            i++;
          }
        } else {
          // set default candidates if last character
          this.list.push(new Roman((quiz.ruby)[i]));
        }
      } else if(i + 1 < quiz.ruby.length
                  && (quiz.ruby)[i+1].match(/[ゃゅょ]/)) {
        // check if next character is small kana
        var complexKana = (quiz.ruby)[i] + (quiz.ruby)[i+1];
        var methods     = [];
        if(jDict[complexKana]) {
          // this.list.push(new Roman(complexKana));
          methods = jDict[complexKana];
        }

        // create answer candidate of being typed each kana
        var first   = jDict[(quiz.ruby)[i]];
        var second  = jDict[(quiz.ruby)[i+1]];
        for(var j = 0; j < first.length; j++) {
          for(var k = 0; k < second.length; k++) {
            // var method = first[j] + second[k];
            methods.push(first[j] + second[k]);
          }
        }
        this.list.push(new Roman(complexKana, methods));

        i++;
      } else {
        this.list.push(new Roman((quiz.ruby)[i]));
      }
    }

    this.pos = 0;
    this.word = quiz.word;
    this.ruby = quiz.ruby;
    this.roman = this.list.map(item => {
      // a sequence of kana candidates object
      // console.log(item.getCandidate());
      return item.getCandidate();
    }).join('');

    // console.log(this.roman);
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
      // increment pos if typed key reaced the end of kana
      this.pos++;
    }

    return result;
  }

  isEndOfWord() {
    return this.pos == this.list.length;
  }
}
