const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, ladeDatei, plain } = require('../helfer');

function aufbau(modus, rolle) {
  const w = dom(`<div class="fx-feld" data-fx-id="a/k/ht" data-fx-art="handtabelle"><div class="fx-werkzeug-flaeche"></div></div>
    <div class="fx-feld" data-fx-id="a/k/sk" data-fx-art="schluessel" data-fx-titel="Schlüssel" data-fx-konfig='{"modus":"${modus || 'normal'}"}'><div class="fx-werkzeug-flaeche"></div></div>`);
  lade(w, 'store', 'felder');
  const FX = ladeDatei(w, 'kurse/bb84/werkzeuge/bb84kern.js'); ladeDatei(w, 'kurse/bb84/werkzeuge/handtabelle.js'); ladeDatei(w, 'kurse/bb84/werkzeuge/schluessel.js');
  const d = w.document, el = d.querySelector('[data-fx-art="schluessel"]'), ht = d.querySelector('[data-fx-art="handtabelle"]');
  const S = FX.felder.arten.schluessel; FX.felder.arten.handtabelle.init(ht); S.init(el);
  if (rolle) FX.bb84.setzeRolle(rolle);
  const folge = (...v) => { let i = 0; return () => v[i++ % v.length]; };
  const zeile = (n) => el.querySelector(`tr.fx-sk-zeile[data-nr="${n}"]`);
  const wert = () => plain(S.wert(el));
  const setze = (patch) => { const x = Object.assign({}, wert(), patch); S.laden(el, x); };
  const eingabe = (e, v) => { e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); e.dispatchEvent(new w.Event('change', { bubbles: true })); };
  return { w, FX, d, el, ht, S, zeile, wert, setze, folge, eingabe, q: (s) => el.querySelector(s), qa: (s) => Array.from(el.querySelectorAll(s)) };
}
const KEY25 = '0100110110001101001011010';

test('Alice würfelt: Winkel und Ket passen zur Kodierung', () => {
  const r = aufbau('normal', 'alice');
  r.FX.bb84.zufall = r.folge(0.9, 0.1);   // Basis ×, Bit 0
  r.zeile(0).querySelector('.fx-sk-wuerfel').click();
  const t = r.zeile(0).querySelector('.fx-sk-anzeige').textContent;
  assert.match(t, /−45°/); assert.match(t, /\|↘⟩/);
  assert.strictEqual(r.wert().alice.zeilen[0].basis, '×'); assert.strictEqual(r.wert().alice.zeilen[0].bit, '0');
});

test('grüne Zeilen werden übernommen, Tabelle geleert', () => {
  const r = aufbau('normal', 'alice');
  r.FX.bb84.zufall = r.folge(0.1, 0.9);   // + , 1
  for (let i = 0; i < 5; i++) r.zeile(i).querySelector('.fx-sk-wuerfel').click();
  const mark = (i, n) => { for (let k = 0; k < n; k++) r.zeile(i).querySelector('.fx-sk-mark').click(); };
  [0, 1, 2].forEach((i) => mark(i, 1)); [3, 4].forEach((i) => mark(i, 2));
  assert.strictEqual(r.wert().alice.zeilen[0].markierung, 'ok'); assert.strictEqual(r.wert().alice.zeilen[3].markierung, 'fehler');
  r.q('.fx-sk-uebernehmen').click();
  assert.strictEqual(r.wert().schluessel.alice.length, 3); assert.strictEqual(r.wert().schluessel.alice, '111');
  assert.strictEqual(r.qa('tr.fx-sk-zeile').length, 16);
  assert.ok(r.wert().alice.zeilen.every((z) => !z.basis && !z.bit && !z.markierung));
  assert.strictEqual(r.q('.fx-sk-balken').value, 3);
});

test('Bob: grüne Zeile ohne Bit blockiert die Übernahme mit Hinweis', () => {
  const r = aufbau('normal', 'bob');
  r.FX.bb84.zufall = r.folge(0.1);
  r.zeile(0).querySelector('.fx-sk-wuerfel').click(); r.zeile(0).querySelector('.fx-sk-mark').click();
  r.q('.fx-sk-uebernehmen').click();
  assert.strictEqual(r.q('.fx-sk-hinweis').textContent, 'Tragt zuerst in allen grünen Zeilen das gemessene Bit ein.');
  assert.strictEqual(r.wert().schluessel.bob, '');
  r.eingabe(r.zeile(0).querySelector('.fx-sk-bit'), '1');
  r.q('.fx-sk-uebernehmen').click();
  assert.strictEqual(r.wert().schluessel.bob, '1'); assert.strictEqual(r.q('.fx-sk-hinweis').textContent, '');
});

