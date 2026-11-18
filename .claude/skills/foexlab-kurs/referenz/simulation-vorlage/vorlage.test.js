// Test der Simulationsvorlage. Beim Kopieren: Feldart, Dateiname und erwartete Zahlen anpassen (siehe LIESMICH.md, Schritt 4).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
// Der Pfad zum Hilfsmodul geht vom Ort dieser Datei aus bis zum Projektordner (5 Ebenen nach oben).
// Liegt der Test später unter tests/js/<kurs>/, heißt der Pfad '../helfer'.
const { dom, lade, ladeDatei, mitDb, plain } = require('../../../../../tests/js/helfer');

const ART = 'vorlage';   // ANPASSEN: neue Feldart
const DATEI = path.relative(path.join(__dirname, '..', '..', '..', '..', '..'), path.join(__dirname, 'vorlage.js'));

function umgebung(konfig, wert) {
  const k = konfig ? " data-fx-konfig='" + JSON.stringify(konfig) + "'" : '';
  const w = mitDb(dom(`<div class="fx-feld" data-fx-id="k/a/v" data-fx-art="${ART}" data-fx-titel="T"${k}><div class="fx-werkzeug-flaeche"></div></div>`));
  const FX = lade(w, 'store', 'felder');
  ladeDatei(w, DATEI);
  const el = w.document.querySelector('.fx-feld'), H = FX.felder.arten[ART];
  H.init(el);
  if (wert) H.laden(el, wert);
  let n = 0; el.addEventListener('change', () => n++);
  const regler = el.querySelector('input[type=range]');
  const setze = (v) => { regler.value = v; regler.dispatchEvent(new w.Event('input', { bubbles: true })); };
  return { w, FX, el, H, regler, setze, wert: () => plain(H.wert(el)), aenderungen: () => n,
    uebernehmen: () => el.querySelector('[data-o="uebernehmen"]').click() };
}

test('Regler: Konfiguration min/max/schritt wird übernommen', () => {
  const u = umgebung({ min: '2', max: '8', schritt: '2' });
  assert.strictEqual(u.regler.min, '2'); assert.strictEqual(u.regler.max, '8'); assert.strictEqual(u.regler.step, '2');
  const o = umgebung();   // ohne Angaben: Standardwerte
  assert.strictEqual(o.regler.min, '0'); assert.strictEqual(o.regler.max, '10');
});

test('Regler setzen: die Skizze ändert sich', () => {
  const u = umgebung();
  const skizze = () => u.el.querySelector('[data-o="skizze"]').innerHTML;
  const vorher = skizze();
  u.setze(7);
  assert.notStrictEqual(skizze(), vorher);
  assert.ok(u.el.querySelector('[data-o="skizze"] svg'));
});

test('Skizze: feste Farben, kein var( und kein currentColor', () => {
  const u = umgebung();
  const svg = u.el.querySelector('[data-o="skizze"]').innerHTML;
  assert.ok(!/var\(/.test(svg)); assert.ok(!/currentColor/i.test(svg));
  assert.ok(/#[0-9A-Fa-f]{6}/.test(svg));
});

test('Übernehmen: Wert gespeichert, change genau einmal', () => {
  const u = umgebung();
  u.setze(4);
  assert.strictEqual(u.aenderungen(), 0, 'der Regler allein ändert den Wert nicht');
  u.uebernehmen();
  assert.strictEqual(u.aenderungen(), 1);
  assert.strictEqual(u.wert().werte.length, 1);
  assert.strictEqual(u.wert().werte[0].x, 4);
  assert.strictEqual(typeof u.wert().werte[0].y, 'number');
});

test('leer: vorher wahr, nachher falsch', () => {
  const u = umgebung();
  assert.strictEqual(u.H.leer(u.wert()), true);
  u.uebernehmen();
  assert.strictEqual(u.H.leer(u.wert()), false);
  assert.strictEqual(u.H.leer(null), true);
});

test('laden: stellt 2 Werte her (Tabelle und Wert)', () => {
  const u = umgebung(null, { werte: [{ x: 1, y: 1 }, { x: 2, y: 4 }] });
  assert.strictEqual(u.el.querySelectorAll('tbody tr').length, 2);
  assert.strictEqual(u.wert().werte.length, 2);
  assert.strictEqual(u.H.leer(u.wert()), false);
});

test('laden: kaputte Werte werden abgefangen', () => {
  const u = umgebung(null, { werte: [{ x: 'a', y: 1 }, null, { x: 3, y: 9 }] });
  assert.strictEqual(u.wert().werte.length, 1);
  assert.doesNotThrow(() => u.H.laden(u.el, 'unsinn'));
});

test('Protokoll: Tabelle mit Kopf und einer Zeile je Wert', () => {
  const u = umgebung({ einheit: 'cm', groesse: 'Länge' }, { werte: [{ x: 1, y: 1 }, { x: 2, y: 4 }] });
  const teile = u.H.protokoll(u.el, u.wert());
  assert.strictEqual(teile[0].typ, 'tabelle');
  assert.strictEqual(teile[0].zeilen.length, 2);
  assert.strictEqual(teile[0].kopf.length, teile[0].zeilen[0].length);
  assert.ok(teile[0].kopf[0].indexOf('Länge') >= 0 && teile[0].kopf[0].indexOf('cm') >= 0);
});

test('Datei: kein ?. / ?? / import / export, keine var( in Zeichenketten', () => {
  const q = fs.readFileSync(path.join(__dirname, 'vorlage.js'), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  assert.ok(!/\?\./.test(q.replace(/\?\.\d/g, ''))); assert.ok(!/\?\?/.test(q));
  assert.ok(!/^\s*(import|export)\s/m.test(q)); assert.ok(!/var\(/.test(q));
});
