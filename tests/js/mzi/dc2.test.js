const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, ladeDatei, mitDb, plain, warte } = require('../helfer');

const KONFIG = (o) => "'" + JSON.stringify(o) + "'";
const S2 = 'delayed-choice/k3-s2/s2', S3 = 'delayed-choice/k3-s3/s3', LAUF = 'delayed-choice/k3-s5/s5', HYP = 'delayed-choice/k3-funk/dc-hyp';
function feld(art, id, konfig) {
  return `<div class="fx-feld" data-fx-id="${id}" data-fx-art="${art}" data-fx-titel="T"${konfig ? ' data-fx-konfig=' + KONFIG(konfig) : ''}><div class="fx-werkzeug-flaeche"></div></div>`;
}
function umgebung(html) {
  const w = mitDb(dom(html)); const FX = lade(w, 'store', 'felder');
  ladeDatei(w, 'kurse/mzi/werkzeuge/mzikern.js');
  ['dcsortieren', 'dcdurchlauf', 'zitat'].forEach((n) => ladeDatei(w, `kurse/mzi/werkzeuge/${n}.js`));
  return { w, FX, M: FX.mzi };
}
const mk = (nr, phi, i, o) => ({ nr, phi, in: { n: i[0], k1: i[1], k2: i[2] }, out: { n: o[0], k1: o[1], k2: o[2] } });
async function sortieren() {
  const u = umgebung(feld('dcsortieren', 'delayed-choice/k3-s4/s4', { quellen: S2 + ',' + S3 }));
  const s = await u.FX.store.oeffne('k'); await u.FX.felder.start(s);
  const el = u.w.document.querySelector('.fx-feld'), H = u.FX.felder.arten.dcsortieren; H.init(el);
  let n = 0; el.addEventListener('change', () => n++);
  const quelle = async (id, v) => { await s.schreibe(id, v); u.w.document.dispatchEvent(new u.w.CustomEvent('fx:geaendert', { detail: { id } })); await warte(30); };
  const knopf = (nr, c, to, modus) => el.querySelector(`tr[data-key="${modus || 's2'}-${nr}${c}"] [data-to="${to}"]`);
  return Object.assign(u, { s, el, H, quelle, knopf, wert: () => plain(H.wert(el)), aenderungen: () => n });
}

