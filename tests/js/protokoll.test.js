const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, plain } = require('./helfer');

const KONFIG = JSON.stringify({ spalten: [{ kuerzel: 'dp', name: 'Druckdifferenz', einheit: 'mbar', formel: null }, { kuerzel: 'dN', name: 'Streifen', einheit: '', formel: null }], diagramm: { x: 'dp', y: 'dN', ausgleich: 'ursprung' }, konstanten: {} });
const HTML = `<main>
<section class="fx-karte" data-karte="a1/k1" data-abschnitt="1 Justage">
  <div class="fx-feld" data-fx-id="a1/k1/luecke" data-fx-art="quiz" data-fx-titel="Bauteile"><div class="q" data-type="gaps">
    <select class="gap" data-correct="Laser"><option value=""></option><option>LED</option><option>Laser</option></select>
    <select class="gap" data-correct="Spiegel"><option value=""></option><option>Spiegel</option><option>Linse</option></select>
    <div class="gfb" hidden><strong>Hinweis</strong><p>Laser und Spiegel.</p></div></div></div>
  <div class="fx-feld" data-fx-id="a1/k1/frei" data-fx-art="text" data-fx-titel="Begründe"><textarea class="fx-text"></textarea></div>
</section>
<section class="fx-karte" data-karte="a2/k1" data-abschnitt="2 Brechungsindex">
  <div class="fx-feld" data-fx-id="a2/k1/v" data-fx-art="vermutung" data-fx-titel="Eure Vermutung"><textarea class="fx-text"></textarea></div>
  <div class="fx-feld" data-fx-id="a2/k1/m" data-fx-art="tabelle" data-fx-titel="Messung" data-fx-konfig='${KONFIG}'></div>
</section>
<section class="fx-karte" data-karte="a3/k1" data-abschnitt="3 Ohne Felder"><p>Nur Text</p></section></main>`;

const WERTE = {
  _gruppe: { namen: 'Ada, Emmy' },
  'a1/k1/luecke': { antwort: ['Laser', 'Linse'], anteil: 0.5 },
  'a2/k1/v': { text: 'Wird heller' },
  'a2/k1/m': { zeilen: [['92,3', '5'], ['184,6', '10'], ['', '']] },
  'alt/geloescht': { text: 'egal' }
};

function aufbau() {
  const w = dom(HTML);
  const FX = lade(w, 'felder', 'quiz', 'formel', 'ausgleich', 'messtabelle', 'protokoll');
  return { w, FX };
}

test('Struktur des Protokolls', () => {
  const { w, FX } = aufbau();
  const p = FX.protokoll.sammle(w.document, WERTE, { id: 'michelson', titel: 'Michelson-Interferometer', musterloesungen: false }, new Date(2026, 9, 21));
  assert.strictEqual(p.datum, '21.10.2026');
  assert.strictEqual(p.gruppe, 'Ada, Emmy');
  assert.deepStrictEqual(plain(p.kurs), { id: 'michelson', titel: 'Michelson-Interferometer' });
  assert.deepStrictEqual(plain(p.abschnitte.map((a) => a.titel)), ['1 Justage', '2 Brechungsindex']);
  const [luecke, frei] = p.abschnitte[0].eintraege;
  assert.strictEqual(luecke.antwortText, 'Laser · Linse');
  assert.strictEqual(luecke.anteil, 0.5);
  assert.strictEqual(luecke.loesung, undefined);
  assert.strictEqual(frei.leer, true);
  const [v, m] = p.abschnitte[1].eintraege;
  assert.strictEqual(v.text, 'Wird heller'); assert.strictEqual(v.art, 'vermutung');
  assert.deepStrictEqual(plain(m.kopf), ['Druckdifferenz [mbar]', 'Streifen']);
  assert.deepStrictEqual(plain(m.zeilen), [['92,3', '5'], ['184,6', '10']]);
  assert.ok(Math.abs(m.gerade.m - 0.054171) < 1e-4);
  assert.match(m.svg, /^<svg/);
});

