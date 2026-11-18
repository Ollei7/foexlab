const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, ladeDatei, plain } = require('../helfer');

function aufbau(rolle) {
  const w = dom(`<div class="fx-feld" data-fx-id="a/k/rolle" data-fx-art="rollenwahl" data-fx-konfig="{}"><div class="fx-werkzeug-flaeche"></div></div>
    <div class="fx-feld" data-fx-id="a/k/ht" data-fx-art="handtabelle" data-fx-titel="Aufgabe 1"><div class="fx-werkzeug-flaeche"></div></div>`);
  lade(w, 'store', 'felder');
  const FX = ladeDatei(w, 'kurse/bb84/werkzeuge/bb84kern.js'); ladeDatei(w, 'kurse/bb84/werkzeuge/handtabelle.js');
  const d = w.document, rw = d.querySelector('[data-fx-art="rollenwahl"]'), ht = d.querySelector('[data-fx-art="handtabelle"]');
  const H = FX.felder.arten.handtabelle; FX.felder.arten.rollenwahl.init(rw); H.init(ht);
  if (rolle) FX.bb84.setzeRolle(rolle);
  const eingabe = (el, wert) => { el.value = wert; el.dispatchEvent(new w.Event('change', { bubbles: true })); };
  return { w, FX, d, rw, ht, H, eingabe, runde: (n) => ht.querySelector(`tr.fx-ht-runde[data-nr="${n}"]`) };
}

test('Rollenwahl: Alice und Bob, Eve nur bei konfig eve; Wechsel meldet fx:rolle', () => {
  const { w, FX, d, rw } = aufbau();
  assert.deepStrictEqual(Array.from(rw.querySelectorAll('button')).map((b) => b.textContent), ['Gruppe Alice', 'Gruppe Bob']);
  let gemeldet = null; d.addEventListener('fx:rolle', (e) => { gemeldet = e.detail.rolle; });
  rw.querySelector('button').click();
  assert.strictEqual(FX.bb84.rolle(), 'alice'); assert.strictEqual(gemeldet, 'alice');
  assert.strictEqual(rw.querySelector('button[aria-pressed="true"]').textContent, 'Gruppe Alice');
  const w2 = dom('<div class="fx-feld" data-fx-id="a/k/r" data-fx-art="rollenwahl" data-fx-konfig=\'{"eve":true}\'><div class="fx-werkzeug-flaeche"></div></div>');
  lade(w2, 'store', 'felder'); const FX2 = ladeDatei(w2, 'kurse/bb84/werkzeuge/bb84kern.js'); ladeDatei(w2, 'kurse/bb84/werkzeuge/handtabelle.js');
  const el2 = w2.document.querySelector('.fx-feld'); FX2.felder.arten.rollenwahl.init(el2);
  assert.deepStrictEqual(Array.from(el2.querySelectorAll('button')).map((b) => b.textContent), ['Gruppe Alice', 'Gruppe Bob', 'Gruppe Eve']);
});

test('Ohne Rolle erscheint ein Hinweis, mit Rolle die Würfelreferenz und 15 Runden', () => {
  const r = aufbau();
  assert.match(r.ht.textContent, /Wählt zuerst oben eure Gruppe/);
  r.FX.bb84.setzeRolle('alice');
  assert.strictEqual(r.ht.querySelectorAll('tr.fx-ht-runde').length, 15);
  assert.strictEqual(r.ht.querySelectorAll('.fx-ht-ref tbody tr').length, 4);
  assert.match(r.ht.querySelector('.fx-ht-ref').textContent, /−45°/);
  r.FX.bb84.setzeRolle('bob');
  assert.strictEqual(r.ht.querySelectorAll('.fx-ht-ref tbody tr').length, 2);
  assert.ok(r.runde(14) && !r.runde(15));
});

test('Eingaben landen im Wert; Altwert ohne Felder lädt', () => {
  const { H, ht, runde, eingabe } = aufbau('alice');
  eingabe(runde(0).querySelector('.fx-ht-basis'), '×'); eingabe(runde(0).querySelector('.fx-ht-bit'), '1');
  eingabe(runde(0).querySelector('.fx-ht-winkel'), '45°'); eingabe(runde(0).querySelector('.fx-ht-zustand'), '↗');
  eingabe(ht.querySelector('.fx-ht-schluessel'), '01001');
  const w = plain(H.wert(ht));
  assert.deepStrictEqual(w.alice.runden[0], { basis: '×', bit: '1', winkel: '45°', zustand: '↗' });
  assert.strictEqual(w.alice.schluessel, '01001'); assert.strictEqual(w.alice.runden.length, 15);
  H.laden(ht, {}); assert.strictEqual(plain(H.wert(ht)).alice.runden.length, 15);
});

