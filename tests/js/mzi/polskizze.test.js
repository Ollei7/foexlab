const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, ladeDatei, mitDb, plain } = require('../helfer');

function umgebung() {
  const w = mitDb(dom('<div class="fx-feld" data-fx-id="aufbau/k/pol" data-fx-art="polskizze" data-fx-titel="T"><div class="qtext"><p>Skizze des Aufbaus</p></div><div class="fx-werkzeug-flaeche"></div></div>'));
  const FX = lade(w, 'store', 'felder');
  ladeDatei(w, 'kurse/mzi/werkzeuge/mzikern.js');
  ladeDatei(w, 'kurse/mzi/werkzeuge/polskizze.js');
  return { w, FX, el: w.document.querySelector('.fx-feld') };
}

test('polskizze: zeigt die Skizze mit dem Fragetext als Bildunterschrift', () => {
  const { FX, el } = umgebung();
  FX.felder.arten.polskizze.init(el);
  assert.ok(el.querySelector('figure.mzi-skizze svg'));
  assert.strictEqual(el.querySelector('figcaption').textContent.trim(), 'Skizze des Aufbaus');
  assert.ok(el.querySelector('.qtext').hidden);
});

test('polskizze: mehrfaches init baut nur einmal auf; nie ausgefüllt, nicht im Protokoll', () => {
  const { FX, el } = umgebung();
  const H = FX.felder.arten.polskizze;
  H.init(el); H.init(el);
  assert.strictEqual(el.querySelectorAll('figure').length, 1);
  assert.deepStrictEqual(plain(H.wert(el)), {});
  assert.strictEqual(H.leer(H.wert(el)), false);
  assert.strictEqual(H.ohneProtokoll, true);
});
