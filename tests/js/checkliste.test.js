const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, plain } = require('./helfer');

const HTML = `<div class="fx-feld" data-fx-id="a/k/material" data-fx-art="checkliste"><ul class="fx-checkliste">
<li><label class="fx-haken"><input type="checkbox"> <span>Laser</span></label></li>
<li><label class="fx-haken"><input type="checkbox"> <span>Strahlteiler</span></label></li></ul><p class="fx-status" role="status"></p></div>`;
const speicher = () => { const daten = {}; return { daten, lies: async (id) => daten[id], schreibe: async (id, w) => { daten[id] = w; } }; };
const haken = (el, i, an) => { const c = el.querySelectorAll('input')[i]; c.checked = an; c.dispatchEvent(new el.ownerDocument.defaultView.Event('change', { bubbles: true })); };

test('Checkliste: leer bis alle abgehakt; Status-Text', async () => {
  const w = dom(HTML); const FX = lade(w, 'felder', 'checkliste');
  await FX.felder.start(speicher());
  const el = w.document.querySelector('.fx-feld'), art = FX.felder.arten.checkliste;
  assert.strictEqual(art.leer(art.wert(el)), true);
  assert.strictEqual(el.querySelector('.fx-status').textContent, '0 von 2 abgehakt.');
  haken(el, 0, true);
  assert.strictEqual(art.leer(art.wert(el)), true);
  assert.strictEqual(el.querySelector('.fx-status').textContent, '1 von 2 abgehakt.');
  haken(el, 1, true);
  assert.strictEqual(art.leer(art.wert(el)), false);
  assert.strictEqual(el.querySelector('.fx-status').textContent, 'Alles da.');
  assert.deepStrictEqual(plain(art.wert(el)), { haken: [true, true] });
});

test('Checkliste: laden stellt Haken wieder her', async () => {
  const w = dom(HTML); const FX = lade(w, 'felder', 'checkliste');
  const s = speicher(); s.daten['a/k/material'] = { haken: [false, true] };
  await FX.felder.start(s);
  const el = w.document.querySelector('.fx-feld'), c = el.querySelectorAll('input');
  assert.deepStrictEqual([c[0].checked, c[1].checked], [false, true]);
  assert.strictEqual(el.querySelector('.fx-status').textContent, '1 von 2 abgehakt.');
});

test('Checkliste: Protokoll listet Punkte mit ✓/–', async () => {
  const w = dom(HTML); const FX = lade(w, 'felder', 'checkliste');
  await FX.felder.start(speicher());
  const el = w.document.querySelector('.fx-feld');
  haken(el, 1, true);
  const teile = plain(FX.felder.arten.checkliste.protokoll(el, FX.felder.arten.checkliste.wert(el)));
  assert.strictEqual(teile.length, 1);
  assert.strictEqual(teile[0].typ, 'tabelle');
  assert.deepStrictEqual(teile[0].zeilen, [['Laser', '–'], ['Strahlteiler', '✓']]);
});

test('Checkliste: begonnen, sobald ein Haken gesetzt ist', async () => {
  const w = dom(HTML); const FX = lade(w, 'felder', 'checkliste');
  const art = FX.felder.arten.checkliste;
  assert.strictEqual(art.begonnen({ haken: [false, false] }), false);
  assert.strictEqual(art.begonnen({ haken: [true, false] }), true);
  assert.strictEqual(art.begonnen(undefined), false);
});