test('dcsortieren: falsche Zuordnung wird nicht gespeichert', async () => {
  const t = await sortieren();
  await t.quelle(S2, { modus: 's2', mw: [mk(1, 0, [500, 500, 0], [500, 250, 250])] });
  assert.strictEqual(t.el.querySelectorAll('tbody tr[data-key]').length, 2);
  const tr = t.el.querySelector('tr[data-key="s2-1in"]');
  t.knopf(1, 'in', 'out').click();
  assert.deepStrictEqual(t.wert().zuordnung, {}); assert.ok(tr.classList.contains('wrong'));
  assert.match(t.el.querySelector('[data-o="st"]').textContent, /Messreihe 1: Schaut in die Spalte ‚Zufallsgenerator wählte‘\./);
  t.knopf(1, 'in', 'in').click(); assert.deepStrictEqual(t.wert().zuordnung, { 's2-1in': 'in' });
  assert.strictEqual(t.knopf(1, 'in', 'in').getAttribute('aria-pressed'), 'true');
});
test('dcsortieren: alle richtig → erledigt; neue Messreihe in s3 → wieder leer; begonnen ab erster Zuordnung', async () => {
  const t = await sortieren();
  await t.quelle(S2, { modus: 's2', mw: [mk(1, 0, [500, 500, 0], [500, 250, 250])] });
  assert.strictEqual(t.H.leer(t.wert()), true); assert.strictEqual(t.H.begonnen(t.wert()), false);
  t.knopf(1, 'in', 'in').click(); assert.strictEqual(t.H.leer(t.wert()), true); assert.strictEqual(t.H.begonnen(t.wert()), true);
  t.knopf(1, 'out', 'out').click(); assert.strictEqual(t.H.leer(t.wert()), false);
  assert.deepStrictEqual(t.wert().zeilen, ['s2-1in', 's2-1out']);
  const vorher = t.aenderungen();
  await t.quelle(S3, { modus: 's3', mw: [mk(4, 90, [500, 250, 250], [500, 250, 250])] });
  assert.strictEqual(t.H.leer(t.wert()), true); assert.ok(t.aenderungen() > vorher);   // neue Zeilen erscheinen unsortiert und werden gemeldet
  assert.strictEqual(t.el.querySelectorAll('tbody tr[data-key]').length, 4);
  assert.strictEqual(t.H.leer({ zuordnung: {}, zeilen: [] }), true);
  assert.strictEqual(t.H.leer({ zuordnung: { a: 'in' }, zeilen: ['a'] }), false);
});
test('dcsortieren: alter Wert ohne modus wird gelesen', async () => {
  const t = await sortieren();
  await t.quelle(S3, { mw: [mk(2, 90, [500, 250, 250], [500, 250, 250])] });
  assert.strictEqual(t.el.querySelectorAll('tbody tr[data-key]').length, 2);
});
test('dcsortieren: gleiche Nummer in s2 und s3 → keine Zeile geht verloren, Nummer bleibt sichtbar', async () => {
  const t = await sortieren();
  await t.quelle(S2, { modus: 's2', mw: [mk(1, 0, [500, 500, 0], [500, 250, 250]), mk(2, 0, [500, 500, 0], [500, 250, 250])] });
  await t.quelle(S3, { modus: 's3', mw: [mk(2, 90, [500, 250, 250], [500, 250, 250])] });
  const zeilen = Array.from(t.el.querySelectorAll('tbody tr[data-key]'));
  assert.strictEqual(zeilen.length, 6);
  assert.deepStrictEqual(zeilen.map((z) => z.getAttribute('data-key')), ['s2-1in', 's2-1out', 's2-2in', 's2-2out', 's3-2in', 's3-2out']);
  assert.strictEqual(zeilen[4].children[0].textContent, '2'); assert.strictEqual(zeilen[4].children[1].textContent, 'λ/4');
  t.knopf(2, 'in', 'in', 's3').click();
  assert.deepStrictEqual(t.wert().zuordnung, { 's3-2in': 'in' });
  assert.match(t.el.querySelector('[data-o="mittel"]').textContent, /λ\/4/);
});
test('dcsortieren: Mittelwert aus 120 und 130 ist 125, nur Sortiertes zählt', async () => {
  const t = await sortieren();
  await t.quelle(S2, { modus: 's2', mw: [mk(1, 0, [500, 120, 0], [500, 250, 250]), mk(2, 0, [500, 130, 0], [500, 250, 250])] });
  t.knopf(1, 'in', 'in').click(); assert.match(t.el.querySelector('[data-o="mittel"]').textContent, /120,0/);
  t.knopf(2, 'in', 'in').click();
  const p = plain(t.H.protokoll(t.el, t.wert()));
  assert.strictEqual(p[0].typ, 'tabelle'); assert.deepStrictEqual(p[0].zeilen[0].slice(0, 4), ['0', '2', '125,0', '0,0']);
  assert.strictEqual(p[1].typ, 'grafik'); assert.strictEqual(p[2].typ, 'grafik'); assert.ok(!p[1].svg.includes('var(') && !p[2].svg.includes('var('));
});