test('Rollenwechsel behält Daten je Rolle', () => {
  const r = aufbau('normal', 'alice');
  r.FX.bb84.zufall = r.folge(0.1, 0.9);
  r.zeile(0).querySelector('.fx-sk-wuerfel').click();
  r.setze({ schluessel: { alice: '0101', bob: '' } });
  r.FX.bb84.setzeRolle('bob');
  assert.strictEqual(r.q('.fx-sk-reiter[aria-selected="true"]').getAttribute('data-rolle'), 'bob');
  r.zeile(0).querySelector('.fx-sk-wuerfel').click();
  r.FX.bb84.setzeRolle('alice');
  const w = r.wert();
  assert.strictEqual(w.alice.zeilen[0].basis, '+'); assert.strictEqual(w.alice.zeilen[0].bit, '1'); assert.strictEqual(w.schluessel.alice, '0101');
  assert.strictEqual(w.bob.zeilen[0].basis, '+'); assert.strictEqual(w.bob.zeilen[0].bit, '');
  r.q('.fx-sk-reiter[data-rolle="bob"]').click();   // ansehen, ohne die Rolle zu ändern
  assert.strictEqual(r.FX.bb84.rolle(), 'alice'); assert.strictEqual(r.q('.fx-sk-reiter[aria-selected="true"]').getAttribute('data-rolle'), 'bob');
});

test('Verschlüsseln: Hallo mit Schlüssel aus 25 Bits', () => {
  const r = aufbau('normal', 'alice');
  r.setze({ schluessel: { alice: KEY25, bob: '' } });
  r.eingabe(r.q('.fx-sk-nachricht'), 'Hallo');
  const K = r.FX.bb84, klar = K.zuBits('Hallo').bits, key = KEY25.match(/.{5}/g);
  const erwartet = klar.map((b, i) => K.addiere(b, key[i]));
  assert.strictEqual(r.q('.fx-sk-verschluesselt').textContent, erwartet.join(' '));
  assert.strictEqual(r.q('.fx-sk-klarbits').textContent, klar.join(' '));
  assert.strictEqual(r.wert().nachricht.klar, 'Hallo');
  assert.strictEqual(r.q('.fx-sk-nicht').hidden, true); assert.strictEqual(r.q('.fx-sk-reicht').hidden, true);
});

test('Sonderzeichen werden genannt, zu kurzer Schlüssel auch (Review Focus 3)', () => {
  const r = aufbau('normal', 'alice');
  r.setze({ schluessel: { alice: '0'.repeat(40), bob: '' } });
  r.eingabe(r.q('.fx-sk-nachricht'), 'Grüße!');
  assert.match(r.q('.fx-sk-nicht').textContent, /nicht übertragbar/); assert.match(r.q('.fx-sk-nicht').textContent, /!/);
  assert.strictEqual(r.q('.fx-sk-klarbits').textContent.split(' ').length, 7);   // GRUESSE
  r.setze({ schluessel: { alice: '0101010101', bob: '' } });
  r.eingabe(r.q('.fx-sk-nachricht'), 'hallo welt');
  assert.strictEqual(r.q('.fx-sk-reicht').textContent, 'Der Schlüssel reicht für 2 Buchstaben.');
  assert.strictEqual(r.q('.fx-sk-verschluesselt').textContent.split(' ').length, 2);
  assert.match(r.q('.fx-sk-nicht').textContent, /␣|Leerzeichen/);
});

test('Erst ab 5 Bit erscheint die Verschlüsselung', () => {
  const r = aufbau('normal', 'alice');
  assert.strictEqual(r.q('.fx-sk-nachricht'), null);
  r.setze({ schluessel: { alice: '0101', bob: '' } }); assert.strictEqual(r.q('.fx-sk-nachricht'), null);
  r.setze({ schluessel: { alice: '01010', bob: '' } }); assert.ok(r.q('.fx-sk-nachricht'));
});

test('Bob entschlüsselt mit seinem Schlüssel', () => {
  const r = aufbau('normal', 'bob');
  const K = r.FX.bb84, key = KEY25.match(/.{5}/g), klar = K.zuBits('Hallo').bits;
  r.setze({ schluessel: { alice: '', bob: KEY25 } });
  r.eingabe(r.q('.fx-sk-empfangen'), klar.map((b, i) => K.addiere(b, key[i])).join(' '));
  assert.strictEqual(r.q('.fx-sk-entschluesselt').textContent, 'HALLO');
  assert.strictEqual(r.wert().empfangen.bits, klar.map((b, i) => K.addiere(b, key[i])).join(''));
  r.eingabe(r.q('.fx-sk-empfangen'), '01x1');
  assert.match(r.q('.fx-sk-eingabehinweis').textContent, /nur 0 und 1/);
});

