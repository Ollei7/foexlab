const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, ladeDatei, mitDb, plain, warte } = require('../helfer');

const TEXT = '<p>Phasendifferenz kurz</p><h4>Phasensprünge Schritt für Schritt</h4><p>Phasensprünge Aufgabe</p><h4>Phasendifferenz</h4><p>Phasendifferenz Aufgabe</p>';
function feld(art, id, konfig) {
  return `<div class="fx-feld" data-fx-id="${id}" data-fx-art="${art}" data-fx-titel="T"${konfig ? " data-fx-konfig='" + JSON.stringify(konfig) + "'" : ''}><div class="qtext">${art === 'phasendifferenz' ? TEXT : ''}</div><div class="fx-werkzeug-flaeche"></div></div>`;
}
function umgebung(html) {
  const w = mitDb(dom(html)); const FX = lade(w, 'store', 'felder');
  ladeDatei(w, 'kurse/mzi/werkzeuge/mzikern.js');
  ladeDatei(w, 'kurse/mzi/werkzeuge/phasendifferenz.js');
  ladeDatei(w, 'kurse/mzi/werkzeuge/spiegel.js');
  return { w, FX, M: FX.mzi };
}
function phase() {
  const u = umgebung(feld('phasendifferenz', 'drei-aufbauten/k1-a3/pd'));
  const el = u.w.document.querySelector('.fx-feld'), H = u.FX.felder.arten.phasendifferenz; H.init(el);
  let n = 0; el.addEventListener('change', (e) => { if (e.target === el) n++; });
  const waehle = (sel, v) => { const s = el.querySelector(sel); s.value = v; s.dispatchEvent(new u.w.Event('change', { bubbles: true })); };
  const kurz = (a, b) => { waehle('[data-pd="kurz-0"]', a); waehle('[data-pd="kurz-1"]', b); el.querySelector('[data-pruefe="kurz"]').click(); };
  const tab = (zeilen) => { zeilen.forEach((r, i) => r.forEach((v, j) => waehle(`[data-pt="${i}-${j}"]`, v))); el.querySelector('[data-pruefe="tabelle"]').click(); };
  const diff = (a, b) => { waehle('[data-pd="diff-0"]', a); waehle('[data-pd="diff-1"]', b); el.querySelector('[data-pruefe="diff"]').click(); };
  const RICHTIG = [['0', 'π', 'π/2', '3π/2'], ['0', 'π', '0', 'π'], ['π/2', 'π', '0', '3π/2'], ['π/2', 'π', 'π/2', '2π']];
  return Object.assign(u, { el, H, kurz, tab, diff, waehle, RICHTIG, wert: () => plain(H.wert(el)), aenderungen: () => n,
    sichtbar: (s) => { const e = el.querySelector(s); return !!e && !e.closest('[hidden]'); } });
}
function spiegel() {
  const u = umgebung(feld('spiegel', 'drei-aufbauten/k1-phase/ph-mess'));
  const el = u.w.document.querySelector('.fx-feld'), H = u.FX.felder.arten.spiegel; H.init(el);
  let n = 0; el.addEventListener('change', () => n++);
  const regler = el.querySelector('input[type=range]');
  const setzePhi = (v) => { regler.value = v; regler.dispatchEvent(new u.w.Event('input', { bubbles: true })); };
  const messe = async (phi) => { if (phi !== undefined) setzePhi(phi); el.querySelector('[data-o="messen"]').click(); await warte(1000); };
  return Object.assign(u, { el, H, regler, setzePhi, messe, wert: () => plain(H.wert(el)), aenderungen: () => n });
}

