const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, ladeDatei, mitDb, plain, warte } = require('../helfer');

const KONFIG = (o) => "'" + JSON.stringify(o) + "'";
function feld(art, id, konfig) {
  return `<div class="fx-feld" data-fx-id="${id}" data-fx-art="${art}" data-fx-titel="T"${konfig ? ' data-fx-konfig=' + KONFIG(konfig) : ''}><div class="fx-werkzeug-flaeche"></div></div>`;
}
function umgebung(html) {
  const w = mitDb(dom(html)); const FX = lade(w, 'store', 'felder');
  ladeDatei(w, 'kurse/mzi/werkzeuge/mzikern.js');
  ladeDatei(w, 'kurse/mzi/werkzeuge/vorhersage.js');
  ladeDatei(w, 'kurse/mzi/werkzeuge/aufbau.js');
  return { w, FX, M: FX.mzi };
}
function vorhersage() {
  const u = umgebung(feld('vorhersage', 'drei-aufbauten/k1-a1/a1-pred'));
  const el = u.w.document.querySelector('.fx-feld'), H = u.FX.felder.arten.vorhersage; H.init(el);
  const knopf = (d, s) => el.querySelector(`[data-det="${d}"] [data-d="${s}"]`);
  const eingabe = (d) => el.querySelector(`[data-det="${d}"] input`);
  return Object.assign(u, { el, H, knopf, eingabe, wert: () => plain(H.wert(el)) });
}
function aufbau(modus, extra) {
  const u = umgebung(feld('aufbau', 'drei-aufbauten/k1-a' + modus + '/a-mess', Object.assign({ modus, vorhersage: 'drei-aufbauten/k1-a' + modus + '/a-pred' }, extra)));
  const el = u.w.document.querySelector('.fx-feld'), H = u.FX.felder.arten.aufbau; H.init(el);
  let aenderungen = 0; el.addEventListener('change', () => aenderungen++);
  const knopf = (n) => el.querySelector(`[data-schuss="${n}"]`);
  return Object.assign(u, { el, H, knopf, wert: () => plain(H.wert(el)), aenderungen: () => aenderungen });
}

test('vorhersage: zweiter Wert ergänzt auf 100, leer bis Summe 100', () => {
  const { H, knopf, eingabe, wert } = vorhersage();
  assert.deepStrictEqual(wert(), { p1: null, p2: null }); assert.strictEqual(H.leer(wert()), true);
  knopf(1, 5).click();   // von 0 aus +5
  assert.deepStrictEqual(wert(), { p1: 5, p2: 95 }); assert.strictEqual(H.leer(wert()), false);
  for (let i = 0; i < 9; i++) knopf(1, 5).click();
  assert.deepStrictEqual(wert(), { p1: 50, p2: 50 });
  knopf(2, -5).click(); assert.deepStrictEqual(wert(), { p1: 55, p2: 45 });
  eingabe(1).value = '30'; eingabe(1).dispatchEvent(new (eingabe(1).ownerDocument.defaultView.Event)('input', { bubbles: true }));
  assert.deepStrictEqual(wert(), { p1: 30, p2: 70 }); assert.strictEqual(eingabe(2).value, '70');
  for (let i = 0; i < 30; i++) knopf(1, -5).click();
  assert.deepStrictEqual(wert(), { p1: 0, p2: 100 });
  assert.strictEqual(H.leer({ p1: 40, p2: 50 }), true); assert.strictEqual(H.leer({ p1: 40, p2: null }), true);
});
test('vorhersage: laden, Protokoll und change nach Knopf', () => {
  const { w, el, H, knopf, wert } = vorhersage(); let n = 0; el.addEventListener('change', () => n++);
  H.laden(el, { p1: 25, p2: 75 }); assert.deepStrictEqual(wert(), { p1: 25, p2: 75 });
  knopf(1, 5).click(); assert.strictEqual(n, 1);
  assert.deepStrictEqual(plain(H.protokoll(el, { p1: 50, p2: 50 })), [{ typ: 'text', text: 'Detektor 1: 50 % · Detektor 2: 50 %' }]);
  assert.strictEqual(H.hypothese, true);
});
test('vorhersage: Schreibschutz sperrt Knöpfe und Eingaben', () => {
  const { el, H, knopf, eingabe, wert } = vorhersage();
  H.laden(el, { p1: 50, p2: 50 }); H.schreibschutz(el, true);
  assert.strictEqual(eingabe(1).readOnly, true); assert.strictEqual(eingabe(2).readOnly, true);
  assert.strictEqual(knopf(1, 5).disabled, true); assert.strictEqual(knopf(2, -5).disabled, true);
  knopf(1, 5).click(); assert.deepStrictEqual(wert(), { p1: 50, p2: 50 });
  H.schreibschutz(el, false);
  assert.strictEqual(eingabe(1).readOnly, false); assert.strictEqual(knopf(1, 5).disabled, false);
  knopf(1, 5).click(); assert.deepStrictEqual(wert(), { p1: 55, p2: 45 });
});

