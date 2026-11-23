const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, ladeDatei, plain } = require('../helfer');

function kernMitFenster() {
  const w = dom(); lade(w, 'store', 'felder');
  const FX = ladeDatei(w, 'kurse/mzi/werkzeuge/mzikern.js');
  return { M: FX.mzi, w };
}
const M = kernMitFenster().M;
const folge = (liste) => { let i = 0; return () => liste[i++ % liste.length]; };

test('pD1: ohne Strahlteiler ½, mit cos²(Δφ/2)', () => {
  assert.strictEqual(M.pD1(false, 90), 0.5); assert.strictEqual(M.pD1(true, 0), 1);
  assert.ok(Math.abs(M.pD1(true, 180)) < 1e-12); assert.ok(Math.abs(M.pD1(true, 90) - 0.5) < 1e-12);
});
test('binom mit fester Folge', () => assert.strictEqual(M.binom(4, 0.5, folge([0.1, 0.9, 0.2, 0.6])), 2));
test('einzel: Wahl und Detektor aus den Zufallszahlen', () => {
  assert.deepStrictEqual(plain(M.einzel(0, folge([0.1, 0.1]))), { c: 'in', d: 1 });
  assert.deepStrictEqual(plain(M.einzel(180, folge([0.1, 0.9]))), { c: 'in', d: 2 });
  assert.deepStrictEqual(plain(M.einzel(90, folge([0.9, 0.4]))), { c: 'out', d: 1 });
  assert.deepStrictEqual(plain(M.einzel(90, folge([0.9, 0.6]))), { c: 'out', d: 2 });
});
test('messreihe: 1000 Photonen, Summen stimmen', () => {
  const m = M.messreihe(0);
  assert.strictEqual(m.phi, 0);
  assert.strictEqual(m.in.n + m.out.n, 1000);
  assert.strictEqual(m.in.k1 + m.in.k2, m.in.n); assert.strictEqual(m.out.k1 + m.out.k2, m.out.n);
  assert.strictEqual(m.in.k2, 0);   // Δφ = 0, drin: nie D2
});
test('messreihe: draußen ist D1/D2 etwa gleich häufig', () => {
  const m = M.messreihe(90, folge([0.3, 0.2, 0.7, 0.8]));
  assert.strictEqual(m.in.n + m.out.n, 1000);
});
test('aufbauSVG zeichnet keine Strahlengänge', () => {
  for (const mo of ['a1', 'a2', 'a3', 'dc']) {
    const s = M.aufbauSVG(mo, {});
    assert.ok(s.startsWith('<svg')); assert.ok(s.includes('viewBox="0 0 820 460"'));
    assert.ok(!/<(line|path)[^>]*class="(beam|strahl)/.test(s));
  }
});
test('aufbauSVG a1 ohne Spiegel, a3 mit Strahlteiler 2', () => {
  const a1 = M.aufbauSVG('a1', {}), a2 = M.aufbauSVG('a2', {}), a3 = M.aufbauSVG('a3', {});
  assert.ok(!a1.includes('Spiegel 1')); assert.ok(a2.includes('Spiegel 1'));
  assert.ok(!a1.includes('Strahlteiler 2')); assert.ok(!a2.includes('Strahlteiler 2')); assert.ok(a3.includes('Strahlteiler 2'));
  assert.ok(a2.includes('hier kein Strahlteiler'));
});
test('aufbauSVG dc: Zufallsgenerator und Auswahl', () => {
  assert.ok(M.aufbauSVG('dc', { choice: 'in' }).includes('Strahlteiler 2: drin'));
  assert.ok(M.aufbauSVG('dc', { choice: 'out' }).includes('Strahlteiler 2: draußen'));
  assert.ok(M.aufbauSVG('dc', {}).includes('wartet'));
});
test('zwei SVGs auf einer Seite haben verschiedene Filter-IDs', () => {
  const id = (s) => /<filter id="([^"]+)"/.exec(s)[1];
  const a = M.aufbauSVG('a3', {}), b = M.aufbauSVG('a3', {});
  assert.notStrictEqual(id(a), id(b));
  assert.ok(a.includes('url(#' + id(a) + ')'));
  assert.ok(/<pattern id="([^"]+)"/.test(a));
});
test('EINST enthält die Schwellen der Spec', () => assert.deepStrictEqual(plain(M.EINST), {
  AUFBAU_PHOTONEN: 5000, SPIEGEL_PHASEN: 5, SPIEGEL_PHOTONEN: 1000, EINZEL: 10, MW_PHOTONEN: 1000,
  S2_REIHEN: 3, S3_PHASEN: 3, S3_JE: 2, REGLER_SCHRITT: 22.5, LAUF_SCHRITT: 22.5, LAUF_MS: 400 }));