test('phasendifferenz: Text wird an den h4 geteilt, Umweg verborgen', () => {
  const { el, sichtbar } = phase();
  assert.strictEqual(el.querySelectorAll('.qtext h4').length, 0);
  assert.match(el.querySelector('.qtext').textContent, /Phasendifferenz kurz/);
  assert.match(el.textContent, /Phasensprünge Aufgabe/); assert.match(el.textContent, /Phasendifferenz Aufgabe/);
  assert.strictEqual(sichtbar('[data-pt="0-0"]'), false); assert.strictEqual(sichtbar('[data-pd="diff-0"]'), false);
  assert.strictEqual(sichtbar('[data-pd="kurz-0"]'), true);
});
test('phasendifferenz: Kurzantwort richtig (0, π) → direkt, erledigt, keine Tabelle', () => {
  const { H, kurz, wert, sichtbar, aenderungen } = phase();
  assert.strictEqual(H.leer(wert()), true);
  kurz('0', 'π');
  const w = wert(); assert.strictEqual(w.direkt, true); assert.strictEqual(w.kurzGeprueft, true);
  assert.deepStrictEqual(w.kurz, ['0', 'π']);
  assert.strictEqual(H.leer(w), false); assert.strictEqual(sichtbar('[data-pt="0-0"]'), false);
  assert.ok(aenderungen() >= 1);
});
test('phasendifferenz: Kurzantwort falsch → Tabelle erscheint, noch nicht erledigt, Kurzabfrage gesperrt', () => {
  const { el, H, kurz, wert, sichtbar } = phase();
  kurz('π', 'π');
  const w = wert(); assert.strictEqual(w.direkt, false); assert.strictEqual(H.leer(w), true);
  assert.strictEqual(sichtbar('[data-pt="0-0"]'), true);
  assert.strictEqual(el.querySelector('[data-pd="kurz-0"]').disabled, true); assert.strictEqual(el.querySelector('[data-pruefe="kurz"]').disabled, true);
  assert.match(el.querySelector('[data-o="msg-kurz"]').textContent, /Schritt für Schritt/);
});
test('phasendifferenz: Kurzabfrage nicht ausgefüllt wird nicht geprüft', () => {
  const { el, wert } = phase();
  el.querySelector('[data-pruefe="kurz"]').click();
  assert.strictEqual(wert().kurzGeprueft, false); assert.match(el.querySelector('[data-o="msg-kurz"]').textContent, /Bitte zuerst/);
});
test('phasendifferenz: Tabelle mit Fehler in Möglichkeit 3 → Meldung nennt 3', () => {
  const { el, kurz, tab, RICHTIG, wert } = phase();
  kurz('π', 'π');
  const f = RICHTIG.map((r) => r.slice()); f[2][1] = '0';
  tab(f);
  assert.match(el.querySelector('[data-o="msg-tabelle"]').textContent, /Möglichkeit 3\b/);
  assert.doesNotMatch(el.querySelector('[data-o="msg-tabelle"]').textContent, /Möglichkeiten/);
  assert.strictEqual(wert().tabelleOk, false);
  const g = RICHTIG.map((r) => r.slice()); g[0][3] = '0'; g[2][3] = '0';
  tab(g); assert.match(el.querySelector('[data-o="msg-tabelle"]').textContent, /Möglichkeiten 1 und 3/);
});
test('phasendifferenz: Tabelle richtig, dann Δφ richtig → erledigt; falsches Δφ gibt Hinweis', () => {
  const { el, H, kurz, tab, diff, RICHTIG, wert, sichtbar } = phase();
  kurz('π', '0');
  assert.strictEqual(sichtbar('[data-pd="diff-0"]'), false);
  tab(RICHTIG); assert.strictEqual(wert().tabelleOk, true); assert.strictEqual(sichtbar('[data-pd="diff-0"]'), true);
  assert.strictEqual(H.leer(wert()), true);
  diff('0', '0'); assert.match(el.querySelector('[data-o="msg-diff"]').textContent, /Differenz der Summen/);
  assert.strictEqual(wert().diffOk, false); assert.strictEqual(H.leer(wert()), true);
  diff('0', 'π'); assert.strictEqual(wert().diffOk, true); assert.strictEqual(H.leer(wert()), false);
  assert.strictEqual(el.querySelector('[data-pd="diff-0"]').disabled, true);
});
test('phasendifferenz: Tabelle bietet 0, π/2, π für Bauteile und sechs Werte für die Summe', () => {
  const { el } = phase();
  const opts = (s) => Array.from(el.querySelectorAll(`[data-pt="${s}"] option`)).map((o) => o.textContent);
  assert.deepStrictEqual(opts('1-0'), ['–', '0', 'π/2', 'π']);
  assert.deepStrictEqual(opts('1-3'), ['–', '0', 'π/2', 'π', '3π/2', '2π', '5π/2']);
  assert.deepStrictEqual(Array.from(el.querySelectorAll('[data-pd="kurz-0"] option')).map((o) => o.textContent), ['–', '0', 'π/2', 'π', '3π/2', '2π']);
});
test('phasendifferenz: laden stellt Zustand wieder her, Protokoll, ungültige Werte', () => {
  const { el, H, wert, RICHTIG, sichtbar } = phase();
  const tabelle = {}; RICHTIG.forEach((r, i) => r.forEach((v, j) => { tabelle[i + '-' + j] = v; }));
  const stand = { kurz: ['π', 'π'], kurzGeprueft: true, direkt: false, tabelle, tabelleOk: true, diff: ['0', 'π'], diffOk: true };
  H.laden(el, stand); assert.deepStrictEqual(wert(), stand); assert.strictEqual(H.leer(wert()), false);
  assert.strictEqual(sichtbar('[data-pt="0-0"]'), true); assert.strictEqual(sichtbar('[data-pd="diff-0"]'), true);
  assert.strictEqual(el.querySelector('[data-pt="0-0"]').disabled, true);
  const p = plain(H.protokoll(el, stand)); assert.deepStrictEqual(p.map((t) => t.typ), ['text', 'tabelle', 'text']);
  assert.strictEqual(p[1].zeilen.length, 4); assert.match(p[0].text, /π/);
  assert.deepStrictEqual(plain(H.protokoll(el, { kurz: ['0', 'π'], kurzGeprueft: true, direkt: true })).map((t) => t.typ), ['text']);
  H.laden(el, { kurz: ['x', 'π'], kurzGeprueft: true, direkt: true, tabelleOk: true, diffOk: true });
  assert.deepStrictEqual(wert().kurz, ['', 'π']); assert.strictEqual(wert().direkt, null);
  assert.strictEqual(wert().tabelleOk, false); assert.strictEqual(wert().diffOk, false);
});

