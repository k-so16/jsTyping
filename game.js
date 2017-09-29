var jDict;
var wordList;
var debug = false;

//  load dictionary data and word list data
$.getJSON("jDict.json",    data => jDict    = data);
$.getJSON("wordList.json", data => wordList = data);

$(() => {
  var game = new Game();

  $(window).on('keydown', e => {
    // start game if space key typed
    if(e.originalEvent.key == ' ') {
      game.start();
    } else if(e.originalEvent.key == 'd') {
      debug = !debug;
      console.log('debug: ' + ((debug) ? 'On' : 'Off'));
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
    this.timeLimit    = 30 * 1000;    // use millisecond for setTimeout()
    this.result       = new Result();
    this.correctInput = [];
    this.quiz;
    this.prevWord;

    this.initWindow();
  }

  initWindow() {
    this.gWin = {
      frame     : new GameFrame({id : 'window'}),
      message   : new GameLabel(
                    'スペースキーを押してください', {id : 'message'}),
      word      : new GameLabel(''),
      ruby      : new GameLabel('', {id: 'ruby'}),
      roman     : new GameLabel(''),
      answer    : new GameLabel('', {id: 'answer'}),
      result    : new GameFrame({id : 'result'}),
      correct   : new GameLabel(''),
      wrong     : new GameLabel(''),
      remainder : new GameLabel('', {id: 'countdown'})
    };

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
    // $('body').append(this.gWin.frame.getJqueryNode());
    $('#gamePanel').append(this.gWin.frame.getJqueryNode());
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
        var list = this.addSyllabicNasal2List(quiz.ruby, i);
        for(var idx = 0; idx < list.length; idx++) {
          this.list.push(list[idx]);
        }

        // adjust index
        if(i + 2 < quiz.ruby.length) {
          if(list.length > 1) {
            i += (((quiz.ruby)[i+2].match(/[ゃゅょ]/)) ? 2 : 1);
          }
        } else if(list.length > 1) {
          i++;
        }

      } else if((quiz.ruby)[i] == 'っ') {
        this.list.push((this.addDoubleConsonant2List(quiz.ruby, i))[0]);
      } else if(i + 1 < quiz.ruby.length
                  && (quiz.ruby)[i+1].match(/[ゃゅょ]/)) {
        this.list.push((this.addComplexKana2List(quiz.ruby, i))[0]);
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
      return item.getCandidate();
    }).join('');
  }

  // doubel consonant (small tsu)
  addDoubleConsonant2List(ruby, index) {
    if(index + 1 < ruby.length) {
      if(ruby[index+1].match(/[あいうえおなにぬねのやゆよん]/)) {
        return [new Roman(ruby[index])];
      } else {
        if(index + 2 < ruby.length && ruby[index+2].match(/[ゃゅょ]/)) {
          var next = jDict[ruby[index+1]+ruby[index+2]].map(key => key[0]);
          jDict[ruby[index]].map(method => next.push(method));
          return [new Roman(ruby[index], next)];
        } else {
          var next = jDict[ruby[index+1]].map(key => key[0]);
          jDict[ruby[index]].map(method => next.push(method));
          return [new Roman(ruby[index], next)];
        }
      }
    } else {
      return [new Roman((quiz.ruby)[index])];
    }
  }

  // syllabic nasal (m, n sound)
  addSyllabicNasal2List(ruby, index) {
    if(index + 1 < ruby.length) {
      // check whether default pattern or not based on next kana
      if(ruby[index+1].match(/[あいうえおなにぬねのやゆよん]/)) {
        return [new Roman(ruby[index])];
      } else {
        if(index + 2 < ruby.length && ruby[index+2].match(/[ゃゅょ]/)) {
          if(debug) {
            console.log(index + 2 + ': ' + ruby[index+2]);
          }
          var candidates = jDict[ruby[index+1]+ruby[index+2]];
          var additional = candidates.map(item => "n" + item);
          additional.map(item => candidates.push(item));
          return [
            new Roman(ruby[index],                   ["n"]),
            new Roman(ruby[index+1] + ruby[index+2], candidates)
          ];
        } else {
          var candidates = jDict[ruby[index+1]];
          var additional = candidates.map(item => "n" + item);
          additional.map(item => candidates.push(item));

          return [
            new Roman(ruby[index],   ["n"]),
            new Roman(ruby[index+1], candidates)
          ];
        }
      }
    } else {
      // set default candidates if last character
      // this.list.push(new Roman(ruby[index]));
      return [new Roman(ruby[index])];
    }
  }

  // small kana
  addComplexKana2List(ruby, index) {
    // check if next character is small kana
    var complexKana = ruby[index] + ruby[index+1];
    var methods     = [];
    if(jDict[complexKana]) {
      methods = jDict[complexKana];
    }

    // create answer candidate of being typed each kana
    var first   = jDict[ruby[index]];
    var second  = jDict[ruby[index+1]];
    for(var i = 0; i < first.length; i++) {
      for(var j = 0; j < second.length; j++) {
        methods.push(first[i] + second[j]);
      }
    }
    return [new Roman(complexKana, methods)];
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
