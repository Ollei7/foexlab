const test = require('node:test');
const assert = require('node:assert');
const { dom, lade } = require('./helfer');

const HTML = `<div class="fx-feld" data-fx-id="a/k/foto" data-fx-art="foto" data-fx-titel="Foto">
<input type="file" class="fx-foto-eingabe"><ul class="fx-fotos"></ul><p class="fx-meldung" hidden></p></div>`;

function speicher(fehler) {
  const daten = {};
  return { daten, lies: async (id) => daten[id], schreibe: async (id, w) => { if (fehler) { const e = new Error('voll'); e.name = 'QuotaExceededError'; throw e; } daten[id] = w; } };
}

test('zielmass verkleinert die lange Kante auf 1600', () => {
  const w = dom(); const FX = lade(w, 'foto');
  assert.deepStrictEqual(Array.from(FX.foto.zielmass(4000, 3000, 1600)), [1600, 1200]);
  assert.deepStrictEqual(Array.from(FX.foto.zielmass(3000, 4000, 1600)), [1200, 1600]);
  assert.deepStrictEqual(Array.from(FX.foto.zielmass(800, 600, 1600)), [800, 600]);
});

test('Foto hinzufügen und löschen', async () => {
  const w = dom(HTML); const FX = lade(w, 'felder', 'foto');
  const s = speicher(false); await FX.felder.start(s);
  const el = w.document.querySelector('.fx-feld');
  await FX.foto.hinzufuegen(el, new w.Blob(['a'], { type: 'image/jpeg' }));
  await FX.foto.hinzufuegen(el, new w.Blob(['b'], { type: 'image/jpeg' }));
  assert.strictEqual(s.daten['a/k/foto'].bilder.length, 2);
  el.querySelector('.fx-fotos li button').click();
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(s.daten['a/k/foto'].bilder.length, 1);
  assert.strictEqual(el.querySelectorAll('.fx-fotos li').length, 1);
});

test('voller Speicher: Meldung statt Absturz, Foto wird nicht behalten', async () => {
  const w = dom(HTML); const FX = lade(w, 'felder', 'foto');
  await FX.felder.start(speicher(true));
  const el = w.document.querySelector('.fx-feld');
  await FX.foto.hinzufuegen(el, new w.Blob(['a'], { type: 'image/jpeg' }));
  const m = el.querySelector('.fx-meldung');
  assert.strictEqual(m.hidden, false);
  assert.match(m.textContent, /Speicher des Geräts ist voll/);
  assert.strictEqual(el.querySelectorAll('.fx-fotos li').length, 0);
});