test('aufbau Modus 1: 1000 Photonen → n1+n2 = 1000, leer bis 5000', async () => {
  const { H, knopf, wert, el } = aufbau('1');
  assert.strictEqual(H.leer(wert()), true);
  knopf(1000).click(); await warte(1300);
  const w = wert(); assert.strictEqual(w.n1 + w.n2, 1000);
  assert.strictEqual(w.log.length, 1); assert.deepStrictEqual([w.log[0].n, w.log[0].k1 + w.log[0].k2], [1000, 1000]);
  assert.strictEqual(H.leer(w), true);
  assert.strictEqual(H.leer({ n1: 2500, n2: 2500, log: [] }), false);
  assert.strictEqual(H.leer({ n1: 2000, n2: 2999, log: [] }), true);
  assert.match(el.textContent, /1000 von 5000 Photonen gemessen/);
});
test('aufbau Modus 3: alle Klicks an D1', async () => {
  const { knopf, wert } = aufbau('3');
  knopf(100).click(); await warte(800);
  assert.deepStrictEqual(wert().log.map((r) => [r.n, r.k1, r.k2]), [[100, 100, 0]]);
  assert.deepStrictEqual([wert().n1, wert().n2], [100, 0]);
});
test('aufbau: ein einzelnes Photon klickt genau einen Detektor', async () => {
  const { knopf, wert, w } = aufbau('1');
  const alt = w.Math.random; w.Math.random = () => 0.9;   // ≥ ½ → Detektor 2
  knopf(1).click(); await warte(1100); w.Math.random = alt;
  assert.deepStrictEqual([wert().n1, wert().n2], [0, 1]);
});
test('aufbau: change erst nach Animationsende, Knöpfe währenddessen gesperrt', async () => {
  const { knopf, aenderungen, el } = aufbau('2');
  knopf(1000).click(); assert.strictEqual(aenderungen(), 0);
  assert.strictEqual(knopf(1).disabled, true); assert.strictEqual(knopf(100).disabled, true); assert.strictEqual(knopf(1000).disabled, true);
  await warte(400); assert.strictEqual(aenderungen(), 0);
  await warte(1000); assert.strictEqual(aenderungen(), 1);
  assert.strictEqual(knopf(1000).disabled, false);
  assert.ok(el.querySelector('.mzi-svg'));
});
test('aufbau: laden() zeigt gespeicherten Stand und Protokoll-Tabelle', () => {
  const { H, el, wert, M } = aufbau('1');
  const stand = { n1: 60, n2: 40, log: [{ n: 100, k1: 60, k2: 40 }] };
  H.laden(el, stand); assert.deepStrictEqual(wert(), stand);
  const zeilen = el.querySelectorAll('.mzi-log tbody tr'); assert.strictEqual(zeilen.length, 1);
  assert.deepStrictEqual(Array.from(zeilen[0].children).map((c) => c.textContent), ['1', '100', '60', '40', '100']);
  assert.match(el.textContent, /100 von 5000 Photonen gemessen/);
  assert.strictEqual(el.querySelector('[data-o="n1"]').textContent, '60');
  const p = plain(H.protokoll(el, stand));
  assert.strictEqual(p[0].typ, 'tabelle'); assert.strictEqual(p[1].typ, 'grafik'); assert.ok(p[1].svg.startsWith('<svg'));
  assert.deepStrictEqual(p[0].kopf, ['Nr.', 'Photonen', 'D1', 'D2', 'Summe']);
});
test('aufbau: Umschalter Tabelle/Balken', () => {
  const { el } = aufbau('1');
  const t = el.querySelector('[data-ansicht="tabelle"]'), b = el.querySelector('[data-ansicht="balken"]');
  assert.strictEqual(el.querySelector('.mzi-balken').hidden, true);
  b.click(); assert.strictEqual(el.querySelector('.mzi-balken').hidden, false); assert.strictEqual(el.querySelector('.mzi-log').hidden, true);
  t.click(); assert.strictEqual(el.querySelector('.mzi-log').hidden, false);
});
test('aufbau: Vergleich liest die gespeicherte Vorhersage', async () => {
  const { w, FX, H, el } = aufbau('1');
  const s = await FX.store.oeffne('k'); await FX.felder.start(s);
  await s.schreibe('drei-aufbauten/k1-a1/a-pred', { p1: 50, p2: 50 });
  H.laden(el, { n1: 60, n2: 40, log: [{ n: 100, k1: 60, k2: 40 }] }); await warte(30);
  const t = el.querySelector('[data-o="cmp"]').textContent;
  assert.match(t, /50 % : 50 %/); assert.match(t, /60 % : 40 %/); assert.match(t, /100 Photonen/);
});
test('aufbau: schon nach 100 Photonen ist die Vorhersage festgehalten (begonnen), leer bleibt es bis 5000', async () => {
  const html = '<div class="fx-karte" data-karte="d/k" data-abschnitt-id="d">' + feld('vorhersage', 'd/k/p') + feld('aufbau', 'd/k/m', { modus: '1', vorhersage: 'd/k/p' }) + '</div>';
  const u = umgebung(html); const d = u.w.document;
  const s = await u.FX.store.oeffne('k'); await u.FX.felder.start(s);
  const p = d.querySelector('[data-fx-id="d/k/p"]'), m = d.querySelector('[data-fx-id="d/k/m"]');
  assert.ok(!p.hasAttribute('data-fx-festgehalten'));
  m.querySelector('[data-schuss="100"]').click(); await warte(800);
  assert.ok(p.hasAttribute('data-fx-festgehalten')); assert.strictEqual(p.querySelector('input').readOnly, true);
  assert.strictEqual(p.querySelector('[data-d="5"]').disabled, true);
  assert.strictEqual(u.FX.felder.arten.aufbau.leer(plain(u.FX.felder.arten.aufbau.wert(m))), true);
});