function schirm() {
  const u = umgebung(feld('phasendifferenz', 'drei-aufbauten/k2/pd', { modus: 'schirm' }));
  const el = u.w.document.querySelector('.fx-feld'), H = u.FX.felder.arten.phasendifferenz; H.init(el);
  let n = 0; el.addEventListener('change', (e) => { if (e.target === el) n++; });
  const waehle = (sel, v) => { const s = el.querySelector(sel); s.value = v; s.dispatchEvent(new u.w.Event('change', { bubbles: true })); };
  const tab = (zeilen) => { zeilen.forEach((r, i) => r.forEach((v, j) => waehle(`[data-pt="${i}-${j}"]`, v))); el.querySelector('[data-pruefe="tabelle"]').click(); };
  const diff = (a, b) => { waehle('[data-pd="diff-0"]', a); waehle('[data-pd="diff-1"]', b); el.querySelector('[data-pruefe="diff"]').click(); };
  const RICHTIG = [['0', 'π', 'π/2', '3π/2'], ['0', 'π', '0', 'π'], ['π/2', 'π', '0', '3π/2'], ['π/2', 'π', 'π/2', '2π']];
  return Object.assign(u, { el, H, tab, diff, RICHTIG, wert: () => plain(H.wert(el)), aenderungen: () => n,
    sichtbar: (s) => { const e = el.querySelector(s); return !!e && !e.closest('[hidden]'); } });
}

