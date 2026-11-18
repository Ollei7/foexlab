const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, ladeDatei } = require('../helfer');

function werkzeug(art, datei) {
  const w = dom(`<div class="fx-feld" data-fx-id="a/k/w" data-fx-art="${art}"><div class="fx-werkzeug-flaeche"></div></div>`);
  lade(w, 'store', 'felder');
  ladeDatei(w, 'kurse/bb84/werkzeuge/bb84kern.js'); const FX = ladeDatei(w, 'kurse/bb84/werkzeuge/' + datei);
  const el = w.document.querySelector('.fx-feld'), h = FX.felder.arten[art];
  h.init(el);
  return { w, el, h, d: w.document, klick: (t) => Array.from(el.querySelectorAll('button')).find((b) => b.textContent.trim() === t).click() };
}

test('Präparation: Klick auf −45° zeigt |↘⟩, Basis × und Bit 0', () => {
  const { el, klick } = werkzeug('praeparation', 'praeparation.js');
  klick('−45°');
  const t = el.querySelector('.fx-prae-text').textContent;
  assert.match(t, /Basis ×/); assert.match(t, /Bit 0/); assert.match(t, /\|↘⟩/);
  assert.strictEqual(el.querySelector('button[aria-pressed="true"]').textContent, '−45°');
});

test('Präparation: alle vier Einstellungen laut Kodierung', () => {
  const { el, klick } = werkzeug('praeparation', 'praeparation.js');
  const erwartet = { '0°': ['+', 0, '|↑⟩'], '90°': ['+', 1, '|→⟩'], '−45°': ['×', 0, '|↘⟩'], '45°': ['×', 1, '|↗⟩'] };
  for (const [w, [basis, bit, ket]] of Object.entries(erwartet)) {
    klick(w); assert.strictEqual(el.querySelector('.fx-prae-text').textContent, `Basis ${basis}, Bit ${bit}, Zustand ${ket}`, w);
  }
});

test('Präparation: kein Protokolleintrag, immer leer', () => {
  const { h, el } = werkzeug('praeparation', 'praeparation.js');
  assert.strictEqual(h.leer(h.wert(el)), true); assert.strictEqual(h.ohneProtokoll, true);
});

test('Superposition: |↑⟩ in [×] hat ein Minus und zweimal 50 %', () => {
  const { el, klick } = werkzeug('superposition', 'superposition.js');
  klick('|↑⟩ in [×]');
  const f = el.querySelector('.fx-spd-formel').textContent;
  assert.match(f, /\|↑⟩ = .*\|↗⟩ − .*\|↘⟩/); assert.match(f, /√2/);
  const b = el.querySelector('.fx-spd-balken').textContent;
  assert.strictEqual((b.match(/50 %/g) || []).length, 2);
  assert.ok(el.querySelector('svg'));
});

test('Superposition: alle vier Fälle laut Dominiks Zerlegung', () => {
  const { el, klick } = werkzeug('superposition', 'superposition.js');
  const erwartet = {
    '|→⟩ in [×]': /\|→⟩ = .*\|↗⟩ \+ .*\|↘⟩/, '|↑⟩ in [×]': /\|↑⟩ = .*\|↗⟩ − .*\|↘⟩/,
    '|↗⟩ in [+]': /\|↗⟩ = .*\|↑⟩ \+ .*\|→⟩/, '|↘⟩ in [+]': /\|↘⟩ = .*\|→⟩ − .*\|↑⟩/
  };
  for (const [k, re] of Object.entries(erwartet)) { klick(k); assert.match(el.querySelector('.fx-spd-formel').textContent, re, k); }
  assert.match(el.querySelector('.fx-spd-hinweis').textContent, /Minuszeichen bedeutet, dass der Anteil in die entgegengesetzte Richtung zeigt/);
});
