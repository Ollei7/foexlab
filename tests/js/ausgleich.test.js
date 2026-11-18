const test = require('node:test');
const assert = require('node:assert');
const { gerade } = require('../../engine/web/js/ausgleich.js');

test('lineare Ausgleichsgerade', () => {
  const g = gerade([[1, 2], [2, 4.1], [3, 5.9], [4, 8.1]], 'linear');
  assert.ok(Math.abs(g.m - 2.01) < 1e-9 && Math.abs(g.b) < 1e-9);
  assert.strictEqual(g.n, 4);
  assert.ok(g.sm > 0 && g.sm < 0.1);
});

test('Ausgleich durch den Ursprung (Pilot Brechungsindex)', () => {
  const u = gerade([[92.3, 5], [184.6, 10], [276.9, 15], [369.2, 20]], 'ursprung');
  assert.ok(Math.abs(u.m - 0.054171) < 1e-5);
  assert.strictEqual(u.b, 0); assert.strictEqual(u.sb, 0);
});

test('zu wenige gültige Punkte ergeben null', () => {
  assert.strictEqual(gerade([[1, 2], [NaN, 3]], 'linear'), null);
  assert.strictEqual(gerade([], 'ursprung'), null);
});

test('bei 2 Punkten keine Fehlerangabe', () => {
  const g = gerade([[0, 0], [1, 1]], 'linear');
  assert.strictEqual(g.m, 1); assert.ok(Number.isNaN(g.sm));
});

test('gleiche x-Werte ergeben null statt Division durch null', () => {
  assert.strictEqual(gerade([[2, 1], [2, 3]], 'linear'), null);
});