test('Rollenwechsel behält Daten je Rolle', () => {
  const { FX, H, ht, runde, eingabe } = aufbau('alice');
  eingabe(runde(0).querySelector('.fx-ht-basis'), '+'); eingabe(runde(0).querySelector('.fx-ht-bit'), '0');
  FX.bb84.setzeRolle('bob');
  eingabe(runde(0).querySelector('.fx-ht-basis'), '×'); eingabe(runde(0).querySelector('.fx-ht-bit'), '1');
  FX.bb84.setzeRolle('alice');
  assert.strictEqual(runde(0).querySelector('.fx-ht-basis').value, '+');
  const w = plain(H.wert(ht));
  assert.strictEqual(w.alice.runden[0].basis, '+'); assert.strictEqual(w.bob.runden[0].basis, '×'); assert.strictEqual(w.bob.runden[0].bit, '1');
});

test('Vergleich per Tipp markiert Zeilen im Protokoll, nur belegte Runden', () => {
  const { H, ht, runde, eingabe } = aufbau('bob');
  for (const n of [0, 1, 2]) { eingabe(runde(n).querySelector('.fx-ht-basis'), '+'); eingabe(runde(n).querySelector('.fx-ht-bit'), '0'); }
  const g = (n) => runde(n).querySelector('.fx-ht-gleich');
  g(0).click();                    // ✓
  g(1).click(); g(1).click();      // ✗
  assert.strictEqual(g(0).textContent, '✓'); assert.strictEqual(g(1).textContent, '✗'); assert.strictEqual(g(2).textContent, '–');
  const w = plain(H.wert(ht)); assert.deepStrictEqual(w.vergleich.slice(0, 3), [true, false, null]);
  eingabe(ht.querySelector('.fx-ht-schluessel'), '0');
  const teile = plain(H.protokoll(ht, H.wert(ht)));
  const tab = teile.find((t) => t.typ === 'tabelle');
  assert.strictEqual(tab.zeilen.length, 3); assert.deepStrictEqual(tab.markierung, ['ok', 'fehler', null]);
  assert.ok(teile.some((t) => t.typ === 'text' && /Schlüssel: 0/.test(t.text)));
});

test('Alice-Teil: Schlüssel, Buchstabe, verschlüsselt im Protokoll; leer ohne Eingaben', () => {
  const { H, ht, eingabe } = aufbau('alice');
  assert.strictEqual(H.leer(H.wert(ht)), true);
  eingabe(ht.querySelector('.fx-ht-schluessel'), '01001'); eingabe(ht.querySelector('.fx-ht-buchstabe'), '00111'); eingabe(ht.querySelector('.fx-ht-verschluesselt'), '01110');
  assert.strictEqual(H.leer(H.wert(ht)), false);
  const t = plain(H.protokoll(ht, H.wert(ht))).filter((x) => x.typ === 'text').map((x) => x.text).join('\n');
  assert.match(t, /Schlüssel: 01001/); assert.match(t, /Buchstabe \(binär\): 00111/); assert.match(t, /verschlüsselt: 01110/);
});

test('Bob-Teil: empfangen, Schlüssel, Klartext, Buchstabe', () => {
  const { H, ht, eingabe } = aufbau('bob');
  eingabe(ht.querySelector('.fx-ht-empfangen'), '01110'); eingabe(ht.querySelector('.fx-ht-schluessel'), '01001');
  eingabe(ht.querySelector('.fx-ht-entschluesselt'), '00111'); eingabe(ht.querySelector('.fx-ht-buchstabe'), 'H');
  const w = plain(H.wert(ht)).bob;
  assert.deepStrictEqual([w.empfangen, w.schluessel, w.entschluesselt, w.buchstabe], ['01110', '01001', '00111', 'H']);
  const t = plain(H.protokoll(ht, H.wert(ht))).filter((x) => x.typ === 'text').map((x) => x.text).join('\n');
  assert.match(t, /Buchstabe: H/);
});

test('Protokoll: Zeilen nur mit eigenen Eingaben, Vergleichsmarken allein genügen nicht', () => {
  const { H, ht, runde, eingabe } = aufbau('bob');
  eingabe(runde(0).querySelector('.fx-ht-basis'), '+'); runde(0).querySelector('.fx-ht-gleich').click();
  runde(3).querySelector('.fx-ht-gleich').click();   // nur ein Tipp, keine Eingabe in Runde 4
  const tab = plain(H.protokoll(ht, H.wert(ht))).find((t) => t.typ === 'tabelle');
  assert.strictEqual(tab.zeilen.length, 1);
});