test('laser: Laser und Schirme, keine Detektoren, keine var(', () => {
  const { M } = umgebung(feld('phasendifferenz', 'x'));
  const s = M.aufbauSVG('laser', {});
  assert.ok(s.startsWith('<svg')); assert.ok(s.includes('viewBox="0 0 820 460"'));
  assert.ok(s.includes('>Laser<')); assert.ok(s.includes('Schirm 1')); assert.ok(s.includes('Schirm 2'));
  assert.ok(s.includes('Spiegel 1') && s.includes('Spiegel 2') && s.includes('Strahlteiler 2'));
  assert.ok(!s.includes('Detektor')); assert.ok(!s.includes('Einzelphoton')); assert.ok(!s.includes('var('));
  assert.ok(!/class="/.test(s.replace('class="mzi-svg"', '')));
  assert.ok(!/<(line|path)[^>]*class="(beam|strahl)/.test(s));
});
test('schirm: Tabelle sofort sichtbar, Skizze, keine Kurzabfrage; Fehler in Weg 3 nennt Weg 3', () => {
  const { el, tab, RICHTIG, wert, sichtbar } = schirm();
  assert.strictEqual(sichtbar('[data-pt="0-0"]'), true); assert.strictEqual(sichtbar('[data-pd="diff-0"]'), false);
  assert.strictEqual(sichtbar('[data-pd="kurz-0"]'), false);
  assert.ok(el.querySelector('.fx-werkzeug-flaeche svg.mzi-svg'));
  assert.match(el.textContent, /Weg 1/); assert.match(el.textContent, /über Spiegel 2, zu Schirm 1/);
  assert.match(el.querySelector('.qtext').textContent, /Phasendifferenz kurz/);
  const f = RICHTIG.map((r) => r.slice()); f[2][1] = '0'; tab(f);
  const m = () => el.querySelector('[data-o="msg-tabelle"]').textContent;
  assert.match(m(), /^Prüft noch einmal Weg 3\.$/); assert.strictEqual(wert().tabelleOk, false);
  const g = RICHTIG.map((r) => r.slice()); g[0][3] = '0'; g[1][3] = '0'; g[3][3] = '0'; tab(g);
  assert.match(m(), /^Prüft noch einmal die Wege 1, 2 und 4\.$/);
});
test('schirm: Tabelle richtig, dann Δφ (0, π) → erledigt, Reload stellt Zustand her', () => {
  const { el, H, tab, diff, RICHTIG, wert, sichtbar, aenderungen } = schirm();
  assert.strictEqual(H.leer(wert()), true);
  tab(RICHTIG); assert.strictEqual(wert().tabelleOk, true); assert.strictEqual(sichtbar('[data-pd="diff-0"]'), true);
  assert.match(el.textContent, /Phasendifferenz Aufgabe/); assert.strictEqual(H.leer(wert()), true);
  diff('0', '0'); assert.match(el.querySelector('[data-o="msg-diff"]').textContent, /beiden Wege, die zu ihm führen/);
  assert.strictEqual(H.leer(wert()), true);
  diff('0', 'π'); assert.strictEqual(H.leer(wert()), false); assert.ok(aenderungen() >= 3);
  const w = wert(); assert.strictEqual(w.diffOk, true);
  const u2 = schirm(); u2.H.laden(u2.el, w);
  assert.deepStrictEqual(u2.wert(), w); assert.strictEqual(u2.H.leer(u2.wert()), false);
  assert.strictEqual(u2.sichtbar('[data-pd="diff-1"]'), true); assert.strictEqual(u2.el.querySelector('[data-pt="0-0"]').disabled, true);
  const p = plain(u2.H.protokoll(u2.el, w)); assert.deepStrictEqual(p.map((t) => t.typ), ['tabelle', 'text']);
  assert.match(p[0].zeilen[0][0], /Weg 1/);
});
test('ohne modus: Verhalten wie bisher', () => {
  const { el, sichtbar } = phase();
  assert.strictEqual(sichtbar('[data-pd="kurz-0"]'), true); assert.strictEqual(sichtbar('[data-pt="0-0"]'), false);
  assert.strictEqual(el.querySelectorAll('.mzi-skizze-klein svg').length, 2);   // Skizze Aufbau 3 oben und über der Tabelle
  assert.match(el.textContent, /Möglichkeit 1/); assert.doesNotMatch(el.textContent, /Weg 1/);
});

test('spiegel: Regler in 10°-Schritten 0–360', () => {
  const { regler } = spiegel();
  assert.deepStrictEqual([regler.min, regler.max, regler.step], ['0', '360', '10']);
});
test('spiegel: 4 verschiedene Δφ → leer, 5 → erledigt; begonnen ab der ersten Messung', async () => {
  const { H, messe, wert, el, aenderungen } = spiegel();
  assert.strictEqual(H.begonnen(wert()), false);
  await messe(0); assert.strictEqual(H.begonnen(wert()), true); assert.strictEqual(aenderungen(), 1);
  await messe(0);
  for (const phi of [90, 180, 270]) await messe(phi);
  assert.strictEqual(wert().log.length, 5); assert.strictEqual(H.leer(wert()), true);
  assert.match(el.textContent, /4 von 5/);
  await messe(360); assert.strictEqual(H.leer(wert()), false);
  const r = wert().log[0]; assert.deepStrictEqual([r.phi, r.n, r.k1 + r.k2], [0, 1000, 1000]);
  assert.strictEqual(wert().log[0].k2, 0);   // bei 0° klickt nur Detektor 1
}, { timeout: 15000 });
test('spiegel: Knöpfe und Regler während der Messung gesperrt, change erst am Ende', async () => {
  const { el, regler, setzePhi, aenderungen } = spiegel();
  setzePhi(180); el.querySelector('[data-o="messen"]').click();
  assert.strictEqual(el.querySelector('[data-o="messen"]').disabled, true); assert.strictEqual(regler.disabled, true);
  assert.strictEqual(aenderungen(), 0); await warte(1000);
  assert.strictEqual(aenderungen(), 1); assert.strictEqual(regler.disabled, false);
  assert.strictEqual(el.querySelectorAll('[data-o="tabelle"] tbody tr').length, 1);
  assert.deepStrictEqual(Array.from(el.querySelectorAll('[data-o="tabelle"] tbody tr')[0].children).slice(0, 4).map((c) => c.textContent).slice(0, 2), ['180°', '1000']);
});
test('spiegel: Diagramm, Theorie, laden und Protokoll', () => {
  const { el, H, wert } = spiegel();
  const stand = { log: [{ phi: 0, n: 1000, k1: 1000, k2: 0 }, { phi: 180, n: 1000, k1: 0, k2: 1000 }, { phi: 180, n: 1000, k1: 10, k2: 990 }] };
  H.laden(el, stand); assert.deepStrictEqual(wert(), stand);
  const svg = () => el.querySelector('[data-o="diagramm"]').innerHTML;
  assert.ok(svg().includes('<svg')); assert.doesNotMatch(svg(), /stroke-dasharray="7 5"/);
  const box = el.querySelector('input[type=checkbox]'); box.checked = true; box.dispatchEvent(new el.ownerDocument.defaultView.Event('change'));
  assert.match(svg(), /stroke-dasharray="7 5"/);
  const p = plain(H.protokoll(el, stand));
  assert.strictEqual(p[0].typ, 'tabelle'); assert.strictEqual(p[0].zeilen.length, 3); assert.strictEqual(p[1].typ, 'grafik');
  assert.doesNotMatch(p[1].svg, /stroke-dasharray="7 5"/); assert.doesNotMatch(p[1].svg, /var\(/);
  assert.strictEqual(H.hypothese, undefined);
});
test('spiegel: Hypothese wird nach der ersten Messung festgehalten', async () => {
  const html = '<div class="fx-karte" data-karte="d/k" data-abschnitt-id="d"><div class="fx-feld" data-fx-id="d/k/h" data-fx-art="vermutung"><textarea></textarea></div>' + feld('spiegel', 'd/k/m') + '</div>';
  const u = umgebung(html); const d = u.w.document;
  const s = await u.FX.store.oeffne('k'); await u.FX.felder.start(s);
  const h = d.querySelector('[data-fx-id="d/k/h"]'), m = d.querySelector('[data-fx-id="d/k/m"]');
  h.querySelector('textarea').value = 'x';
  assert.ok(!h.hasAttribute('data-fx-festgehalten'));
  m.querySelector('[data-o="messen"]').click(); await warte(1000);
  assert.ok(h.hasAttribute('data-fx-festgehalten'));
  assert.strictEqual(u.FX.felder.arten.spiegel.leer(plain(u.FX.felder.arten.spiegel.wert(m))), true);
});
