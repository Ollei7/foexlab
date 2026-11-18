const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb, plain } = require('./helfer');

test('schreiben und lesen', async () => {
  const w = mitDb(dom()); const FX = lade(w, 'store');
  const s = await FX.store.oeffne('michelson');
  await s.schreibe('a/b/c', { text: 'Hallo' });
  assert.deepStrictEqual(plain(await s.lies('a/b/c')), { text: 'Hallo' });
  assert.strictEqual(await s.lies('gibt/es/nicht'), undefined);
});

test('alle() nur für den eigenen Kurs, leeren() lässt andere Kurse stehen', async () => {
  const w = mitDb(dom()); const FX = lade(w, 'store');
  const m = await FX.store.oeffne('michelson');
  const z = await FX.store.oeffne('mzifo');
  await m.schreibe('x', 1); await m.schreibe('y', 2); await z.schreibe('x', 3);
  assert.deepStrictEqual(plain(await m.alle()), { x: 1, y: 2 });
  await m.leeren();
  assert.deepStrictEqual(plain(await m.alle()), {});
  assert.deepStrictEqual(plain(await z.alle()), { x: 3 });
});

test('status ist aus, wenn IndexedDB fehlt', async () => {
  const w = dom(); w.indexedDB = undefined; const FX = lade(w, 'store');
  assert.strictEqual(await FX.store.status(), 'aus');
});

test('status ist fluechtig bei kleinem, nicht dauerhaftem Speicher', async () => {
  const w = mitDb(dom());
  Object.defineProperty(w.navigator, 'storage', { value: { persisted: async () => false, estimate: async () => ({ quota: 100e6 }) } });
  const FX = lade(w, 'store');
  assert.strictEqual(await FX.store.status(), 'fluechtig');
});

test('status ist fluechtig, wenn Safari das Browser-Dateisystem verweigert (privater Tab)', async () => {
  const w = mitDb(dom());
  Object.defineProperty(w.navigator, 'storage', { value: {
    persisted: async () => false, estimate: async () => ({ quota: 5e9 }),
    getDirectory: async () => { const e = new Error('The operation failed for an unknown reason.'); e.name = 'UnknownError'; throw e; } } });
  const FX = lade(w, 'store');
  assert.strictEqual(await FX.store.status(), 'fluechtig');
});

test('status ist ok bei großem Speicher und funktionierendem Dateisystem', async () => {
  const w = mitDb(dom());
  Object.defineProperty(w.navigator, 'storage', { value: {
    persisted: async () => false, estimate: async () => ({ quota: 5e9 }), getDirectory: async () => ({}) } });
  const FX = lade(w, 'store');
  assert.strictEqual(await FX.store.status(), 'ok');
});
