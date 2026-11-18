const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, ladeDatei, plain } = require('../helfer');

function kern() {
  const w = dom(); lade(w, 'store', 'felder');
  const FX = ladeDatei(w, 'kurse/bb84/werkzeuge/bb84kern.js');
  return FX.bb84;
}

test('Kodierung: Zustand aus Basis und Bit', () => {
  const { zustand } = kern();
  assert.deepStrictEqual(plain(zustand('+', 0)), { winkel: '0°', ket: '|↑⟩', detektor: 'D0' });
  assert.deepStrictEqual(plain(zustand('+', 1)), { winkel: '90°', ket: '|→⟩', detektor: 'D1' });
  assert.deepStrictEqual(plain(zustand('×', 0)), { winkel: '−45°', ket: '|↘⟩', detektor: 'D0' });
  assert.deepStrictEqual(plain(zustand('×', 1)), { winkel: '45°', ket: '|↗⟩', detektor: 'D1' });
  assert.strictEqual(zustand('×', 0).winkel, '−45°');
});

test('Bobs Drehwinkel', () => {
  const { bobWinkel } = kern();
  assert.strictEqual(bobWinkel('+'), '0°'); assert.strictEqual(bobWinkel('×'), '45°');
});

test('Messung: gleiche Basis liefert das Bit, ungleiche den Zufall', () => {
  const { messung } = kern();
  assert.strictEqual(messung('+', 1, '+', () => 0.9), 1);
  assert.strictEqual(messung('×', 0, '×', () => 0.9), 0);
  assert.strictEqual(messung('+', 1, '×', () => 0.1), 0);
  assert.strictEqual(messung('+', 1, '×', () => 0.9), 1);
});

test('Text zu Bits: Hallo', () => {
  const { zuBits } = kern();
  assert.deepStrictEqual(plain(zuBits('Hallo')).bits, ['00111', '00000', '01011', '01011', '01110']);
  assert.deepStrictEqual(plain(zuBits('Hallo')).buchstaben, ['H', 'A', 'L', 'L', 'O']);
});

test('Umlaute, ß und Sonderzeichen', () => {
  const { zuBits } = kern();
  const r = plain(zuBits('Grüße!'));
  assert.deepStrictEqual(r.buchstaben, ['G', 'R', 'U', 'E', 'S', 'S', 'E']);
  assert.deepStrictEqual(r.nicht, ['!']);
  assert.deepStrictEqual(plain(zuBits('Äpfel Öl')).buchstaben, ['A', 'E', 'P', 'F', 'E', 'L', 'O', 'E', 'L']);
  assert.deepStrictEqual(plain(zuBits('a b')).nicht, [' ']);
  assert.deepStrictEqual(plain(zuBits('')), { buchstaben: [], bits: [], nicht: [] });
});

test('Codetabelle: A, L, O, Z', () => {
  const { zuBits, buchstabe } = kern();
  assert.deepStrictEqual(plain(zuBits('ALOZ')).bits, ['00000', '01011', '01110', '11001']);
  assert.strictEqual(buchstabe('00000'), 'A'); assert.strictEqual(buchstabe('11001'), 'Z');
  assert.strictEqual(buchstabe('00111'), 'H'); assert.strictEqual(buchstabe('11010'), null); assert.strictEqual(buchstabe('11111'), null);
});

test('Binäraddition (XOR) ist ihre eigene Umkehrung', () => {
  const { addiere } = kern();
  assert.strictEqual(addiere('00111', '01001'), '01110');
  assert.strictEqual(addiere('01110', '01001'), '00111');
  assert.strictEqual(addiere('0000', '1111'), '1111');
});

test('Gruppen zu fünf Bit', () => {
  const { gruppen } = kern();
  assert.strictEqual(gruppen('0100110110'), '01001 10110');
  assert.strictEqual(gruppen('0100110'), '01001 10');
  assert.strictEqual(gruppen(''), '');
});

test('Würfel: Basis zuerst, dann Bit', () => {
  const { wuerfel } = kern();
  const folge = (...v) => { let i = 0; return () => v[i++]; };
  assert.deepStrictEqual(plain(wuerfel(folge(0.1, 0.9))), { basis: '+', bit: 1 });
  assert.deepStrictEqual(plain(wuerfel(folge(0.9, 0.1))), { basis: '×', bit: 0 });
});
