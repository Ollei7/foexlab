const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb, plain } = require('./helfer');

const PLATZ = '<div class="q fx-baustein fx-platzhalter" data-fx-platzhalter="1"><div class="qhead"><span class="qname">Sim</span></div><p class="fx-platzhalter-hinweis">Diese Simulation folgt noch.</p></div>';
const HTML = `<div class="fx-fortschritt-balken"><i></i></div><div class="fx-oben"><span class="fx-ort"></span></div><div id="fx-warnung" hidden></div>
<main id="main"><section id="fx-start" class="fx-ansicht"><input id="fx-gruppe"><span class="fx-fortschritt" data-karte="a/nur"></span><span class="fx-fortschritt" data-karte="a/mit"></span></section>
<section class="fx-karte fx-ansicht" data-karte="a/nur" data-abschnitt="A" hidden>${PLATZ}</section>
<section class="fx-karte fx-ansicht" data-karte="a/mit" data-abschnitt="A" hidden>${PLATZ}
<div class="fx-feld" data-fx-id="a/mit/f" data-fx-art="text"><textarea class="fx-text"></textarea></div></section>
<section id="fx-ergebnis" class="fx-ansicht" hidden></section></main>`;

async function aufbau() {
  const w = mitDb(dom(HTML));
  const FX = lade(w, 'store', 'felder', 'oberflaeche', 'protokoll');
  const s = await FX.store.oeffne('k');
  await FX.felder.start(s);
  await FX.oberflaeche.starte(s);
  return { w, FX, s, d: w.document };
}

test('Platzhalter erscheint nicht im Protokoll und nicht in Noch offen', async () => {
  const { FX, d } = await aufbau();
  assert.strictEqual(d.querySelectorAll('.fx-feld').length, 1);   // nur das echte Feld
  const prot = FX.protokoll.sammle(d, {}, { id: 'k', titel: 'K' }, new Date(2026, 0, 2));
  assert.deepStrictEqual(plain(prot.abschnitte[0].eintraege.map((e) => e.id)), ['a/mit/f']);   // Platzhalter ist kein Eintrag
  const html = FX.protokoll.html(prot, { leereZeigen: true });
  assert.ok(!/Sim|folgt noch/.test(html), html);
});

test('Karte nur mit Platzhalter gilt als erledigt (Fortschritt 0/0)', async () => {
  const { FX, d } = await aufbau();
  const f = FX.oberflaeche.fortschritt(d.querySelector('[data-karte="a/nur"].fx-karte'));
  assert.deepStrictEqual([f.voll, f.gesamt], [0, 0]);
  const g = FX.oberflaeche.fortschritt(d.querySelector('[data-karte="a/mit"].fx-karte'));
  assert.deepStrictEqual([g.voll, g.gesamt], [0, 1]);
});
