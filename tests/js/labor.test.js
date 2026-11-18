// Labormodus: neue helle Farben (Festhalten, Kontrollfragen, Lehrkraft, mzi-Werkzeuge) haben dunkle Gegenstücke.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { dom, lade, ladeDatei } = require('./helfer');

const CSS = ['basis', 'bausteine', 'labor'].map((n) => fs.readFileSync(path.join(__dirname, '..', '..', 'engine', 'web', 'css', n + '.css'), 'utf8')).join('\n');
function rgb(s) { const m = /rgba?\(([^)]+)\)/.exec(s || ''); if (!m) return null; const t = m[1].split(',').map(Number); return t.length > 3 && t[3] === 0 ? null : t.slice(0, 3); }
function lum(c) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }
function kontrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
/* Hintergrund: eigener oder der des nächsten Vorfahren mit Hintergrund */
function grund(w, el) { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const b = rgb(w.getComputedStyle(e).backgroundColor); if (b) return b; } return [255, 255, 255]; }
function umgebung(html) {
  const w = dom(html);
  const st = w.document.createElement('style'); st.textContent = CSS; w.document.head.appendChild(st);
  w.document.documentElement.setAttribute('data-labor', '1');
  return w;
}

test('Labormodus: Festhalten, Hinweise, Kontrollfrage und Lehrkraft-Kasten gut lesbar', () => {
  const w = umgebung(`<div class="fx-karte"><div class="fx-feld" data-fx-festgehalten="1"><div class="q"><textarea>Text</textarea></div>
<p class="fx-festhinweis">Festgehalten</p><p class="fx-sperrhinweis">Gesperrt</p></div>
<div class="q"><div class="fx-nach-versuchen">Die richtige Antwort ist markiert.</div><div class="res fx-aufgeloest">Lösung angezeigt</div></div>
<div class="fx-lehrkraft"><p>Leitfragen</p></div></div>`);
  w.document.body.classList.add('fx-betreuung');
  for (const sel of ['textarea', '.fx-festhinweis', '.fx-sperrhinweis', '.fx-nach-versuchen', '.res.fx-aufgeloest', '.fx-lehrkraft p']) {
    const el = w.document.querySelector(sel), k = kontrast(rgb(w.getComputedStyle(el).color), grund(w, el));
    assert.ok(k >= 4.5, sel + ': Kontrast ' + k.toFixed(2));
    assert.ok(lum(grund(w, el)) < 0.1, sel + ': Hintergrund ist hell');
  }
});

test('Labormodus: Zähler, Beschriftungen und Sortier-Zeilen der mzi-Werkzeuge', () => {
  const w = umgebung(`<div class="fx-karte"><div class="mzi-zelle"><div class="mzi-k">Detektor 1</div><div class="mzi-n">12</div><div class="mzi-r">40 %</div></div>
<div class="mzi-regler"><label>Δφ</label><output>90°</output></div><div class="mzi-diagramme"><h4>drin</h4></div>
<div class="mzi-zeitleiste"><div class="on">1 Aussendung<small>Quelle</small></div></div><p class="mzi-hinweis">Hinweis</p>
<div class="mzi-zitat">Zitat</div><div class="mzi-sortieren"><table><tbody><tr class="ok"><td>1</td></tr></tbody></table></div></div>`);
  lade(w, 'store', 'felder'); ladeDatei(w, 'kurse/mzi/werkzeuge/mzikern.js'); ladeDatei(w, 'kurse/mzi/werkzeuge/dcsortieren.js');
  for (const sel of ['.mzi-k', '.mzi-n', '.mzi-r', '.mzi-regler label', '.mzi-regler output', '.mzi-diagramme h4', '.mzi-zeitleiste .on', '.mzi-zeitleiste small', '.mzi-hinweis', '.mzi-zitat', 'tr.ok td']) {
    const el = w.document.querySelector(sel), k = kontrast(rgb(w.getComputedStyle(el).color), grund(w, el));
    assert.ok(k >= 4.5, sel + ': Kontrast ' + k.toFixed(2));
    assert.ok(lum(grund(w, el)) < 0.1, sel + ': Hintergrund ist hell');
  }
});

test('Labormodus: Feldüberschriften sind hell, Vermutung rosé, Ziehen-Rahmen lesbar', () => {
  const w = umgebung(`<div class="fx-karte"><div class="q"><div class="qhead"><span class="qnum">1</span><span class="qname">Materialliste</span></div></div>
<div class="q fx-vermutung"><div class="qhead"><span class="qname">Vermutung</span></div></div></div>`);
  for (const sel of ['.qhead', '.qname', '.fx-vermutung .qname']) {
    const el = w.document.querySelector(sel), k = kontrast(rgb(w.getComputedStyle(el).color), grund(w, el));
    assert.ok(k >= 4.5, sel + ': Kontrast ' + k.toFixed(2));
  }
  assert.ok(/data-labor="1"\] \.fx-ziehen \.spot:has\(select\.ok\)/.test(CSS), 'Ziehen ok-Rahmen');
  assert.ok(/data-labor="1"\] \.fx-ziehen \.spot:has\(select\.bad\)/.test(CSS), 'Ziehen bad-Rahmen');
});
