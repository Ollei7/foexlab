const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb, plain, warte } = require('./helfer');

const KONFIG = { spalten: [{ kuerzel: 'dp', name: 'Druckdifferenz', einheit: 'mbar', formel: null }, { kuerzel: 'dN', name: 'Streifen', einheit: '', formel: null }],
  diagramm: { x: 'dp', y: 'dN', ausgleich: 'ursprung' }, konstanten: {} };
const HTML = `<div class="fx-feld" data-fx-id="a/k/messung" data-fx-art="tabelle" data-fx-titel="Messung" data-fx-konfig='${JSON.stringify(KONFIG)}'>
  <div class="fx-tabelle"><table><thead></thead><tbody></tbody></table>
  <button type="button" class="fx-zeile-plus">Zeile hinzufügen</button><button type="button" class="fx-zeile-minus">Letzte Zeile löschen</button>
  <div class="fx-diagramm"></div><p class="fx-ausgleich"></p></div></div>`;

async function aufbau() {
  const w = mitDb(dom(HTML));
  const FX = lade(w, 'store', 'felder', 'formel', 'ausgleich', 'messtabelle');
  const s = await FX.store.oeffne('k');
  await FX.felder.start(s);
  return { w, FX, s, el: w.document.querySelector('.fx-feld') };
}
function eintragen(w, el, zeile, spalte, text) {
  const inp = el.querySelectorAll('tbody tr')[zeile].querySelectorAll('input')[spalte];
  inp.value = text; inp.dispatchEvent(new w.Event('input', { bubbles: true }));
}

test('startet mit leeren Zeilen, Zeile hinzufügen und Werte speichern', async () => {
  const { w, s, el } = await aufbau();
  const n0 = el.querySelectorAll('tbody tr').length;
  assert.ok(n0 >= 1);
  el.querySelector('.fx-zeile-plus').click();
  assert.strictEqual(el.querySelectorAll('tbody tr').length, n0 + 1);
  eintragen(w, el, 0, 0, '92,3'); eintragen(w, el, 0, 1, '5');
  await warte(500);
  assert.deepStrictEqual(plain(await s.lies('a/k/messung')).zeilen[0], ['92,3', '5']);
});

test('Hinweis bei nur einem Messpunkt', async () => {
  const { w, el } = await aufbau();
  eintragen(w, el, 0, 0, '92,3'); eintragen(w, el, 0, 1, '5');
  assert.match(el.querySelector('.fx-ausgleich').textContent, /mindestens 2 Messpunkte/);
});

test('Steigung bei vier Punkten im deutschen Zahlenformat', async () => {
  const { w, FX, el } = await aufbau();
  FX.felder.arten.tabelle.laden(el, { zeilen: [['92,3', '5'], ['184,6', '10'], ['276,9', '15'], ['369,2', '20']] });
  assert.match(el.querySelector('.fx-ausgleich').textContent, /m = 0,05417/);
  assert.match(el.querySelector('.fx-diagramm').innerHTML, /<svg/);
});

test('berechnete Spalte mit Konstanten', () => {
  const w = dom(); const FX = lade(w, 'formel', 'ausgleich', 'messtabelle');
  const k = { spalten: [{ kuerzel: 'N', name: 'N', einheit: '', formel: null }, { kuerzel: 'n', name: 'n', einheit: '', formel: '1 + N*lambda/(2*L)' }], konstanten: { lambda: 532e-9, L: 0.05 } };
  const r = FX.messtabelle.berechne(k, ['10']);
  assert.ok(Math.abs(r.n - (1 + 10 * 532e-9 / 0.1)) < 1e-15);
});

test('CSV mit Semikolon und Dezimalkomma', () => {
  const w = dom(); const FX = lade(w, 'formel', 'ausgleich', 'messtabelle');
  assert.strictEqual(FX.messtabelle.csv(KONFIG, { zeilen: [['92.3', '5'], ['', '']] }), 'Druckdifferenz [mbar];Streifen\n92,3;5\n');
});

test('verschwindender Fehler wird nicht angezeigt', () => {
  const w = dom(); const FX = lade(w, 'formel', 'ausgleich', 'messtabelle');
  const t = FX.messtabelle.ausgleichText(KONFIG, { m: 0.054171, b: 0, sm: 5.1e-18, sb: 0 }, 4);
  assert.strictEqual(t, 'Ausgleichsgerade: m = 0,05417');
});
