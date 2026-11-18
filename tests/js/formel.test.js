const test = require('node:test');
const assert = require('node:assert');
const { zahl, uebersetze } = require('../../engine/web/js/formel.js');

test('zahl akzeptiert Komma, Leerzeichen und e-Notation', () => {
  assert.strictEqual(zahl('12,5'), 12.5);
  assert.strictEqual(zahl(' 1 013 '), 1013);
  assert.strictEqual(zahl('5,32e-7'), 5.32e-7);
  assert.ok(Number.isNaN(zahl('')));
  assert.ok(Number.isNaN(zahl('abc')));
});

test('uebersetze rechnet mit Variablen', () => {
  assert.strictEqual(uebersetze('1 + N*lambda/(2*L)')({ N: 10, lambda: 532e-9, L: 0.05 }), 1 + 10 * 532e-9 / 0.1);
  assert.strictEqual(uebersetze('-2^2')({}), -4);
  assert.strictEqual(uebersetze('2^3^2')({}), 512);
  assert.ok(Math.abs(uebersetze('sqrt(16) + sin(pi/2)')({}) - 5) < 1e-12);
});

test('uebersetze lehnt Unbekanntes ab', () => {
  assert.throws(() => uebersetze('alert(1)'), /unbekannte Funktion/);
  assert.throws(() => uebersetze('1 +'), /Formel/);
  assert.throws(() => uebersetze('x')({}), /unbekannte Größe/);
});
