const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb, plain, warte } = require('./helfer');

const HTML = `<div class="fx-fortschritt-balken"><i></i></div>
<div class="fx-oben"><span class="fx-ort"></span><button type="button" class="fx-labor" aria-pressed="false">Labormodus</button></div>
<div id="fx-warnung" hidden></div>
<main id="main">
<section id="fx-start" class="fx-ansicht"><input id="fx-gruppe">
  <a href="#k/a1/k1">K1</a><span class="fx-fortschritt" data-karte="a1/k1"></span>
  <button type="button" id="fx-neue-gruppe">Neue Gruppe beginnen</button></section>
<section class="fx-karte fx-ansicht" data-karte="a1/k1" data-abschnitt="Abschnitt 1" hidden>
  <div class="fx-feld" data-fx-id="a1/k1/f" data-fx-art="text"><textarea class="fx-text"></textarea></div>
  <div class="fx-feld" data-fx-id="a1/k1/g" data-fx-art="text"><textarea class="fx-text"></textarea></div></section>
<section class="fx-karte fx-ansicht" data-karte="a1/k2" data-abschnitt="Abschnitt 1" hidden></section>
<section class="fx-karte fx-ansicht" data-karte="a2/k1" data-abschnitt="Abschnitt 2" hidden></section>
<section id="fx-ergebnis" class="fx-ansicht" hidden></section>
</main>
<nav class="fx-unten"><button type="button" class="fx-zurueck-karte">Zurück</button><button type="button" class="fx-zur-uebersicht">Übersicht</button><button type="button" class="fx-weiter-karte">Weiter</button></nav>`;

async function aufbau(opt) {
  opt = opt || {};
  const w = mitDb(dom(HTML));
  if (opt.db) w.indexedDB = opt.db;
  if (opt.hash) w.location.hash = opt.hash;
  if (opt.confirm !== undefined) w.confirm = () => opt.confirm;
  const FX = lade(w, 'store', 'felder', 'oberflaeche');
  FX.oberflaeche.neuLaden = () => { w._neugeladen = true; };
  const s = await FX.store.oeffne('k');
  if (opt.vorher) for (const [k, v] of Object.entries(opt.vorher)) await s.schreibe(k, v);
  await FX.felder.start(s);
  await FX.oberflaeche.starte(s);
  return { w, FX, s, d: w.document };
}
const sichtbar = (d) => Array.from(d.querySelectorAll('.fx-ansicht')).filter((x) => !x.hidden).map((x) => x.dataset.karte || x.id);

test('startet in der Übersicht, Hash öffnet die richtige Karte', async () => {
  let r = await aufbau();
  assert.deepStrictEqual(sichtbar(r.d), ['fx-start']);
  r = await aufbau({ hash: '#k/a1/k2' });
  assert.deepStrictEqual(sichtbar(r.d), ['a1/k2']);
  assert.match(r.d.querySelector('.fx-ort').textContent, /Abschnitt 1 · Karte 2 von 2/);
});

test('Weiter auf der letzten Karte eines Abschnitts öffnet den nächsten Abschnitt', async () => {
  const { d, FX } = await aufbau({ hash: '#k/a1/k2' });
  d.querySelector('.fx-weiter-karte').click();
  assert.deepStrictEqual(sichtbar(d), ['a2/k1']);
  d.querySelector('.fx-zurueck-karte').click();
  assert.deepStrictEqual(sichtbar(d), ['a1/k2']);
  d.querySelector('.fx-zur-uebersicht').click();
  assert.deepStrictEqual(sichtbar(d), ['fx-start']);
  void FX;
});

test('Labormodus bleibt nach dem Neuladen erhalten', async () => {
  const r = await aufbau();
  r.d.querySelector('.fx-labor').click();
  assert.strictEqual(r.d.documentElement.dataset.labor, '1');
  await warte(30);
  const r2 = await aufbau({ db: r.w.indexedDB });
  assert.strictEqual(r2.d.documentElement.dataset.labor, '1');
  assert.strictEqual(r2.d.querySelector('.fx-labor').getAttribute('aria-pressed'), 'true');
});

