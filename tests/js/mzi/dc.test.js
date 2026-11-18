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
  ['dcaufbau', 'dceinzel', 'dcmessreihe'].forEach((n) => ladeDatei(w, `kurse/mzi/werkzeuge/${n}.js`));
  return { w, FX, M: FX.mzi };
}
function einzel(id) {
  const u = umgebung(feld('dceinzel', id || 'delayed-choice/k3-s1/s1'));
  const el = u.w.document.querySelector('.fx-feld'), H = u.FX.felder.arten.dceinzel; H.init(el);
  let n = 0; el.addEventListener('change', () => n++);
  const senden = async () => { el.querySelector('[data-o="senden"]').click(); await warte(2100); };
  return Object.assign(u, { el, H, senden, wert: () => plain(H.wert(el)), aenderungen: () => n });
}
function reihe(modus, extra, html) {
  const u = umgebung((html || '') + feld('dcmessreihe', 'delayed-choice/k3-' + modus + '/' + modus, Object.assign({ modus }, extra)));
  const el = u.w.document.querySelector('[data-fx-art="dcmessreihe"]'), H = u.FX.felder.arten.dcmessreihe; H.init(el);
  let n = 0; el.addEventListener('change', () => n++);
  const knopf = el.querySelector('[data-o="messen"]');
  const setzePhi = (v) => { const r = el.querySelector('input[type=range]'); r.value = v; r.dispatchEvent(new u.w.Event('input', { bubbles: true })); };
  const messe = async (phi) => { if (phi !== undefined) setzePhi(phi); knopf.click(); await warte(1150); };
  return Object.assign(u, { el, H, knopf, setzePhi, messe, wert: () => plain(H.wert(el)), aenderungen: () => n });
}

test('dcaufbau: zeigt Aufbau und Zeitleiste, kein Wert, nicht im Protokoll', () => {
  const u = umgebung(feld('dcaufbau', 'delayed-choice/k3-funk/dc-aufbau'));
  const el = u.w.document.querySelector('.fx-feld'), H = u.FX.felder.arten.dcaufbau; H.init(el); H.init(el);
  assert.strictEqual(el.querySelectorAll('.mzi-svg').length, 1); assert.strictEqual(el.querySelectorAll('.mzi-zeitleiste [data-k]').length, 4);
  assert.match(el.textContent, /Zufallsgenerator/); assert.strictEqual(H.ohneProtokoll, true); assert.strictEqual(H.leer(plain(H.wert(el))), false);
});

test('dceinzel: 9 → leer, 10 → erledigt', () => {
  const { H, el, wert } = einzel();
  const s = (n) => ({ singles: Array.from({ length: n }, (_, i) => ({ c: i % 2 ? 'in' : 'out', d: 1 + (i % 2) })) });
  assert.strictEqual(H.leer(wert()), true);
  H.laden(el, s(9)); assert.strictEqual(H.leer(wert()), true); assert.match(el.querySelector('[data-o="st"]').textContent, /9 von 10 Einzelmessungen\. Noch 1/);
  H.laden(el, s(10)); assert.strictEqual(H.leer(wert()), false); assert.match(el.querySelector('[data-o="st"]').textContent, /10 Einzelmessungen\. Die nächste Aufgabe ist frei/);
  assert.strictEqual(H.begonnen(s(1)), true); assert.strictEqual(H.begonnen({ singles: [] }), false);
});
test('dceinzel: ein Photon: Zeitleiste, Wert und change erst am Ende, Knopf währenddessen gesperrt', async () => {
  const { w, el, wert, aenderungen } = einzel();
  const alt = w.Math.random; w.Math.random = () => 0.9;   // draußen (≥ ½), dann Detektor 2 (P(D1) = ½)
  const k = el.querySelector('[data-o="senden"]'); k.click();
  assert.strictEqual(k.disabled, true); assert.strictEqual(aenderungen(), 0); assert.strictEqual(wert().singles.length, 0);
  await warte(300); assert.strictEqual(el.querySelectorAll('.mzi-zeitleiste .on').length, 1);
  await warte(700); assert.strictEqual(el.querySelectorAll('.mzi-zeitleiste .on').length, 2); assert.strictEqual(aenderungen(), 0);
  await warte(1200); w.Math.random = alt;
  assert.strictEqual(aenderungen(), 1); assert.strictEqual(k.disabled, false);
  assert.deepStrictEqual(wert(), { singles: [{ c: 'out', d: 2 }] });
  assert.match(el.querySelector('.mzi-zeitleiste').textContent, /Klick an Detektor 2/);
  const z = el.querySelectorAll('tbody tr'); assert.strictEqual(z.length, 1); assert.deepStrictEqual(Array.from(z[0].children).map((c) => c.textContent), ['1', 'draußen', 'Detektor 2']);
});
test('dceinzel: Umschalter, Protokoll mit Tabelle und Häufigkeitsdiagramm ohne var(', () => {
  const { H, el } = einzel();
  const stand = { singles: [{ c: 'in', d: 1 }, { c: 'out', d: 2 }, { c: 'out', d: 1 }] };
  H.laden(el, stand);
  assert.strictEqual(el.querySelector('[data-o="diagramm"]').hidden, true);
  el.querySelector('[data-ansicht="diagramm"]').click(); assert.strictEqual(el.querySelector('[data-o="diagramm"]').hidden, false); assert.strictEqual(el.querySelector('[data-o="tabelle"]').hidden, true);
  const p = plain(H.protokoll(el, stand));
  assert.strictEqual(p[0].typ, 'tabelle'); assert.strictEqual(p[0].zeilen.length, 3); assert.strictEqual(p[1].typ, 'grafik');
  assert.ok(p[1].svg.startsWith('<svg')); assert.ok(!p[1].svg.includes('var('));
});

