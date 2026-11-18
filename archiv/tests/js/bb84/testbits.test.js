const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, ladeDatei, plain } = require('../helfer');

function aufbau(zufall) {
  const w = dom('<div class="fx-feld" data-fx-id="a/k/tb" data-fx-art="testbits"><div class="fx-werkzeug-flaeche"></div></div>');
  lade(w, 'store', 'felder');
  const FX = ladeDatei(w, 'kurse/bb84/werkzeuge/bb84kern.js'); if (zufall) FX.bb84.zufall = zufall;
  ladeDatei(w, 'kurse/bb84/werkzeuge/testbits.js');
  const el = w.document.querySelector('.fx-feld'), H = FX.felder.arten.testbits; H.init(el);
  const q = (s) => el.querySelector(s);
  const setze = (inp, v) => { inp.value = v; inp.dispatchEvent(new w.Event('input', { bubbles: true })); inp.dispatchEvent(new w.Event('change', { bubbles: true })); };
  const knopf = (t) => Array.from(el.querySelectorAll('.fx-tb-versuch button')).find((b) => b.textContent.trim() === t);
  return { w, el, H, q, setze, knopf, wert: () => plain(H.wert(el)) };
}

test('Ohne Schätzung ist der Regler gesperrt, mit Schätzung frei', () => {
  const { q, setze } = aufbau();
  assert.strictEqual(q('.fx-tb-regler').disabled, true); assert.match(q('.fx-tb-sperre').textContent, /Erst Schätzung eingeben, dann wird der Regler freigeschaltet\./);
  setze(q('.fx-tb-schaetzung'), '0'); assert.strictEqual(q('.fx-tb-regler').disabled, true);
  setze(q('.fx-tb-schaetzung'), '10');
  assert.strictEqual(q('.fx-tb-regler').disabled, false); assert.strictEqual(q('.fx-tb-sperre').hidden, true);
  assert.match(q('.fx-tb-schaetzunghinweis').textContent, /Schätzung gespeichert/);
});

test('P = 1 − 0,75ⁿ: n = 16 ergibt 99,0 %', () => {
  const { q, setze, wert } = aufbau();
  setze(q('.fx-tb-schaetzung'), '10'); setze(q('.fx-tb-regler'), '16');
  assert.strictEqual(q('.fx-tb-p').textContent, '99,0 %');
  assert.strictEqual(q('.fx-tb-erklaerung').textContent, 'Bei 16 Testbits: P(Eve unentdeckt) = 0,75^16 ≈ 1,0 % → P(Eve entdeckt) ≈ 99,0 %');
  assert.strictEqual(q('.fx-tb-balken i').style.width, '99%');
  assert.strictEqual(wert().n, 16); assert.strictEqual(wert().schaetzung, '10');
});

test('n = 4 ergibt 68,4 %, n = 0 nichts', () => {
  const { q, setze } = aufbau();
  setze(q('.fx-tb-schaetzung'), '5'); setze(q('.fx-tb-regler'), '4'); assert.strictEqual(q('.fx-tb-p').textContent, '68,4 %');
  setze(q('.fx-tb-regler'), '0'); assert.strictEqual(q('.fx-tb-p').textContent, ''); assert.strictEqual(q('.fx-tb-erklaerung').textContent, '');
});

test('Zufallsversuch mit festem Zufall: immer 0,9 → 0 von 100, immer 0,1 → 100 von 100', () => {
  let r = aufbau(() => 0.9); r.knopf('4').click();
  assert.deepStrictEqual(r.wert().versuch, { n: 4, entdeckt: 0, von: 100 });
  assert.strictEqual(r.q('.fx-tb-ergebnis').textContent, 'Bei 4 Testbits wäre Eve in 0 von 100 Fällen aufgefallen.');
  r = aufbau(() => 0.1); r.knopf('4').click();
  assert.deepStrictEqual(r.wert().versuch, { n: 4, entdeckt: 100, von: 100 });
  assert.strictEqual(r.q('.fx-tb-ergebnis').textContent, 'Bei 4 Testbits wäre Eve in 100 von 100 Fällen aufgefallen.');
});

test('Zufallsversuch: Reglerwert und feste Knöpfe 10, 50, 100', () => {
  const r = aufbau(() => 0.1);
  for (const n of ['10', '50', '100']) { r.knopf(n).click(); assert.strictEqual(r.wert().versuch.n, +n); }
  r.setze(r.q('.fx-tb-schaetzung'), '10'); r.setze(r.q('.fx-tb-regler'), '7'); r.knopf('Reglerwert').click();
  assert.strictEqual(r.wert().versuch.n, 7);
  const leer = aufbau(); leer.knopf('Reglerwert').click();
  assert.strictEqual(leer.wert().versuch, null); assert.match(leer.q('.fx-tb-ergebnis').textContent, /Stellt zuerst/);
});

test('Zufallsversuch folgt P = 1 − 0,75ⁿ statistisch (Math.random)', () => {
  const { knopf, wert } = aufbau(); knopf('10').click();
  const e = wert().versuch.entdeckt; assert.ok(e >= 85 && e <= 100, 'erwartet etwa 94, war ' + e);
});

test('Protokoll: Schätzung, n, P und Versuch; leer ohne Eingaben', () => {
  const { el, H, q, setze, knopf } = aufbau(() => 0.1);
  assert.strictEqual(H.leer(H.wert(el)), true);
  setze(q('.fx-tb-schaetzung'), '12'); setze(q('.fx-tb-regler'), '16'); knopf('10').click();
  const t = plain(H.protokoll(el, H.wert(el)))[0].text;
  assert.match(t, /Schätzung: 12 Schlüsselbits/); assert.match(t, /Testbits n = 16/); assert.match(t, /99,0 %/); assert.match(t, /Bei 10 Testbits wäre Eve in 100 von 100 Fällen aufgefallen/);
  assert.strictEqual(H.leer(H.wert(el)), false);
});

test('Laden stellt Schätzung, Regler und Versuch wieder her', () => {
  const { el, H, q } = aufbau();
  H.laden(el, { schaetzung: '9', n: 5, versuch: { n: 5, entdeckt: 77, von: 100 } });
  assert.strictEqual(q('.fx-tb-schaetzung').value, '9'); assert.strictEqual(q('.fx-tb-regler').value, '5'); assert.strictEqual(q('.fx-tb-regler').disabled, false);
  assert.match(q('.fx-tb-ergebnis').textContent, /77 von 100/); assert.strictEqual(q('.fx-tb-p').textContent, '76,3 %');
});