test('Gruppenname wird gespeichert', async () => {
  const { w, d, s } = await aufbau();
  const g = d.getElementById('fx-gruppe'); g.value = 'Ada, Emmy'; g.dispatchEvent(new w.Event('input'));
  await warte(500);
  assert.deepStrictEqual(plain(await s.lies('_gruppe')), { namen: 'Ada, Emmy' });
});

test('Neue Gruppe: abgelehnte Rückfrage löscht nichts', async () => {
  const { w, d, s } = await aufbau({ confirm: false, vorher: { 'a1/k1/f': { text: 'bleibt' } } });
  d.getElementById('fx-neue-gruppe').click();
  await warte(30);
  assert.deepStrictEqual(plain(await s.lies('a1/k1/f')), { text: 'bleibt' });
  assert.ok(!w._neugeladen);
});

test('Neue Gruppe: bestätigt löscht alles und lädt neu', async () => {
  const { w, d, s } = await aufbau({ confirm: true, vorher: { 'a1/k1/f': { text: 'weg' } } });
  d.getElementById('fx-neue-gruppe').click();
  await warte(30);
  assert.strictEqual(await s.lies('a1/k1/f'), undefined);
  assert.ok(w._neugeladen);
});

test('Fortschritt zählt nur nicht leere Felder', async () => {
  const { d, FX } = await aufbau({ vorher: { 'a1/k1/f': { text: 'x' }, 'a1/k1/g': { text: '  ' } } });
  assert.deepStrictEqual(plain(FX.oberflaeche.fortschritt(d.querySelector('.fx-karte[data-karte="a1/k1"]'))), { voll: 1, gesamt: 2 });
  assert.strictEqual(d.querySelector('.fx-fortschritt[data-karte="a1/k1"]').textContent, '1/2');
});

test('Warnung bei flüchtigem Speicher', async () => {
  const w = mitDb(dom(HTML));
  Object.defineProperty(w.navigator, 'storage', { value: { persisted: async () => false, estimate: async () => ({ quota: 50e6 }), persist: async () => false } });
  const FX = lade(w, 'store', 'felder', 'oberflaeche');
  const s = await FX.store.oeffne('k'); await FX.oberflaeche.starte(s);
  const warn = w.document.getElementById('fx-warnung');
  assert.strictEqual(warn.hidden, false);
  assert.match(warn.textContent, /privater Tab/);
});

test('Gesamtfortschritt: zwei von vier Feldern gefüllt → Balken 50 %', async () => {
  const w = mitDb(dom(HTML.replace('<section class="fx-karte fx-ansicht" data-karte="a1/k2" data-abschnitt="Abschnitt 1" hidden></section>',
    '<section class="fx-karte fx-ansicht" data-karte="a1/k2" data-abschnitt="Abschnitt 1" hidden>' +
    '<div class="fx-feld" data-fx-id="a1/k2/f" data-fx-art="text"><textarea class="fx-text"></textarea></div>' +
    '<div class="fx-feld" data-fx-id="a1/k2/g" data-fx-art="text"><textarea class="fx-text"></textarea></div></section>')));
  const FX = lade(w, 'store', 'felder', 'oberflaeche');
  const s = await FX.store.oeffne('k');
  await FX.felder.start(s); await FX.oberflaeche.starte(s);
  const d = w.document, balken = d.querySelector('.fx-fortschritt-balken i');
  assert.deepStrictEqual(plain(FX.oberflaeche.gesamtfortschritt()), { voll: 0, gesamt: 4 });
  assert.strictEqual(balken.style.width, '0%');
  const t = d.querySelectorAll('textarea');
  t[0].value = 'a'; t[0].dispatchEvent(new w.Event('input', { bubbles: true }));
  t[2].value = 'b'; t[2].dispatchEvent(new w.Event('input', { bubbles: true }));
  await FX.felder.speichereAlle();
  assert.deepStrictEqual(plain(FX.oberflaeche.gesamtfortschritt()), { voll: 2, gesamt: 4 });
  assert.strictEqual(balken.style.width, '50%');
});