test('polSkizzeSVG und Diagramme liefern SVG', () => {
  assert.ok(M.polSkizzeSVG().startsWith('<svg'));
  assert.ok(M.ratenSVG([], []).includes('Noch keine Messwerte.'));
  assert.ok(M.ratenSVG([[0, 500]], [[0, 0]]).includes('<circle'));
  assert.ok(M.haeufigkeitSVG([{ label: 'x', n: 0, k1: 0, k2: 0 }]).includes('Noch keine Messung.'));
  assert.ok(M.haeufigkeitSVG([{ label: 'x', n: 10, k1: 5, k2: 5 }]).includes('50 %'));
  assert.ok(M.balkenSVG(3, 1, [50, 50]).includes('75 %'));
  assert.ok(M.balkenSVG(0, 0).includes('Noch keine Messung.'));
});
test('fitSin trifft eine Kosinuskurve', () => {
  const pts = []; for (let p = 0; p <= 360; p += 30) pts.push([p, 300 + 200 * Math.cos(p * Math.PI / 180)]);
  const f = M.fitSin(pts); assert.ok(Math.abs(f(0) - 500) < 1e-6); assert.ok(Math.abs(f(180) - 100) < 1e-6);
});
test('hochzaehlen zählt bis zum Endstand', async () => {
  const st = []; await M.hochzaehlen(10, 20, 30, 40, 30, (c1, c2, d) => st.push([c1, c2, d]));
  assert.deepStrictEqual(st[st.length - 1], [40, 60, 0]);
});
test('zeitleiste: Schritte, Auswahl und Detektor', () => {
  const t = M.zeitleiste();
  t.setze(2, 'Strahlteiler 2 drin');
  assert.strictEqual(t.el.querySelectorAll('.on').length, 3);
  assert.ok(t.el.textContent.includes('Strahlteiler 2 drin'));
  t.setze(3, undefined, 'Klick an Detektor 1'); assert.strictEqual(t.el.querySelectorAll('.on').length, 4);
  t.setze(-1); assert.strictEqual(t.el.querySelectorAll('.on').length, 0);
  assert.ok(t.el.textContent.includes('drin oder draußen?'));
});
test('phaseRegler: Wert, Änderung, Sperre', () => {
  let got = null; const r = M.phaseRegler(0, (v) => { got = v; });
  const inp = r.el.querySelector('input'); assert.strictEqual(inp.step, '22.5');
  r.setze(90); assert.strictEqual(inp.value, '90'); assert.ok(r.el.textContent.includes('λ/4'));
  inp.value = '120'; inp.dispatchEvent(new inp.ownerDocument.defaultView.Event('input', { bubbles: true }));
  assert.strictEqual(got, 120);
  r.sperre(true); assert.strictEqual(inp.disabled, true);
});
test('h, melde, konfig, lies', async () => {
  const { M: K, w } = kernMitFenster();
  const el = K.h('div', { 'data-fx-konfig': '{"a":1}', class: 'x' }, 'Text');
  assert.deepStrictEqual(plain(K.konfig(el)), { a: 1 }); assert.deepStrictEqual(plain(K.konfig(K.h('div'))), {});
  let n = 0; w.document.body.addEventListener('change', () => n++); w.document.body.appendChild(el); K.melde(el);
  assert.strictEqual(n, 1);
  assert.strictEqual(await K.lies('gibt-es-nicht'), undefined);
});
test('Stil-Block wird einmal eingefügt', () => {
  const { w } = kernMitFenster(); ladeDatei(w, 'kurse/mzi/werkzeuge/mzikern.js');
  assert.strictEqual(w.document.head.querySelectorAll('style#mzi-stil').length, 1);
});
test('alle SVG-Erzeuger: Farben und Schrift als Attribute (PDF-tauglich), keine var() und keine svg-Klassen', () => {
  const pts = [[0, 500], [90, 250], [180, 0]];
  const alle = [
    ...['a1', 'a2', 'a3', 'dc'].map((m) => M.aufbauSVG(m, { c1: 3, c2: 4, d: 1, src: true, choice: 'in', phaseOn: true, phi: 90, detLabel: 'x' })),
    M.aufbauSVG('dc', { choice: 'out' }), M.aufbauSVG('dc', {}), M.polSkizzeSVG(), M.aufbauSVG('laser', {}),
    M.diagrammSVG({ ymax: 500, series: [{ name: 'D1', color: M.P.cAB, shape: 'circle', pts }], yticks: [0, 1], yfmt: (v) => v, ylabel: 'y', leer: 'leer' }),
    M.ratenSVG([], []), M.ratenSVG(pts, pts), M.haeufigkeitSVG([{ label: 'x', n: 0, k1: 0, k2: 0 }]),
    M.haeufigkeitSVG([{ label: 'x', n: 10, k1: 5, k2: 5 }]), M.balkenSVG(3, 1, [50, 50]), M.balkenSVG(0, 0)
  ];
  for (const s of alle) {
    assert.ok(s.startsWith('<svg'));
    assert.ok(!s.includes('var('), 'var( in SVG'); assert.ok(!/class="(svg-|dev|wire)/.test(s), 'svg-Klasse'); assert.ok(!/class="[^"]*\b(svg-|dev|wire)/.test(s));
  }
  assert.ok(M.balkenSVG(3, 1, [50, 50]).includes('fill="' + M.P.cAB + '"'));
});

const ALLE_SVG = () => {
  const pts = [[0, 500], [90, 250], [180, 0]], st = { c1: 3, c2: 4, d: 1, src: true, phaseOn: true, phi: 90, detLabel: 'x' };
  return [
    ...['a1', 'a2', 'a3'].map((m) => M.aufbauSVG(m, st)),
    ...[null, 'in', 'out'].map((c) => M.aufbauSVG('dc', Object.assign({}, st, { choice: c }))), M.aufbauSVG('dc', {}),
    M.polSkizzeSVG(), M.aufbauSVG('laser', {}),
    M.diagrammSVG({ ymax: 500, series: [{ name: 'D1', color: M.P.cAB, shape: 'circle', pts, theory: (p) => 250 }], yticks: [0, 500], ylabel: 'y' }),
    M.ratenSVG([], []), M.ratenSVG(pts, pts), M.haeufigkeitSVG([{ label: 'x', n: 0, k1: 0, k2: 0 }]),
    M.haeufigkeitSVG([{ label: 'x', n: 10, k1: 5, k2: 5 }]), M.balkenSVG(3, 1, [50, 50]), M.balkenSVG(0, 0)
  ];
};
test('kein SVG-Erzeuger lässt ${ unaufgelöst stehen; Strahlteiler-Diagonale ist da', () => {
  for (const s of ALLE_SVG()) assert.ok(!s.includes('${'), 'unaufgelöstes ${');
  assert.ok(M.aufbauSVG('a1', {}).includes('x1="-17" y1="-17" x2="17" y2="17" stroke="' + M.P.navy + '"'));
});
test('jede SVG-Ausgabe ist wohlgeformtes XML (kein parsererror)', () => {
  const w = dom();
  for (const s of ALLE_SVG()) {
    const d = new w.DOMParser().parseFromString(s, 'image/svg+xml');
    assert.strictEqual(d.getElementsByTagName('parsererror').length, 0, s.slice(0, 80));
  }
});