test('Aus Aufgabe 1 übernehmen setzt den Schlüssel der Rolle', () => {
  const r = aufbau('normal', 'alice');
  r.FX.felder.arten.handtabelle.laden(r.ht, { alice: { schluessel: '01001' }, bob: { schluessel: '10110' } });
  r.q('.fx-sk-aus-a1').click();
  assert.strictEqual(r.wert().schluessel.alice, '01001');
  r.FX.bb84.setzeRolle('bob'); r.q('.fx-sk-aus-a1').click();
  assert.strictEqual(r.wert().schluessel.bob, '10110'); assert.strictEqual(r.wert().schluessel.alice, '01001');
});

test('Eve-Modus: Eve sendet den Zustand aus eigener Basis und Bit', () => {
  const r = aufbau('eve', 'eve');
  assert.deepStrictEqual(r.qa('.fx-sk-reiter').map((b) => b.getAttribute('data-rolle')), ['alice', 'bob', 'eve']);
  assert.strictEqual(r.q('.fx-sk-reiter[aria-selected="true"]').getAttribute('data-rolle'), 'eve');
  r.FX.bb84.zufall = r.folge(0.9);   // Basis ×
  r.zeile(0).querySelector('.fx-sk-wuerfel').click();
  r.eingabe(r.zeile(0).querySelector('.fx-sk-bit'), '1');
  assert.match(r.zeile(0).querySelector('.fx-sk-anzeige').textContent, /Eve sendet neu: 45° \|↗⟩/);
  assert.strictEqual(r.wert().eve.zeilen[0].basis, '×'); assert.strictEqual(r.wert().eve.zeilen[0].bit, '1');
  const normal = aufbau('normal', 'alice'); assert.deepStrictEqual(normal.qa('.fx-sk-reiter').map((b) => b.getAttribute('data-rolle')), ['alice', 'bob']);
});

test('Eve-Modus: Vergleichsspalte, Unterschiede per Tipp, Fehlerrate', () => {
  const r = aufbau('eve', 'alice');
  r.setze({ schluessel: { alice: '0110', bob: '' } });
  const fremd = r.qa('.fx-sk-fremd'); assert.strictEqual(fremd.length, 4);
  ['0', '1', '0', '0'].forEach((b, i) => r.eingabe(fremd[i], b));
  r.qa('.fx-sk-diff')[2].click();
  r.eingabe(r.q('.fx-sk-fehlerrate'), '25');
  const w = r.wert();
  assert.deepStrictEqual(w.vergleich.fremd, ['0', '1', '0', '0']); assert.deepStrictEqual(w.vergleich.markiert.slice(0, 4), [false, false, true, false]); assert.strictEqual(w.fehlerrate, '25');
  const teile = plain(r.S.protokoll(r.el, r.S.wert(r.el)));
  const tab = teile.find((t) => t.typ === 'tabelle');
  assert.deepStrictEqual(tab.markierung, ['ok', 'ok', 'fehler', 'ok']);
  assert.ok(teile.some((t) => t.typ === 'text' && /Fehlerrate: 25 %/.test(t.text)));
});

test('Protokoll-Teile: Schlüssel in Fünfergruppen mit Länge, Nachricht', () => {
  const r = aufbau('normal', 'alice');
  r.setze({ schluessel: { alice: '010011011000', bob: '01001' }, nachricht: { klar: 'Ha' } });
  const text = plain(r.S.protokoll(r.el, r.S.wert(r.el))).filter((t) => t.typ === 'text').map((t) => t.text).join('\n');
  assert.match(text, /Alice – Schlüssel \(12 Bit\): 01001 10110 00/); assert.match(text, /Bob – Schlüssel \(5 Bit\): 01001/);
  assert.match(text, /Klartext: Ha/); assert.match(text, /binär: 00111 00000/); assert.match(text, /verschlüsselt: 01110 10110/);
});

test('leer, wenn nichts eingetragen ist', () => {
  const r = aufbau('normal', 'alice');
  assert.strictEqual(r.S.leer(r.S.wert(r.el)), true);
  r.setze({ schluessel: { alice: '0', bob: '' } }); assert.strictEqual(r.S.leer(r.S.wert(r.el)), false);
});
