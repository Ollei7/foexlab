// Tests zu den Befunden der Gesamtprüfung
const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb, plain, warte } = require('./helfer');

test('F1: alte Wertform (Text statt Liste) bricht das Protokoll nicht', () => {
  const w = dom(`<section class="fx-karte" data-abschnitt="A"><div class="fx-feld" data-fx-id="a/k/q" data-fx-art="quiz" data-fx-titel="Q">
    <div class="q" data-type="gaps"><select class="gap"><option>x</option></select></div></div></section>`);
  const FX = lade(w, 'felder', 'quiz', 'protokoll');
  const p = FX.protokoll.sammle(w.document, { 'a/k/q': { antwort: '3', anteil: null } }, { id: 'k' }, new Date());
  assert.strictEqual(p.abschnitte[0].eintraege.length, 1);
  assert.strictEqual(p.abschnitte[0].eintraege[0].titel, 'Q');
});

test('F2: Speicherfehler eines Textfelds zeigt die Warnung', async () => {
  const w = dom(`<div id="fx-warnung" hidden></div><section id="fx-start" class="fx-ansicht"></section>
    <div class="fx-feld" data-fx-id="a/k/t" data-fx-art="text"><textarea></textarea></div>`);
  const FX = lade(w, 'store', 'felder', 'oberflaeche');
  const s = { lies: async () => undefined, schreibe: async () => { const e = new Error('voll'); e.name = 'QuotaExceededError'; throw e; }, leeren: async () => {}, alle: async () => ({}) };
  FX.store.status = async () => 'ok';
  await FX.felder.start(s); await FX.oberflaeche.starte(s);
  await FX.felder.speichere(w.document.querySelector('.fx-feld'));
  const warn = w.document.getElementById('fx-warnung');
  assert.strictEqual(warn.hidden, false);
  assert.match(warn.textContent, /Speicher/);
});

test('F5: speichereAlle schreibt ausstehende Eingaben sofort', async () => {
  const w = mitDb(dom(`<div class="fx-feld" data-fx-id="a/k/t" data-fx-art="text"><textarea></textarea></div>`));
  const FX = lade(w, 'store', 'felder');
  const s = await FX.store.oeffne('k'); await FX.felder.start(s);
  const ta = w.document.querySelector('textarea'); ta.value = 'eben getippt'; ta.dispatchEvent(new w.Event('input', { bubbles: true }));
  await FX.felder.speichereAlle();
  assert.deepStrictEqual(plain(await s.lies('a/k/t')), { text: 'eben getippt' });
});

test('F5: abbrechen verhindert, dass alte Eingaben nach dem Löschen zurückgeschrieben werden', async () => {
  const w = mitDb(dom(`<div class="fx-feld" data-fx-id="a/k/t" data-fx-art="text"><textarea></textarea></div>`));
  const FX = lade(w, 'store', 'felder');
  const s = await FX.store.oeffne('k'); await FX.felder.start(s);
  const ta = w.document.querySelector('textarea'); ta.value = 'alte Gruppe'; ta.dispatchEvent(new w.Event('input', { bubbles: true }));
  FX.felder.abbrechen(); await s.leeren();
  await warte(500);
  assert.strictEqual(await s.lies('a/k/t'), undefined);
});

test('F6: Neue Gruppe löscht die Eingaben aller Kurse', async () => {
  const w = mitDb(dom(`<section id="fx-start" class="fx-ansicht"></section>`));
  w.confirm = () => true;
  const FX = lade(w, 'store', 'felder', 'oberflaeche');
  FX.oberflaeche.neuLaden = () => {};
  const m = await FX.store.oeffne('michelson'); const z = await FX.store.oeffne('mzifo');
  await z.schreibe('x', { text: 'Name in anderem Kurs' });
  await FX.oberflaeche.starte(m);
  await FX.oberflaeche.neueGruppe();
  assert.deepStrictEqual(plain(await z.alle()), {});
});

test('F4: Teilen erst nach dem Erstellen, direkt im Klick', async () => {
  const w = dom('<div class="fx-sichern"></div>');
  const FX = lade(w, 'teilen');
  w.FX.protokoll = { letztes: () => ({}) };
  w.FX.pdf = { erzeuge: async () => new Uint8Array([37, 80, 68, 70, 45]) };
  w.FX.felder = { speichereAlle: async () => {} };
  let geteiltSynchron = null;
  w.navigator.canShare = () => true;
  w.navigator.share = () => { geteiltSynchron = true; return Promise.resolve(); };
  const box = w.document.querySelector('.fx-sichern');
  FX.teilen.knoepfe(box, { id: 'm', abholdienst: false });
  Array.from(box.querySelectorAll('button')).find((b) => b.textContent === 'Protokoll als PDF sichern').click();
  await warte(20);
  const jetzt = Array.from(box.querySelectorAll('button')).find((b) => b.textContent === 'PDF teilen oder sichern');
  assert.ok(jetzt, 'zweiter Knopf erscheint');
  assert.strictEqual(geteiltSynchron, null);
  jetzt.click();
  assert.strictEqual(geteiltSynchron, true);
});