test('Protokoll: begonnene Messung (1000 von 5000 Photonen) steht im Protokoll und unter „Noch offen“', () => {
  const html = '<section class="fx-karte" data-karte="drei-aufbauten/k1-a1" data-abschnitt="1 Drei Aufbauten">' +
    feld('aufbau', 'drei-aufbauten/k1-a1/a1-mess', { modus: '1', vorhersage: 'drei-aufbauten/k1-a1/a1-pred' }) + '</section>';
  const w = mitDb(dom(html)); const FX = lade(w, 'store', 'felder', 'quiz', 'formel', 'ausgleich', 'messtabelle', 'protokoll', 'pdf');
  ladeDatei(w, 'kurse/mzi/werkzeuge/mzikern.js'); ladeDatei(w, 'kurse/mzi/werkzeuge/aufbau.js');
  const el = w.document.querySelector('.fx-feld'); FX.felder.arten.aufbau.init(el);
  const wert = { n1: 480, n2: 520, log: [{ n: 1000, k1: 480, k2: 520 }] };
  assert.strictEqual(FX.felder.arten.aufbau.leer(wert), true);
  const p = FX.protokoll.sammle(w.document, { 'drei-aufbauten/k1-a1/a1-mess': wert }, { id: 'm', titel: 'M' }, new Date());
  const e = p.abschnitte[0].eintraege[0];
  assert.strictEqual(e.leer, true); assert.strictEqual(e.begonnen, true); assert.ok(e.teile && e.teile.length > 0);
  const h = FX.protokoll.html(p, {});
  const eintrag = h.split('<h4>T</h4>')[1] || '';
  assert.ok(/480/.test(eintrag) && /520/.test(eintrag), 'Messwerte im Ergebnis');
  assert.ok(/Noch offen[\s\S]*<li>T<\/li>/.test(h), 'trotzdem unter Noch offen');
  const breite = (t, pt) => String(t).length * pt * 0.18;
  const texte = Array.from(FX.pdf.plane(p, { breite })).flatMap((s) => Array.from(s.ops)).filter((o) => o.art === 'text').map((o) => o.text).join(' | ');
  assert.ok(/480/.test(texte), 'Messwerte im PDF');
  // ohne begonnen (0 Photonen) bleibt es beim leeren Eintrag
  const p0 = FX.protokoll.sammle(w.document, { 'drei-aufbauten/k1-a1/a1-mess': { n1: 0, n2: 0, log: [] } }, { id: 'm', titel: 'M' }, new Date());
  assert.ok(!p0.abschnitte[0].eintraege[0].begonnen && !p0.abschnitte[0].eintraege[0].teile);
});
