const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb, plain, warte } = require('./helfer');

const TEXT = `<div class="fx-feld" data-fx-id="a/k/f" data-fx-art="text" data-fx-titel="F"><textarea class="fx-text"></textarea></div>`;

test('Textfeld wird geladen und nach dem Tippen gespeichert', async () => {
  const w = mitDb(dom(TEXT)); const FX = lade(w, 'store', 'felder');
  const s = await FX.store.oeffne('k');
  await s.schreibe('a/k/f', { text: 'alt' });
  await FX.felder.start(s);
  const ta = w.document.querySelector('textarea');
  assert.strictEqual(ta.value, 'alt');
  let gemeldet = null;
  w.document.addEventListener('fx:geaendert', (e) => { gemeldet = e.detail.id; });
  ta.value = 'neu'; ta.dispatchEvent(new w.Event('input', { bubbles: true }));
  await warte(500);
  assert.deepStrictEqual(plain(await s.lies('a/k/f')), { text: 'neu' });
  assert.strictEqual(gemeldet, 'a/k/f');
});

test('unbekannte gespeicherte IDs und kaputte Werte stören nicht und bleiben erhalten', async () => {
  const w = mitDb(dom(TEXT)); const FX = lade(w, 'store', 'felder');
  const s = await FX.store.oeffne('k');
  await s.schreibe('alt/geloescht/feld', { text: 'bleibt' });
  await s.schreibe('a/k/f', 42);   // falsche Form
  await FX.felder.start(s);
  assert.deepStrictEqual(plain(await s.lies('alt/geloescht/feld')), { text: 'bleibt' });
});

test('leer() aus der Registrierung', () => {
  const w = dom(TEXT); const FX = lade(w, 'felder');
  assert.strictEqual(FX.felder.istLeer('text', { text: '  ' }), true);
  assert.strictEqual(FX.felder.istLeer('text', { text: 'x' }), false);
  assert.strictEqual(FX.felder.istLeer('text', undefined), true);
});

test('Quizfrage speichert Antwort und Prüfergebnis', async () => {
  const QUIZ = `<div class="fx-feld" data-fx-id="a/k/q" data-fx-art="quiz"><div class="q" data-type="num"><input class="num" data-answers='[["2",0,1,""]]'><button class="check">Prüfen</button><span class="res"></span></div></div>`;
  const w = mitDb(dom(QUIZ)); const FX = lade(w, 'store', 'felder', 'quiz');
  const s = await FX.store.oeffne('k');
  await FX.felder.start(s);
  const el = w.document.querySelector('.fx-feld');
  el.querySelector('input').value = '2';
  FX.felder.pruefen(el);
  await warte(50);
  assert.deepStrictEqual(plain(await s.lies('a/k/q')), { antwort: '2', anteil: 1 });
});
