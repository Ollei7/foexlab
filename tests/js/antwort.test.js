const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb, plain } = require('./helfer');

const FELD = (art, start) => `<div class="fx-feld" data-fx-id="a/k/f" data-fx-art="${art}" data-fx-titel="Frage">
<div class="fx-antwort" data-start="${start || 'tippen'}"><div class="fx-modus" role="group"><button type="button" data-modus="tippen">Tippen</button><button type="button" data-modus="stift">Stift</button></div>
<textarea class="fx-text"></textarea>
<div class="fx-stift" hidden><div class="fx-stift-leiste"><button type="button" data-werkzeug="stift">Stift</button><button type="button" data-werkzeug="radierer">Radierer</button><button type="button" class="fx-rueckgaengig">Rückgängig</button><button type="button" class="fx-wiederholen">Wiederholen</button><button type="button" class="fx-mehr-platz">+</button><select class="fx-hintergrund"><option value="linien">Linien</option></select><input type="checkbox" class="fx-nur-pencil" checked></div><canvas></canvas></div></div></div>`;

function aufbau(art, start) {
  const w = mitDb(dom(FELD(art, start)));
  const FX = lade(w, 'store', 'felder', 'stiftfeld', 'antwort');
  const el = w.document.querySelector('.fx-feld');
  return { w, FX, el, h: FX.felder.arten[art] };
}

test('Altwert {text} lädt (Review Focus 1)', () => {
  const { el, h } = aufbau('text');
  h.init(el); h.laden(el, { text: 'alt' });
  assert.strictEqual(el.querySelector('textarea').value, 'alt');
  assert.deepStrictEqual(plain(h.wert(el)), { text: 'alt', striche: [], modus: 'tippen', hoehe: h.wert(el).hoehe });
});

test('Altwert lädt über den Speicher in Tippen-Stift-Feld', async () => {
  const w = mitDb(dom(FELD('vermutung')));
  const FX = lade(w, 'store', 'felder', 'stiftfeld', 'antwort');
  const s = await FX.store.oeffne('k'); await s.schreibe('a/k/f', { text: 'Vermutung von früher' });
  await FX.felder.start(s);
  assert.strictEqual(w.document.querySelector('textarea').value, 'Vermutung von früher');
});

test('Modus wechseln speichert beides', () => {
  const { el, h } = aufbau('text');
  h.init(el);
  const ta = el.querySelector('textarea'); ta.value = 'Text';
  el.querySelector('[data-modus="stift"]').click();
  assert.strictEqual(el.querySelector('.fx-stift').hidden, false);
  assert.strictEqual(ta.hidden, true);
  const st = el._fxStift; st.beginne(0.1, 20, 0); st.ziehe(0.2, 30); st.beende();
  const w = h.wert(el);
  assert.strictEqual(w.text, 'Text'); assert.strictEqual(w.striche.length, 1); assert.strictEqual(w.modus, 'stift');
  el.querySelector('[data-modus="tippen"]').click();
  assert.strictEqual(h.wert(el).modus, 'tippen'); assert.strictEqual(h.wert(el).striche.length, 1);
});

test('data-start stift öffnet im Stiftmodus', () => {
  const { el, h } = aufbau('text', 'stift');
  h.init(el);
  assert.strictEqual(el.querySelector('.fx-stift').hidden, false);
  assert.strictEqual(h.wert(el).modus, 'stift');
});

test('laden stellt Striche, Höhe und Modus wieder her', () => {
  const { el, h } = aufbau('text');
  h.init(el);
  h.laden(el, { text: '', striche: [{ farbe: '#33416E', breite: 2, punkte: [[0.1, 10], [0.3, 30]] }], modus: 'stift', hoehe: 480 });
  const w = h.wert(el);
  assert.strictEqual(w.striche.length, 1); assert.strictEqual(w.hoehe, 480); assert.strictEqual(w.modus, 'stift');
});

test('leer erst ohne Text und Striche', () => {
  const { h } = aufbau('text');
  assert.strictEqual(h.leer({ text: '  ', striche: [] }), true);
  assert.strictEqual(h.leer({ text: 'a' }), false);
  assert.strictEqual(h.leer({ text: '', striche: [{ punkte: [[0, 0]] }] }), false);
});

test('Protokoll-Teile', () => {
  const { h, el } = aufbau('text');
  const strich = { farbe: '#33416E', breite: 2, punkte: [[0.1, 10], [0.3, 30]] };
  const teile = plain(h.protokoll(el, { text: 'Hallo', striche: [strich], modus: 'stift', hoehe: 400 }));
  assert.deepStrictEqual(teile.map((t) => t.typ), ['text', 'striche']);
  assert.strictEqual(teile[0].text, 'Hallo'); assert.strictEqual(teile[1].verhaeltnis, 1000 / 400);
  assert.deepStrictEqual(plain(h.protokoll(el, { text: 'Nur Text' })).map((t) => t.typ), ['text']);
});

test('Tippen funktioniert auch bei Feldern ohne Stift-Markup (altes DOM)', () => {
  const w = mitDb(dom('<div class="fx-feld" data-fx-id="a/k/f" data-fx-art="text"><textarea class="fx-text"></textarea></div>'));
  const FX = lade(w, 'store', 'felder', 'stiftfeld', 'antwort');
  const el = w.document.querySelector('.fx-feld'), h = FX.felder.arten.text;
  h.laden(el, { text: 'x' });
  assert.deepStrictEqual(plain(h.wert(el)).text, 'x');
});
