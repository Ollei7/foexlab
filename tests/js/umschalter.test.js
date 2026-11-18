const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, plain } = require('./helfer');

const HTML = `<div class="fx-umschalter"><div class="fx-umschalter-knoepfe">
<button type="button" class="fx-knopf" data-ansicht="0" aria-pressed="true">[+] Messapparat</button><button type="button" class="fx-knopf" data-ansicht="1" aria-pressed="false">[×] Messapparat</button></div>
<div class="fx-ansicht-inhalt" data-ansicht="0">Plus</div><div class="fx-ansicht-inhalt" data-ansicht="1" hidden>Kreuz</div></div>
<section class="fx-karte" data-karte="k/a" data-abschnitt-id="k"><button type="button" class="fx-knopf fx-knopf-oeffnet" data-oeffnet="abschluss" data-knopf-id="ende">Experiment abschließen</button></section>
<section class="fx-karte" data-karte="abschluss/erste" data-abschnitt-id="abschluss"></section>
<div class="fx-loesung-box"><button type="button" class="fx-loesung-knopf" aria-expanded="false">Lösung anzeigen</button><div class="fx-loesung" hidden>Antwort</div></div>`;

test('Klick auf „[×]“ zeigt die zweite Ansicht', () => {
  const w = dom(HTML); lade(w, 'umschalter');
  const d = w.document, [plus, kreuz] = d.querySelectorAll('.fx-umschalter-knoepfe button');
  kreuz.click();
  const [a0, a1] = d.querySelectorAll('.fx-ansicht-inhalt');
  assert.strictEqual(a0.hidden, true); assert.strictEqual(a1.hidden, false);
  assert.strictEqual(kreuz.getAttribute('aria-pressed'), 'true'); assert.strictEqual(plus.getAttribute('aria-pressed'), 'false');
  plus.click(); assert.strictEqual(a0.hidden, false);
});

test('Knopf öffnet über FX.freischaltung und springt zur ersten Karte des Abschnitts', () => {
  const w = dom(HTML); const FX = lade(w, 'umschalter');
  const geoeffnet = [], gesprungen = [];
  FX.freischaltung = { oeffne: (z) => geoeffnet.push(z) }; FX.oberflaeche = { geheZu: (h) => gesprungen.push(h) };
  w.document.querySelector('.fx-knopf-oeffnet').click();
  assert.deepStrictEqual(geoeffnet, ['knopf:ende']); assert.deepStrictEqual(gesprungen, ['#k/abschluss/erste']);
});

test('Lösung anzeigen und ausblenden', () => {
  const w = dom(HTML); lade(w, 'umschalter');
  const k = w.document.querySelector('.fx-loesung-knopf'), l = w.document.querySelector('.fx-loesung');
  k.click(); assert.strictEqual(l.hidden, false); assert.strictEqual(k.textContent, 'Lösung ausblenden');
  k.click(); assert.strictEqual(l.hidden, true); assert.strictEqual(k.textContent, 'Lösung anzeigen');
});

const KARTE = (art) => `<section class="fx-karte" data-abschnitt="A"><div class="fx-feld" data-fx-id="a/k/f" data-fx-art="${art}" data-fx-titel="F"><textarea class="fx-text"></textarea><div class="fx-loesung" hidden>Die Lösung</div></div></section>`;

test('Protokoll: Lösung nur bei musterloesungen', () => {
  const w = dom(KARTE('text')); const FX = lade(w, 'store', 'felder', 'protokoll');
  const werte = { 'a/k/f': { text: 'Antwort' } };
  const mit = FX.protokoll.sammle(w.document, werte, { id: 'k', titel: 'K', musterloesungen: true });
  const ohne = FX.protokoll.sammle(w.document, werte, { id: 'k', titel: 'K', musterloesungen: false });
  assert.strictEqual(mit.abschnitte[0].eintraege[0].loesung, 'Die Lösung');
  assert.strictEqual(ohne.abschnitte[0].eintraege[0].loesung, undefined);
  assert.match(FX.protokoll.html(mit), /Lösung: Die Lösung/);
});
