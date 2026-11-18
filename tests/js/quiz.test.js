const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, plain } = require('./helfer');

const ZAHL = `<div class="q" data-type="num"><input class="num" data-answers='[["1.3",0.05,1.0,""]]'><span class="res"></span></div>`;
const LUECKE = `<div class="q" data-type="gaps"><select class="gap" data-correct="einen Laser"><option value=""></option><option>eine LED</option><option>einen Laser</option></select><span class="res"></span></div>`;
const MC = `<div class="q" data-type="mc"><ul><li><label><input type="radio" data-f="1"></label></li><li><label><input type="radio" data-f="0"></label></li></ul><span class="res"></span></div>`;

test('Zahlfrage mit Toleranz und Dezimalkomma', () => {
  const w = dom(ZAHL); const FX = lade(w, 'quiz');
  const q = w.document.querySelector('.q');
  q.querySelector('input').value = '1,32';
  assert.strictEqual(FX.quiz.pruefe(q).anteil, 1);
  q.querySelector('input').value = '1,4';
  assert.strictEqual(FX.quiz.pruefe(q).anteil, 0);
});

test('Lücke richtig gewählt', () => {
  const w = dom(LUECKE); const FX = lade(w, 'quiz');
  const q = w.document.querySelector('.q');
  q.querySelector('select').value = 'einen Laser';
  const r = FX.quiz.pruefe(q);
  assert.strictEqual(r.anteil, 1);
  assert.deepStrictEqual(plain(r.antwort), ['einen Laser']);
});

test('setze stellt eine Antwort wieder her', () => {
  const w = dom(MC); const FX = lade(w, 'quiz');
  const q = w.document.querySelector('.q');
  FX.quiz.setze(q, [0]);
  assert.strictEqual(q.querySelectorAll('input')[0].checked, true);
  assert.strictEqual(FX.quiz.pruefe(q).anteil, 1);
  FX.quiz.zuruecksetzen(q);
  assert.strictEqual(q.querySelectorAll('input')[0].checked, false);
});
