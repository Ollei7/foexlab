// Test der Simulationsvorlage. Beim Kopieren ART und DATEI anpassen und den Test „HIER ANPASSEN: Rechenvorschrift prüfen“
// (ganz unten) durch zwei physikalisch bekannte Werte deiner Formel ersetzen – Pflicht, siehe LIESMICH.md, Schritt 4.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
// Den Projektordner findet der Test selbst (er sucht nach oben den Ordner mit tests/js/helfer.js): egal, wo die Datei liegt.
function finde(start) {
  for (let d = start; ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, 'tests', 'js', 'helfer.js'))) return d;
    if (path.dirname(d) === d) throw new Error('Projektordner (mit tests/js/helfer.js) nicht gefunden.');
  }
}
const WURZEL = finde(__dirname);
const { dom, lade, ladeDatei, mitDb, plain } = require(path.join(WURZEL, 'tests', 'js', 'helfer'));

// ANPASSEN beim Kopieren: ART und DATEI (und unten den Test „Rechenvorschrift prüfen“), z. B. 'kurse/mein-kurs/werkzeuge/mein-werkzeug.js'
const DATEI = '.claude/skills/foexlab-kurs/referenz/simulation-vorlage/vorlage.js';
const ART = 'vorlage';

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
  const q = fs.readFileSync(path.join(WURZEL, DATEI), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  assert.ok(!/\?\./.test(q.replace(/\?\.\d/g, ''))); assert.ok(!/\?\?/.test(q));
  assert.ok(!/^\s*(import|export)\s/m.test(q)); assert.ok(!/var\(/.test(q));
});

test('Texte aus der Konfiguration werden maskiert (kein eingeschleustes HTML)', () => {
  const u = umgebung({ einheit: '<b>&', groesse: '<i>x</i>' });
  assert.strictEqual(u.el.querySelectorAll('b, i').length, 0);
  assert.ok(u.el.querySelector('[data-o="skizze"]').innerHTML.indexOf('&lt;b&gt;&amp;') >= 0);
});

test('Regler: Wert wird auf die Schrittweite gerundet', () => {
  const u = umgebung({ min: '0', max: '1', schritt: '0.1' });
  u.setze(0.30000000000000004); u.uebernehmen();
  assert.strictEqual(u.wert().werte[0].x, 0.3);
});

// HIER ANPASSEN: Rechenvorschrift prüfen. Pflicht beim Kopieren: diesen Test durch zwei Werte ersetzen, die du
// physikalisch kennst (Reglerwert → erwarteter Messwert, mit der Rundung aus f). Nutzt dein Werkzeug eine zusätzliche
// Größe aus der Kurszeile (z. B. n="1.33"), prüfe einen Wert auch mit diesem Attribut; sonst den zweiten Block löschen.
test('Rechenvorschrift: bekannte Werte (Vorlage: y = faktor · x², faktor = 1)', () => {
  const messe = (konfig, x) => { const u = umgebung(konfig); u.setze(x); u.uebernehmen(); return u.wert().werte[0].y; };
  assert.strictEqual(messe({ min: '0', max: '10', schritt: '0.5' }, 3), 9);
  assert.strictEqual(messe({ min: '0', max: '10', schritt: '0.5' }, 2.5), 6.25);
  // zusätzliche Größe aus der Kurszeile: {.werkzeug name="vorlage" faktor="2"} – kommt als Zahl in k.faktor an (auch mit Komma)
  assert.strictEqual(messe({ faktor: '2' }, 3), 18);
  assert.strictEqual(messe({ faktor: '0,5' }, 4), 8);
  assert.strictEqual(messe({ faktor: 'kein Wert' }, 3), 9, 'unbrauchbares Attribut: Standardwert');
});
