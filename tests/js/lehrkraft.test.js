const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb } = require('./helfer');

async function aufbau(html) {
  const w = mitDb(dom(html || ''));
  const FX = lade(w, 'store', 'felder', 'stiftfeld', 'antwort', 'freischaltung', 'oberflaeche');
  const s = await FX.store.oeffne('k');
  await FX.felder.start(s);
  await FX.freischaltung.start(s, null);
  return { w, FX, s };
}

test('Betreuungsmodus setzt fx-betreuung am body', async () => {
  const { w, FX, s } = await aufbau();
  await FX.freischaltung.allesFrei();
  await FX.oberflaeche.starte(s);
  assert.ok(w.document.body.classList.contains('fx-betreuung'));
});

test('ohne Betreuungsmodus keine Klasse', async () => {
  const { w, FX, s } = await aufbau();
  await FX.oberflaeche.starte(s);
  assert.ok(!w.document.body.classList.contains('fx-betreuung'));
});

test('Klasse folgt fx:freischaltung', async () => {
  const { w, FX, s } = await aufbau();
  await FX.oberflaeche.starte(s);
  await FX.freischaltung.allesFrei();
  assert.ok(w.document.body.classList.contains('fx-betreuung'));
  FX.freischaltung.zuruecksetzen();
  assert.ok(!w.document.body.classList.contains('fx-betreuung'));
});

test('Protokoll übernimmt keinen fx-lehrkraft-Text', async () => {
  const w = dom(`<div class="fx-karte" data-karte="a/z" data-abschnitt="A" data-abschnitt-id="a"><p>Sichtbar</p>
    <div class="fx-lehrkraft"><p>GEHEIMER Hinweis</p><ul><li>GEHEIMER Punkt</li></ul></div></div>
    <div class="fx-karte" data-karte="a/y" data-abschnitt="A" data-abschnitt-id="a"><p>Sichtbar</p><div class="fx-lehrkraft"><p>GEHEIMER Hinweis</p></div></div>`);
  const FX = lade(w, 'felder', 'quiz', 'formel', 'ausgleich', 'messtabelle', 'protokoll');
  for (const karte of ['a/z', 'a/y']) {
    const p = FX.protokoll.sammle(w.document, {}, { id: 'k', titel: 'K', auf_einen_blick: { zusammenfassung: karte } }, new Date());
    assert.ok(!JSON.stringify(p).includes('GEHEIMER'));
  }
});
