// Werkzeuge der Fassung v3: „gangunterschied“ (Kapitel 4), „vergleich“ und „koinzidenz“ (Kapitel 5), Anzeige Δs im Kern
const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, ladeDatei, mitDb, plain } = require('../helfer');

function feld(art, id) {
  return `<div class="fx-feld" data-fx-id="${id}" data-fx-art="${art}" data-fx-titel="T"><div class="qtext"></div><div class="fx-werkzeug-flaeche"></div></div>`;
}
function umgebung(art, id) {
  const w = mitDb(dom(feld(art, id))); const FX = lade(w, 'store', 'felder');
  ladeDatei(w, 'kurse/mzi/werkzeuge/mzikern.js');
  ladeDatei(w, 'kurse/mzi/werkzeuge/' + art + '.js');
  const el = w.document.querySelector('.fx-feld'), H = FX.felder.arten[art];
  H.init(el);
  return { w, FX, M: FX.mzi, el, H, wert: () => plain(H.wert(el)) };
}

test('Kern: Gangunterschied als Bruchteil von λ', () => {
  const { M } = umgebung('vergleich', 'x/y/z');
  assert.deepStrictEqual([0, 22.5, 90, 180, 270, 360].map(M.DS), ['0', 'λ/16', 'λ/4', 'λ/2', '3λ/4', 'λ']);
  assert.strictEqual(M.DS(10), '0,03 λ');   // alte Speicherstände in 10°-Schritten
  assert.strictEqual(M.lamBruch(24, 16), '3λ/2');
  assert.strictEqual(M.lamBruch(32, 16), '2λ');
});

test('gangunterschied: Regler 0 bis 2λ in λ/16, Anzeige, Wert, nie leer, nicht im Protokoll', () => {
  const { w, el, H, wert } = umgebung('gangunterschied', 'muster/a-k4-gang/gu-sim');
  const r = el.querySelector('input[type=range]');
  assert.deepStrictEqual([r.min, r.max, r.step], ['0', '32', '1']);
  r.value = 8; r.dispatchEvent(new w.Event('input', { bubbles: true }));
  assert.strictEqual(el.querySelector('[data-o="ds"]').textContent, 'λ/2');
  assert.strictEqual(el.querySelector('[data-o="arm"]').textContent, '+ λ/2');
  assert.deepStrictEqual(wert(), { ds: 8 });
  H.laden(el, { ds: 16 });
  assert.strictEqual(el.querySelector('[data-o="ds"]').textContent, 'λ');
  H.laden(el, { ds: 99 });
  assert.strictEqual(r.value, '32');
  assert.strictEqual(H.leer(wert()), false);
  assert.strictEqual(H.ohneProtokoll, true);
  H.init(el); assert.strictEqual(el.querySelectorAll('svg').length, 1);
});

test('gangunterschied: Mitte von Schirm 1 hell bei Δs = 0, dunkel bei λ/2; Schirm 2 umgekehrt', () => {
  const { M } = umgebung('gangunterschied', 'muster/a-k4-gang/gu-sim');
  // Zeichenfläche mit Pixelpuffer nachbilden (jsdom hat kein Canvas)
  function flaeche() {
    let daten = null;
    return { width: 21, height: 21, getContext: () => ({ createImageData: (W, H) => ({ data: new Uint8ClampedArray(W * H * 4) }), putImageData: (img) => { daten = img.data; } }),
      gruen: () => daten[(10 * 21 + 10) * 4 + 1] };
  }
  const mitte = (n, ds) => { const c = flaeche(); assert.ok(M.gangMuster(c, n, ds)); return c.gruen(); };
  assert.ok(mitte(1, 0) > 200 && mitte(2, 0) < 40);
  assert.ok(mitte(1, 266) < 40 && mitte(2, 266) > 200);   // λ/2 = 266 nm
  assert.ok(mitte(1, 532) > 200);                          // λ: wie bei 0
});

test('vergleich: fünf Zeilen mit je zwei Feldern, erledigt erst wenn alle ausgefüllt, Protokoll als Tabelle', () => {
  const { M, el, H, wert } = umgebung('vergleich', 'drei-aufbauten/k1-vgl/vgl-tab');
  const felder = el.querySelectorAll('textarea[data-zelle]');
  assert.strictEqual(felder.length, 10);
  assert.strictEqual(H.leer(wert()), true);
  assert.strictEqual(H.begonnen(wert()), false);
  felder[0].value = 'Helligkeit';
  assert.strictEqual(H.begonnen(wert()), true);
  felder.forEach((f, i) => { if (i < 9) f.value = 'Antwort ' + i; });
  assert.strictEqual(H.leer(wert()), true);
  felder[9].value = 'x';   // zu kurz
  assert.strictEqual(H.leer(wert()), true);
  felder[9].value = 'Wahrscheinlichkeiten';
  assert.strictEqual(H.leer(wert()), false);
  const p = plain(H.protokoll(el, wert()));
  assert.strictEqual(p[0].typ, 'tabelle');
  assert.deepStrictEqual(p[0].kopf, ['', 'klassisch', 'quantenphysikalisch']);
  assert.strictEqual(p[0].zeilen.length, 5);
  assert.deepStrictEqual(p[0].zeilen[4].slice(1), ['Antwort 8', 'Wahrscheinlichkeiten']);
  assert.strictEqual(p[0].zeilen[0][0], 'Was wird gemessen?');
  assert.strictEqual(p[0].zeilen[2][0], M.VERGLEICH.ZEILEN[2][2]);
  // Laden stellt alle Felder her
  const w2 = umgebung('vergleich', 'drei-aufbauten/k1-vgl/vgl-tab');
  w2.H.laden(w2.el, wert());
  assert.deepStrictEqual(w2.wert(), wert());
});

test('koinzidenz: Einzelphotonenquelle nie Koinzidenz, abgeschwächter Laser manchmal; Umschalten setzt zurück', () => {
  const { w, M, el, H } = umgebung('koinzidenz', 'drei-aufbauten/k1-vgl/vgl-koinz');
  const e = M.koinzidenz('e', 1000);
  assert.strictEqual(e.b + e[0], 0);
  assert.strictEqual(e[1] + e[2], 1000);
  const l = M.koinzidenz('l', 1000);
  assert.ok(l.b > 100 && l[0] > 250, JSON.stringify(l));   // Poisson(1): P(0) ≈ 37 %, Koinzidenz ≈ 1 − e^(−1/2)·2 + e^(−1) ≈ 15 %
  el.querySelector('[data-o="messen"]').click();
  assert.strictEqual(el.querySelector('[data-k="b"]').textContent, '0');
  assert.strictEqual(Number(el.querySelector('[data-k="1"]').textContent) + Number(el.querySelector('[data-k="2"]').textContent), 1000);
  el.querySelector('[data-kq="l"]').click();
  assert.strictEqual(el.querySelector('[data-kq="l"]').getAttribute('aria-pressed'), 'true');
  assert.strictEqual(el.querySelector('[data-k="1"]').textContent, '0');
  assert.strictEqual(H.leer(H.wert(el)), false);
  assert.strictEqual(H.ohneProtokoll, true);
  assert.ok(w);
});
