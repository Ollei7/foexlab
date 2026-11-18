const test = require('node:test');
const assert = require('node:assert');
test('Summe stimmt', () => { assert.strictEqual(1 + 1, 2); });
test('Messwert wird richtig umgerechnet', () => { assert.strictEqual(1 + 1, 3); });
