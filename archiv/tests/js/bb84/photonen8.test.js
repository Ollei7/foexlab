const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, ladeDatei, plain } = require('../helfer');

function aufbau(zufall) {
  const w = dom('<div class="fx-feld" data-fx-id="n/k/p8" data-fx-art="photonen8"><div class="fx-werkzeug-flaeche"></div></div>');
  lade(w, 'store', 'felder');
  const FX = ladeDatei(w, 'kurse/bb84/werkzeuge/bb84kern.js');
  if (zufall) FX.bb84.zufall = zufall;
  ladeDatei(w, 'kurse/bb84/werkzeuge/photonen8.js');
  const el = w.document.querySelector('.fx-feld'), h = FX.felder.arten.photonen8; h.init(el);
  const zeilen = () => Array.from(el.querySelectorAll('tbody tr'));
  const zellen = (i) => Array.from(zeilen()[i].querySelectorAll('td')).map((t) => t.textContent.replace(/\s+/g, ' ').trim());
  return { w, el, h, zeilen, zellen, weiter: () => el.querySelector('.fx-p8-weiter').click(), neu: () => el.querySelector('.fx-p8-neu').click(),
    fortschritt: () => el.querySelector('.fx-p8-fortschritt').textContent, schluessel: () => el.querySelector('.fx-p8-schluessel') };
}

test('Start: 0 / 8 Photonen, acht verdeckte Zeilen, kein Schlüssel', () => {
  const { zeilen, fortschritt, schluessel, zellen } = aufbau();
  assert.strictEqual(fortschritt(), '0 / 8 Photonen'); assert.strictEqual(zeilen().length, 8);
  assert.deepStrictEqual(zellen(0), ['1', '?', '?', '?', '?', '?', '?', '?']); assert.strictEqual(schluessel().hidden, true);
});

test('Jeder Klick deckt eine Zeile vollständig auf (Spalten wie bei Dominik)', () => {
  const { weiter, zellen, fortschritt } = aufbau(() => 0.9);
  weiter();
  assert.deepStrictEqual(zellen(0), ['1', '0', '+', '↑', '+', '0 ↑', '✓ Ja', '0']);
  assert.strictEqual(fortschritt(), '1 / 8 Photonen');
  weiter();   // Zeile 2: Alice 1 ×, Bob +, Basen ungleich
  assert.deepStrictEqual(zellen(1).slice(0, 5), ['2', '1', '×', '↗', '+']); assert.strictEqual(zellen(1)[6], '✗ Nein'); assert.strictEqual(zellen(1)[7], '–');
  assert.deepStrictEqual(zellen(2), ['3', '?', '?', '?', '?', '?', '?', '?']);
});

test('Nach 8 Schritten ist der Rohschlüssel 01001', () => {
  for (const z of [() => 0.1, () => 0.9, () => 0.5]) {
    const { weiter, schluessel, fortschritt, zellen, el } = aufbau(z);
    for (let i = 0; i < 8; i++) weiter();
    assert.strictEqual(schluessel().hidden, false); assert.match(schluessel().textContent, /01001/);
    assert.strictEqual(fortschritt(), '8 / 8 Photonen');
    for (const i of [1, 4, 7]) assert.strictEqual(zellen(i)[7], '–', 'Zeile ' + (i + 1));
    for (const [i, bit] of [[0, '0'], [2, '1'], [3, '0'], [5, '0'], [6, '1']]) assert.strictEqual(zellen(i)[7], bit);
    assert.strictEqual(el.querySelector('.fx-p8-weiter').disabled, true);
  }
});

test('Ungleiche Basis: Bobs Ergebnis kommt aus dem Zufall', () => {
  const eins = aufbau(() => 0.9), null_ = aufbau(() => 0.1);
  eins.weiter(); eins.weiter(); null_.weiter(); null_.weiter();
  assert.strictEqual(eins.zellen(1)[5].charAt(0), '1'); assert.strictEqual(null_.zellen(1)[5].charAt(0), '0');
});

test('Neustart setzt auf 0 / 8 Photonen', () => {
  const { weiter, neu, fortschritt, schluessel, zellen, el } = aufbau();
  for (let i = 0; i < 8; i++) weiter();
  neu();
  assert.strictEqual(fortschritt(), '0 / 8 Photonen'); assert.strictEqual(schluessel().hidden, true);
  assert.deepStrictEqual(zellen(0), ['1', '?', '?', '?', '?', '?', '?', '?']); assert.strictEqual(el.querySelector('.fx-p8-weiter').disabled, false);
});

test('kein Speicherwert, kein Protokoll', () => {
  const { h, el } = aufbau(); assert.strictEqual(h.leer(h.wert(el)), true); assert.strictEqual(h.ohneProtokoll, true);
});
