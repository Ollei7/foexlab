const test = require('node:test');
const assert = require('node:assert');
const { dom, lade } = require('./helfer');

const HTML = `<div class="fx-feld" data-fx-id="a/k/s" data-fx-art="skizze"><div class="fx-flaeche"><canvas></canvas></div>
<button type="button" class="fx-rueckgaengig">Rückgängig</button><button type="button" class="fx-alles-loeschen">Alles löschen</button></div>`;
const speicher = () => { const daten = {}; return { daten, lies: async (id) => daten[id], schreibe: async (id, w) => { daten[id] = w; } }; };

test('normiere auf 0..1', () => {
  const w = dom(); const FX = lade(w, 'skizze');
  assert.deepStrictEqual(Array.from(FX.skizze.normiere(200, 150, 400, 300)), [0.5, 0.5]);
});

test('zwei Striche, Rückgängig lässt einen übrig', async () => {
  const w = dom(HTML); const FX = lade(w, 'felder', 'skizze');
  const s = speicher(); await FX.felder.start(s);
  const el = w.document.querySelector('.fx-feld');
  FX.skizze.beginne(el, 0.1, 0.1); FX.skizze.ziehe(el, 0.2, 0.2); FX.skizze.beende(el);
  FX.skizze.beginne(el, 0.5, 0.5); FX.skizze.ziehe(el, 0.6, 0.6); FX.skizze.beende(el);
  assert.strictEqual(FX.felder.arten.skizze.wert(el).striche.length, 2);
  el.querySelector('.fx-rueckgaengig').click();
  const wert = FX.felder.arten.skizze.wert(el);
  assert.strictEqual(wert.striche.length, 1);
  assert.deepStrictEqual(Array.from(wert.striche[0].punkte[0]), [0.1, 0.1]);
});

test('zeichne ruft lineTo für jeden Punkt auf', () => {
  const w = dom(); const FX = lade(w, 'skizze');
  const aufrufe = { lineTo: 0, stroke: 0 };
  const ctx = { beginPath() {}, moveTo() {}, lineTo() { aufrufe.lineTo++; }, stroke() { aufrufe.stroke++; }, set lineWidth(v) {}, set strokeStyle(v) {}, set lineCap(v) {}, set lineJoin(v) {}, set globalCompositeOperation(v) {} };
  FX.skizze.zeichne(ctx, [{ farbe: '#33416E', breite: 0.006, punkte: [[0, 0], [0.5, 0.5], [1, 1]] }, { farbe: 'radierer', breite: 0.03, punkte: [[0.2, 0.2]] }], 400, 300);
  assert.strictEqual(aufrufe.lineTo, 4);
  assert.strictEqual(aufrufe.stroke, 2);
});