async function durchlauf(modus, extra) {
  const u = umgebung(feld('dcdurchlauf', 'delayed-choice/k3-s5/s5', Object.assign({ modus }, extra)));
  const el = u.w.document.querySelector('.fx-feld'), H = u.FX.felder.arten.dcdurchlauf; H.init(el);
  let n = 0; el.addEventListener('change', () => n++);
  return Object.assign(u, { el, H, wert: () => plain(H.wert(el)), aenderungen: () => n });
}
test('dcdurchlauf: 17 Reihen 0 bis λ in λ/16, Wert erst nach letztem Schritt', async () => {
  const t = await durchlauf('lauf'); t.M.EINST.LAUF_MS = 20;
  const k = t.el.querySelector('[data-o="lauf"]'); k.click(); assert.strictEqual(k.disabled, true);
  await warte(300);
  assert.strictEqual(t.wert().run.length, 0); assert.strictEqual(t.aenderungen(), 0); assert.strictEqual(t.H.leer(t.wert()), true);
  assert.ok(t.el.querySelector('[data-o="balken"]').style.width !== '0%');
  for (let i = 0; i < 100 && t.aenderungen() === 0; i++) await warte(100);   // jsdom zeichnet langsam
  const w = t.wert(); assert.strictEqual(w.run.length, 17); assert.strictEqual(t.aenderungen(), 1); assert.strictEqual(k.disabled, false);
  assert.deepStrictEqual(w.run.map((r) => r.phi), Array.from({ length: 17 }, (_, i) => i * 22.5));
  assert.strictEqual(t.H.leer(w), false); assert.strictEqual(t.H.begonnen(w), true); assert.strictEqual(t.H.begonnen({ run: [] }), false);
  assert.match(k.textContent, /wiederholen/);
  // Wiederholen ersetzt den Wert
  t.M.EINST.LAUF_MS = 0; const alt = JSON.stringify(w.run); k.click(); await warte(200);
  assert.strictEqual(t.wert().run.length, 17); assert.strictEqual(t.aenderungen(), 2);
  const p = plain(t.H.protokoll(t.el, t.wert())); assert.strictEqual(p.length, 2); assert.ok(p.every((x) => x.typ === 'grafik' && !x.svg.includes('var(')));
  assert.notStrictEqual(JSON.stringify(t.wert().run), alt);   // neuer Durchlauf ersetzt den Wert
});
test('dcdurchlauf: draußen bei jeder Phase etwa 250/s an jedem Detektor (±60), drin folgt cos²', async () => {
  const t = await durchlauf('lauf'); t.M.EINST.LAUF_MS = 0;
  t.el.querySelector('[data-o="lauf"]').click(); await warte(300);
  const run = t.wert().run; assert.strictEqual(run.length, 17);
  run.forEach((r) => { assert.ok(Math.abs(r.out.k1 - 250) <= 60 && Math.abs(r.out.k2 - 250) <= 60, 'draußen bei ' + r.phi); });
  assert.strictEqual(run[0].in.k2, 0); assert.strictEqual(run[16].in.k2, 0);   // 0 und λ (360°): drin nur Detektor 1
  assert.strictEqual(run[8].in.k1, 0);   // λ/2 (180°): drin nur Detektor 2
});
test('dcergebnis: ohneProtokoll, zeigt beide Diagramme aus der Quelle', async () => {
  const u = umgebung(feld('dcergebnis', 'delayed-choice/k3-erg/erg-anzeige', { quelle: LAUF }));
  const s = await u.FX.store.oeffne('k'); await u.FX.felder.start(s);
  const el = u.w.document.querySelector('.fx-feld'), H = u.FX.felder.arten.dcergebnis; H.init(el);
  assert.strictEqual(H.ohneProtokoll, true); assert.strictEqual(H.begonnen, undefined);
  assert.strictEqual(el.querySelectorAll('svg').length, 2); assert.match(el.textContent, /Kein Messdurchlauf vorhanden/);
  assert.strictEqual(el.querySelector('[data-o="lauf"]'), null);
  const run = Array.from({ length: 37 }, (_, i) => ({ phi: i * 10, in: { n: 500, k1: 250, k2: 250 }, out: { n: 500, k1: 250, k2: 250 } }));
  await s.schreibe(LAUF, { run }); u.w.document.dispatchEvent(new u.w.CustomEvent('fx:geaendert', { detail: { id: LAUF } })); await warte(30);
  assert.ok(!/Kein Messdurchlauf vorhanden/.test(el.textContent)); assert.strictEqual(H.leer(plain(H.wert(el))), false);
  assert.ok(!/Kein Messdurchlauf vorhanden/.test(el.textContent) && el.querySelectorAll('circle').length > 0);
});
test('zitat zeigt den Text der Hypothese; Stift-Antwort ohne Stiftfeld: Hinweis', async () => {
  const u = umgebung(feld('zitat', 'delayed-choice/k3-deut/zitat', { quelle: HYP }));
  const s = await u.FX.store.oeffne('k'); await u.FX.felder.start(s);
  const el = u.w.document.querySelector('.fx-feld'), H = u.FX.felder.arten.zitat; H.init(el);
  const ein = async (v) => { await s.schreibe(HYP, v); u.w.document.dispatchEvent(new u.w.CustomEvent('fx:geaendert', { detail: { id: HYP } })); await warte(30); };
  assert.match(el.querySelector('blockquote').textContent, /Keine Vorhersage eingetragen/);
  await ein({ text: 'Bei drin erwarten wir Interferenz.' });
  assert.strictEqual(el.querySelector('blockquote').textContent, 'Bei drin erwarten wir Interferenz.'); assert.strictEqual(H.ohneProtokoll, true);
  delete u.FX.stiftfeld;
  await ein({ text: '', striche: [{ farbe: '#000', breite: 2, punkte: [[0.1, 10], [0.2, 20]] }], modus: 'stift', hoehe: 240 });
  assert.match(el.querySelector('blockquote').textContent, /\(mit Stift geschrieben, siehe Protokoll\)/);
  assert.strictEqual(H.leer(plain(H.wert(el))), false);
});
