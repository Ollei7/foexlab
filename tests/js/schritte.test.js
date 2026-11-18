const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb, plain, warte } = require('./helfer');

const HTML = `<div class="fx-feld" data-fx-id="j/a/schritte" data-fx-art="schritte" data-fx-titel="Aufbau">
<section class="fx-schritt" data-nr="0"><h3>Eins</h3></section><section class="fx-schritt" data-nr="1"><h3>Zwei</h3></section><section class="fx-schritt" data-nr="2"><h3>Drei</h3></section>
<div class="fx-schritt-nav"><button type="button" class="fx-zurueck">Zurück</button><span class="fx-schritt-zahl"></span>
<label><input type="checkbox" class="fx-erledigt"> Erledigt</label><button type="button" class="fx-weiter">Weiter</button></div></div>`;

async function aufbau(win) {
  const w = win || mitDb(dom(HTML)); const FX = lade(w, 'store', 'felder', 'schritte');
  const s = await FX.store.oeffne('k'); await FX.felder.start(s);
  return { w, s, el: w.document.querySelector('.fx-feld') };
}
const sichtbar = (el) => Array.from(el.querySelectorAll('.fx-schritt')).filter((x) => !x.hidden).map((x) => x.dataset.nr);

test('zeigt nur Schritt 1', async () => {
  const { el } = await aufbau();
  assert.deepStrictEqual(sichtbar(el), ['0']);
  assert.strictEqual(el.querySelector('.fx-schritt-zahl').textContent, 'Schritt 1 von 3');
  assert.ok(el.querySelector('.fx-zurueck').disabled);
});

test('Weiter, Häkchen und Wiederherstellen', async () => {
  const { w, s, el } = await aufbau();
  el.querySelector('.fx-weiter').click();
  assert.deepStrictEqual(sichtbar(el), ['1']);
  assert.strictEqual(el.querySelector('.fx-schritt-zahl').textContent, 'Schritt 2 von 3');
  const cb = el.querySelector('.fx-erledigt'); cb.checked = true; cb.dispatchEvent(new w.Event('change', { bubbles: true }));
  await warte(500);
  assert.deepStrictEqual(plain(await s.lies('j/a/schritte')), { erledigt: [1], aktuell: 1 });
  // neu laden
  const w2 = mitDb(dom(HTML)); w2.indexedDB = w.indexedDB;
  const r = await aufbau(w2);
  assert.deepStrictEqual(sichtbar(r.el), ['1']);
  assert.strictEqual(r.el.querySelector('.fx-erledigt').checked, true);
});
