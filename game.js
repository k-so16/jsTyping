var jDict;
var wordList;

$(() => {
  $.getJSON("jDict.json", jDict);
  $.getJSON("wordList.json", wordList);
});