test('dcmessreihe s2: change erst nach Animationsende, Wert vorher unverändert', async () => {
  const { knopf, aenderungen, wert } = reihe('s2');
  knopf.click(); assert.strictEqual(knopf.disabled, true);
  await warte(500); assert.strictEqual(aenderungen(), 0); assert.deepStrictEqual(wert(), { modus: 's2', mw: [] });
  await warte(700); assert.strictEqual(aenderungen(), 1); assert.strictEqual(wert().mw.length, 1); assert.strictEqual(knopf.disabled, false);
});
test('dcmessreihe s2: 3 Reihen bei 0° → erledigt', async () => {
  const { H, messe, wert, el } = reihe('s2');
  assert.strictEqual(H.leer(wert()), true);
  await messe(); await messe(); assert.strictEqual(H.leer(wert()), true);
  await messe(); assert.strictEqual(H.leer(wert()), false);
  assert.deepStrictEqual(wert().mw.map((m) => [m.nr, m.phi]), [[1, 0], [2, 0], [3, 0]]);
  assert.strictEqual(el.querySelectorAll('tbody tr').length, 6);   // zwei Zeilen je Messreihe
  assert.strictEqual(el.querySelector('input[type=range]'), null);
});
test('dcmessreihe: Messreihe hat 1000 Einzelmessungen, drin bei 0° nie D2', async () => {
  const { messe, wert } = reihe('s2');
  await messe(); const m = wert().mw[0];
  assert.strictEqual(m.in.n + m.out.n, 1000); assert.strictEqual(m.in.k1 + m.in.k2, m.in.n); assert.strictEqual(m.out.k1 + m.out.k2, m.out.n);
  assert.strictEqual(m.in.k2, 0); assert.ok(m.in.n > 400 && m.in.n < 600);
});
test('dcmessreihe s2: Umschalter Tabelle/Häufigkeitsdiagramm, Protokoll nur Tabelle', async () => {
  const { H, el, messe, wert } = reihe('s2');
  await messe();
  el.querySelector('[data-ansicht="diagramm"]').click(); assert.strictEqual(el.querySelector('[data-o="diagramm"]').hidden, false);
  assert.match(el.querySelector('[data-o="diagramm"]').textContent, /Strahlteiler 2 drin/);
  const p = plain(H.protokoll(el, wert())); assert.strictEqual(p.length, 1); assert.strictEqual(p[0].typ, 'tabelle'); assert.strictEqual(p[0].zeilen.length, 2);
  assert.deepStrictEqual(p[0].kopf, ['Messreihe', 'Δφ', 'Strahlteiler 2', 'Messungen', 'Zählrate D1', 'Zählrate D2']);
});
test('dcmessreihe s3: noch leeres Live-Feld von s2 (Init-Fenster) senkt die Nummer nicht', async () => {
  const u = reihe('s3', { vorher: 'delayed-choice/k3-s2/s2' });
  u.w.document.body.insertAdjacentHTML('beforeend', feld('dcmessreihe', 'delayed-choice/k3-s2/s2', { modus: 's2' }));
  const s = await u.FX.store.oeffne('k'); await u.FX.felder.start(s);
  const fremd = u.w.document.querySelector('[data-fx-id="delayed-choice/k3-s2/s2"]'); u.FX.felder.arten.dcmessreihe.init(fremd);   // initialisiert, aber noch ohne Messreihen
  const mk = (nr) => ({ nr, phi: 0, in: { n: 500, k1: 500, k2: 0 }, out: { n: 500, k1: 250, k2: 250 } });
  await s.schreibe('delayed-choice/k3-s2/s2', { mw: [mk(1), mk(2), mk(3)] });
  u.H.laden(u.el, { mw: [] }); await warte(50);
  await u.messe(90);
  assert.deepStrictEqual(u.wert().mw.map((m) => [m.nr, m.phi]), [[4, 90]]);
});
test('dcmessreihe s3: Nummern setzen s2 fort', async () => {
  const html = '';
  const u = reihe('s3', { vorher: 'delayed-choice/k3-s2/s2' }, html);
  const s = await u.FX.store.oeffne('k'); await u.FX.felder.start(s);
  const mk = (nr) => ({ nr, phi: 0, in: { n: 500, k1: 500, k2: 0 }, out: { n: 500, k1: 250, k2: 250 } });
  await s.schreibe('delayed-choice/k3-s2/s2', { mw: [mk(1), mk(2), mk(3)] });
  u.H.laden(u.el, { mw: [] }); await warte(50);
  assert.strictEqual(u.el.querySelectorAll('tbody tr').length, 6);   // Messreihen aus Schritt 2 stehen mit in der Tabelle
  await u.messe(90);
  assert.deepStrictEqual(u.wert().mw.map((m) => [m.nr, m.phi]), [[4, 90]]);
  assert.strictEqual(u.el.querySelectorAll('tbody tr').length, 8);
});
test('dcmessreihe s3: Messung bei 0° erlaubt, zählt nicht; 2 Phasen mit 2 Reihen + 1 Phase mit 1 Reihe → leer; dritte Reihe → erledigt', async () => {
  const { H, messe, wert, knopf } = reihe('s3');
  assert.strictEqual(knopf.disabled, false);
  assert.strictEqual(H.leer(wert()), true);
  await messe(0); await messe(0); await messe(0);
  assert.strictEqual(wert().mw.length, 3); assert.strictEqual(H.leer(wert()), true);   // 0° zählt in Schritt 3 nicht
  await messe(90); await messe(90); await messe(180); await messe(180); await messe(270);
  assert.strictEqual(H.leer(wert()), true);
  await messe(270); assert.strictEqual(H.leer(wert()), false);
  assert.deepStrictEqual(wert().mw.map((m) => m.nr), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.strictEqual(wert().modus, 's3'); assert.strictEqual(H.begonnen(wert()), true);
});
test('dcmessreihe: leer richtet sich nach dem Modus im Wert; alte Werte ohne Modus laden', () => {
  const { H } = reihe('s2');
  const mk = (nr, phi) => ({ nr, phi, in: { n: 500, k1: 500, k2: 0 }, out: { n: 500, k1: 250, k2: 250 } });
  const dreiNull = [mk(1, 0), mk(2, 0), mk(3, 0)];
  assert.strictEqual(H.leer({ modus: 's2', mw: dreiNull }), false);
  assert.strictEqual(H.leer({ modus: 's3', mw: dreiNull }), true);
  assert.strictEqual(H.leer({ mw: dreiNull }), false);   // alt, nur 0° → s2
  assert.strictEqual(H.leer({ mw: [mk(1, 90), mk(2, 90), mk(3, 180), mk(4, 180), mk(5, 270), mk(6, 270)] }), false);   // alt, Δφ ≠ 0° → s3
});
test('dcmessreihe: neue s2-Reihe nach vorhandenen s3-Reihen, danach s3, behält eindeutige Nummern', async () => {
  const u2 = reihe('s2', { nachher: 'delayed-choice/k3-s3/s3' });
  const s = await u2.FX.store.oeffne('k'); await u2.FX.felder.start(s);
  const mk = (nr, phi) => ({ nr, phi, in: { n: 500, k1: 500, k2: 0 }, out: { n: 500, k1: 250, k2: 250 } });
  await s.schreibe('delayed-choice/k3-s3/s3', { modus: 's3', mw: [mk(4, 90)] });
  u2.H.laden(u2.el, { modus: 's2', mw: [mk(1, 0), mk(2, 0), mk(3, 0)] }); await warte(50);
  await u2.messe(); assert.strictEqual(u2.wert().mw[3].nr, 5);   // 4 ist an Schritt 3 vergeben
  await s.schreibe('delayed-choice/k3-s2/s2', u2.wert());
  const u3 = reihe('s3', { vorher: 'delayed-choice/k3-s2/s2' });
  const s3 = await u3.FX.store.oeffne('k2'); await u3.FX.felder.start(s3);
  await s3.schreibe('delayed-choice/k3-s2/s2', u2.wert());
  u3.H.laden(u3.el, { modus: 's3', mw: [mk(4, 90)] }); await warte(50);
  await u3.messe(180);
  const nr = u3.wert().mw.map((m) => m.nr).concat(u2.wert().mw.map((m) => m.nr));
  assert.strictEqual(new Set(nr).size, nr.length); assert.strictEqual(u3.wert().mw[1].nr, 6);
});
test('dcmessreihe: s2 und gleich danach s3 (vor dem Speichern) → eindeutige Nummern', async () => {
  const S2 = 'delayed-choice/k3-s2/s2', S3 = 'delayed-choice/k3-s3/s3';
  const u = umgebung(feld('dcmessreihe', S2, { modus: 's2', nachher: S3 }) + feld('dcmessreihe', S3, { modus: 's3', vorher: S2 }));
  const s = await u.FX.store.oeffne('k'); await u.FX.felder.start(s); await warte(30);
  const d = u.w.document, e2 = d.querySelector('[data-fx-id="' + S2 + '"]'), e3 = d.querySelector('[data-fx-id="' + S3 + '"]'), H = u.FX.felder.arten.dcmessreihe;
  e2.querySelector('[data-o="messen"]').click(); await warte(1100);   // Messreihe fertig, Speichern (400 ms) steht noch aus
  assert.strictEqual(await s.lies(S2), undefined);
  e3.querySelector('[data-o="messen"]').click(); await warte(1150);
  const nr = H.wert(e2).mw.map((m) => m.nr).concat(H.wert(e3).mw.map((m) => m.nr));
  assert.deepStrictEqual(plain(nr), [1, 2]);
});
test('dcmessreihe: Knopf gesperrt, bis die Messreihen des anderen Schritts gelesen sind', async () => {
  const S2 = 'delayed-choice/k3-s2/s2', S3 = 'delayed-choice/k3-s3/s3';
  const u = umgebung(feld('dcmessreihe', S3, { modus: 's3', vorher: S2 }));
  let loesen; const offen = new Promise((r) => { loesen = r; });
  u.FX.felder.speicher = () => ({ lies: () => offen });
  const el = u.w.document.querySelector('.fx-feld'); u.FX.felder.arten.dcmessreihe.init(el);
  const k = el.querySelector('[data-o="messen"]');
  assert.strictEqual(k.disabled, true);
  loesen({ modus: 's2', mw: [{ nr: 3, phi: 0, in: { n: 500, k1: 500, k2: 0 }, out: { n: 500, k1: 250, k2: 250 } }] }); await warte(20);
  assert.strictEqual(k.disabled, false);
});
test('dc: begonnen friert die Hypothese nach der ersten Messung ein, leer erst später', async () => {
  const html = '<div class="fx-karte" data-karte="d/k" data-abschnitt-id="d"><div class="fx-feld" data-fx-id="d/k/h" data-fx-art="vermutung" data-fx-titel="H"><textarea></textarea></div>' +
    feld('dceinzel', 'd/k/e') + '</div>';
  const u = umgebung(html); const d = u.w.document;
  const s = await u.FX.store.oeffne('k'); await u.FX.felder.start(s);
  const h = d.querySelector('[data-fx-id="d/k/h"]'), m = d.querySelector('[data-fx-id="d/k/e"]');
  assert.ok(!h.hasAttribute('data-fx-festgehalten'));
  m.querySelector('[data-o="senden"]').click(); await warte(2100);
  assert.ok(h.hasAttribute('data-fx-festgehalten')); assert.strictEqual(h.querySelector('textarea').readOnly, true);
  assert.strictEqual(u.FX.felder.arten.dceinzel.leer(plain(u.FX.felder.arten.dceinzel.wert(m))), true);
});