test('Lösung nur mit Musterlösungen', () => {
  const { w, FX } = aufbau();
  const p = FX.protokoll.sammle(w.document, WERTE, { id: 'm', titel: 'M', musterloesungen: true }, new Date(2026, 0, 2));
  assert.strictEqual(p.abschnitte[0].eintraege[0].loesung, 'Laser und Spiegel.');
  assert.strictEqual(p.datum, '02.01.2026');
});

test('Ergebnis-HTML blendet leere Felder aus, auf Wunsch ein', () => {
  const { w, FX } = aufbau();
  const p = FX.protokoll.sammle(w.document, WERTE, { id: 'm', titel: 'M' }, new Date());
  const ohne = FX.protokoll.html(p, { leereZeigen: false });
  assert.ok(!ohne.includes('<h4>Begründe'), 'leeres Feld nicht als Eintrag');
  assert.ok(/Noch offen[\s\S]*Begründe/.test(ohne), 'aber unter Noch offen');
  assert.ok(ohne.includes('Wird heller') && ohne.includes('Laser · Linse'));
  assert.ok(FX.protokoll.html(p, { leereZeigen: true }).includes('<h4>Begründe'));
});

test('aufgelöste Kontrollfrage: „nach 2 Versuchen aufgelöst“ statt „nicht richtig“', () => {
  const w = dom(`<section class="fx-karte" data-karte="a/k" data-abschnitt="1 A">
<div class="fx-feld" data-fx-id="a/k/q" data-fx-art="quiz" data-fx-titel="Kontrolle" data-fx-kontrolle="1" data-fx-versuche="2"><div class="q" data-type="mc"><ul class="opts">
<li><label><input type="radio" data-f="1"><span>erste</span></label></li><li><label><input type="radio" data-f="0"><span>zweite</span></label></li></ul></div></div></section>`);
  const FX = lade(w, 'felder', 'quiz', 'formel', 'ausgleich', 'messtabelle', 'protokoll');
  const p = FX.protokoll.sammle(w.document, { 'a/k/q': { antwort: [0], anteil: 0, versuche: 2, aufgegeben: true, kontrolle: true } }, { id: 'm', titel: 'M' }, new Date());
  const e = p.abschnitte[0].eintraege[0];
  assert.strictEqual(e.aufgegeben, true); assert.strictEqual(e.versuche, 2);
  const h = FX.protokoll.html(p, {});
  assert.ok(h.includes('nach 2 Versuchen aufgelöst'));
  assert.ok(!h.includes('nicht richtig') && !h.includes('✓ richtig'));
});

test('Bildzuordnung: Protokoll als Tabelle Platz | Zuordnung', () => {
  const w = dom(`<main><section class="fx-karte" data-karte="a/k" data-abschnitt="1 X">
    <div class="fx-feld" data-fx-id="a/k/bz" data-fx-art="quiz" data-fx-titel="Schema"><div class="q" data-type="gaps"><div class="ddimg">
      <span class="spot" data-nr="1"><select class="gap" data-correct="Laser"><option value=""></option><option>Laser</option></select></span>
      <span class="spot" data-nr="2"><select class="gap" data-correct="Spiegel"><option value=""></option><option>Spiegel</option></select></span>
    </div></div></div></section></main>`);
  const FX = lade(w, 'felder', 'quiz', 'protokoll');
  const p = FX.protokoll.sammle(w.document, { 'a/k/bz': { antwort: ['Laser', ''], anteil: 0.5 } }, { id: 'x', titel: 'X', musterloesungen: false }, new Date(2026, 9, 21));
  const e = p.abschnitte[0].eintraege[0];
  assert.deepStrictEqual(plain(e.zuordnung), { kopf: ['Platz', 'Zuordnung'], zeilen: [['Platz 1', 'Laser'], ['Platz 2', '–']] });
  const h = FX.protokoll.html(p, {});
  assert.ok(h.indexOf('<td>Platz 2</td><td>–</td>') > -1);
});
