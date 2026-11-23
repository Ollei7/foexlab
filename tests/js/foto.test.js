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

const HTML_SPERRT = `<div class="fx-karte"><div class="fx-feld" data-fx-id="a/k/foto" data-fx-art="foto" data-fx-titel="Foto" data-fx-sperrt>
<input type="file" class="fx-foto-eingabe"><ul class="fx-fotos"></ul><p class="fx-meldung" hidden></p></div>
<div class="fx-feld" data-fx-id="a/k/foto2" data-fx-art="foto" data-fx-titel="Danach"><input type="file" class="fx-foto-eingabe"><ul class="fx-fotos"></ul><p class="fx-meldung" hidden></p></div></div>`;

test('sperrendes Foto: nach dem Hinzufügen öffnet sich das Folgende sofort', async () => {
  const w = dom(HTML_SPERRT); const FX = lade(w, 'felder', 'foto');
  await FX.felder.start(speicher(false));
  const [el, danach] = w.document.querySelectorAll('.fx-feld');
  assert.strictEqual(danach.getAttribute('data-fx-gesperrt'), '1');
  await FX.foto.hinzufuegen(el, new w.Blob(['a'], { type: 'image/jpeg' }));
  assert.strictEqual(danach.hasAttribute('data-fx-gesperrt'), false);
});

const HTML_OHNE = HTML_SPERRT.replace('<p class="fx-meldung" hidden></p></div>', '<p class="fx-meldung" hidden></p><p class="fx-foto-ohne-hinweis" hidden></p><button type="button" class="fx-foto-ohne" hidden>Ohne Foto weiter</button></div>');

test('Ohne Foto weiter: erst nach einem Versuch sichtbar, zählt als erledigt und bleibt nach dem Neuladen', async () => {
  const w = dom(HTML_OHNE); const FX = lade(w, 'felder', 'foto');
  const s = speicher(false); await FX.felder.start(s);
  const [el, danach] = w.document.querySelectorAll('.fx-feld');
  const knopf = el.querySelector('.fx-foto-ohne');
  assert.strictEqual(knopf.hidden, true);
  el.querySelector('.fx-foto-eingabe').dispatchEvent(new w.Event('change'));   // Auswahl abgebrochen: keine Datei
  assert.strictEqual(knopf.hidden, false);
  knopf.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.strictEqual(s.daten['a/k/foto'].ohne, true);
  assert.strictEqual(FX.felder.istLeer('foto', s.daten['a/k/foto']), false);
  assert.strictEqual(danach.hasAttribute('data-fx-gesperrt'), false);
  assert.strictEqual(knopf.hidden, true);
  assert.strictEqual(el.querySelector('.fx-foto-ohne-hinweis').hidden, false);
  // neu laden
  const w2 = dom(HTML_OHNE); const FX2 = lade(w2, 'felder', 'foto'); await FX2.felder.start(s);
  assert.strictEqual(w2.document.querySelectorAll('.fx-feld')[1].hasAttribute('data-fx-gesperrt'), false);
  // später doch ein Foto: Übersprungen-Vermerk fällt weg
  const el2 = w2.document.querySelector('.fx-feld');
  await FX2.foto.hinzufuegen(el2, new w2.Blob(['a'], { type: 'image/jpeg' }));
  assert.strictEqual(s.daten['a/k/foto'].ohne, undefined);
  assert.strictEqual(s.daten['a/k/foto'].bilder.length, 1);
});

test('Bild nicht lesbar: Fehlermeldung und Notausgang', async () => {
  const w = dom(HTML_OHNE); w.createImageBitmap = () => Promise.reject(new Error('HEIC'));
  w.Image = class { set src(v) { setTimeout(() => this.onerror && this.onerror(new Error('kaputt')), 0); } };
  w.URL.createObjectURL = () => 'blob:x'; w.URL.revokeObjectURL = () => {};
  const FX = lade(w, 'felder', 'foto'); await FX.felder.start(speicher(false));
  const el = w.document.querySelector('.fx-feld'), inp = el.querySelector('.fx-foto-eingabe');
  Object.defineProperty(inp, 'files', { value: [new w.Blob(['x'], { type: 'image/heic' })], configurable: true });
  inp.dispatchEvent(new w.Event('change'));
  await new Promise((r) => setTimeout(r, 30));
  assert.match(el.querySelector('.fx-meldung').textContent, /nicht gelesen/);
  assert.strictEqual(el.querySelector('.fx-foto-ohne').hidden, false);
});

test('voller Speicher: Sperre bleibt, Notausgang erscheint', async () => {
  const w = dom(HTML_OHNE); const FX = lade(w, 'felder', 'foto');
  await FX.felder.start(speicher(true));
  const [el, danach] = w.document.querySelectorAll('.fx-feld');
  await FX.foto.hinzufuegen(el, new w.Blob(['a'], { type: 'image/jpeg' }));
  assert.strictEqual(danach.getAttribute('data-fx-gesperrt'), '1');
  assert.strictEqual(el.querySelector('.fx-foto-ohne').hidden, false);
});
