const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, plain } = require('./helfer');

const frage = (nr, nach) => `<div class="fx-quizfrage" data-nr="${nr}"${nach ? ' data-nachschlagen="' + nach + '"' : ''} hidden>
<div class="q" data-type="mc"><ul class="opts">
<li><label><input type="radio" name="q${nr}" data-f="1"><span>richtig</span></label><div class="afb" hidden>Gut</div></li>
<li><label><input type="radio" name="q${nr}" data-f="0"><span>falsch</span></label><div class="afb" hidden>Darum falsch ${nr}</div></li></ul><span class="res"></span><div class="ofb ok" hidden>Richtig! ${nr}</div><div class="ofb bad" hidden>Nicht ganz ${nr}</div></div></div>`;
const HTML = `<div class="fx-feld" data-fx-id="a/q/quiz" data-fx-art="quizserie" data-fx-titel="Quiz" data-fx-konfig='{"oeffnet":"grundlagen","anzahl":2}'>
<div class="fx-quizserie"><div class="fx-quizkopf"><span class="fx-quizzahl"></span><ol class="fx-quizpunkte"></ol></div>
${frage(0, 'nachschlagen/karte')}${frage(1)}
<div class="fx-quizctl"><button type="button" class="fx-pruefen">Prüfen</button><button type="button" class="fx-nochmal" hidden>Nochmal versuchen</button><button type="button" class="fx-naechste" hidden>Nächste Frage</button><a class="fx-knopf fx-nachschlagen" hidden data-fx-ruecksprung href="#">Hier nochmal nachschlagen</a></div>
<p class="fx-quizmeldung" role="status" hidden></p></div></div>`;

function aufbau() {
  const w = dom(HTML); const FX = lade(w, 'store', 'felder', 'quiz', 'quizserie');
  const geoeffnet = []; FX.freischaltung = { oeffne: (z) => geoeffnet.push(z) };
  const el = w.document.querySelector('.fx-feld'), h = FX.felder.arten.quizserie;
  h.init(el);
  const d = w.document, wahl = (nr, i) => { d.querySelectorAll('.fx-quizfrage')[nr].querySelectorAll('input')[i].checked = true; };
  const sichtbar = () => Array.from(d.querySelectorAll('.fx-quizfrage')).findIndex((f) => !f.hidden);
  const klick = (k) => d.querySelector(k).click();
  return { w, FX, el, h, geoeffnet, wahl, sichtbar, klick, d };
}

test('Eine Frage pro Ansicht mit „Frage n von m“', () => {
  const { el, sichtbar } = aufbau();
  assert.strictEqual(sichtbar(), 0);
  assert.match(el.querySelector('.fx-quizzahl').textContent, /Frage 1 von 2/);
  assert.strictEqual(el.querySelectorAll('.fx-quizpunkte li').length, 2);
});

test('Falsche Antwort: Erklärung, Nochmal versuchen, richtig[0] === false', () => {
  const { el, h, wahl, klick, d } = aufbau();
  wahl(0, 1); klick('.fx-pruefen');
  assert.strictEqual(h.wert(el).richtig[0], false);
  assert.strictEqual(d.querySelector('.fx-nochmal').hidden, false);
  assert.strictEqual(d.querySelector('.fx-naechste').hidden, true);
  const afb = d.querySelectorAll('.fx-quizfrage')[0].querySelectorAll('.afb')[1];
  assert.strictEqual(afb.hidden, false); assert.match(afb.textContent, /Darum falsch 0/);
  const nach = d.querySelector('.fx-nachschlagen'); assert.strictEqual(nach.hidden, false); assert.strictEqual(nach.getAttribute('href'), '#k/nachschlagen/karte');
  klick('.fx-nochmal');
  assert.strictEqual(d.querySelector('.fx-pruefen').hidden, false);
  assert.strictEqual(h.wert(el).richtig[0], undefined);
});

test('Rückmeldung je Frage: falsch zeigt „Nicht ganz“, richtig zeigt „Richtig!“', () => {
  const { wahl, klick, d } = aufbau();
  const sichtbarText = () => Array.from(d.querySelectorAll('.fx-quizfrage')[0].querySelectorAll('.ofb')).filter((x) => !x.hidden).map((x) => x.textContent);
  wahl(0, 1); klick('.fx-pruefen'); assert.deepStrictEqual(sichtbarText(), ['Nicht ganz 0']);
  klick('.fx-nochmal'); assert.deepStrictEqual(sichtbarText(), []);
  wahl(0, 0); klick('.fx-pruefen'); assert.deepStrictEqual(sichtbarText(), ['Richtig! 0']);
});

test('Richtige Antwort, dann nächste Frage', () => {
  const { el, h, wahl, klick, sichtbar, d } = aufbau();
  wahl(0, 0); klick('.fx-pruefen');
  assert.strictEqual(h.wert(el).richtig[0], true);
  assert.strictEqual(d.querySelector('.fx-nachschlagen').hidden, true);
  klick('.fx-naechste');
  assert.strictEqual(sichtbar(), 1);
  assert.match(el.querySelector('.fx-quizzahl').textContent, /Frage 2 von 2/);
});

test('Alle richtig: bestanden und oeffne(ziel)', () => {
  const { el, h, wahl, klick, geoeffnet, d } = aufbau();
  wahl(0, 0); klick('.fx-pruefen'); klick('.fx-naechste'); wahl(1, 0); klick('.fx-pruefen');
  const w = plain(h.wert(el));
  assert.strictEqual(w.bestanden, true); assert.deepStrictEqual(w.antworten, { 0: [0], 1: [0] });
  assert.deepStrictEqual(geoeffnet, ['grundlagen']);
  assert.match(d.querySelector('.fx-quizmeldung').textContent, /Alle Fragen richtig – das nächste Kapitel ist freigeschaltet\./);
});

test('Eine falsche Antwort verhindert bestanden', () => {
  const { el, h, wahl, klick, geoeffnet } = aufbau();
  wahl(0, 0); klick('.fx-pruefen'); klick('.fx-naechste'); wahl(1, 1); klick('.fx-pruefen');
  assert.strictEqual(h.wert(el).bestanden, false); assert.deepStrictEqual(geoeffnet, []);
});

test('Neuladen mit bestanden:true zeigt den Abschlusszustand', () => {
  const { el, h, d } = aufbau();
  h.laden(el, { antworten: { 0: [0], 1: [0] }, richtig: { 0: true, 1: true }, bestanden: true });
  assert.strictEqual(d.querySelector('.fx-quizmeldung').hidden, false);
  assert.strictEqual(d.querySelector('.fx-pruefen').hidden, true);
  assert.strictEqual(h.wert(el).bestanden, true);
  assert.deepStrictEqual(Array.from(d.querySelectorAll('.fx-quizfrage')).filter((f) => !f.hidden).length, 1);
});

test('Neuladen mitten in der Serie: erste offene Frage, falsche Antwort mit Erklärung', () => {
  const { el, h, sichtbar, d } = aufbau();
  h.laden(el, { antworten: { 0: [0], 1: [1] }, richtig: { 0: true, 1: false }, bestanden: false });
  assert.strictEqual(sichtbar(), 1);
  assert.strictEqual(d.querySelector('.fx-nochmal').hidden, false);
});

test('leer und Protokoll-Teile', () => {
  const { el, h } = aufbau();
  assert.strictEqual(h.leer({ antworten: {}, richtig: {}, bestanden: false }), true);
  assert.strictEqual(h.leer({ antworten: { 0: [0] }, richtig: { 0: true }, bestanden: false }), false);
  assert.deepStrictEqual(plain(h.protokoll(el, { antworten: { 0: [0], 1: [0] }, richtig: { 0: true, 1: true }, bestanden: true })), [{ typ: 'text', text: 'Alle 2 Fragen richtig' }]);
  assert.deepStrictEqual(plain(h.protokoll(el, { antworten: { 0: [0] }, richtig: { 0: true }, bestanden: false })), [{ typ: 'text', text: '1 von 2 Fragen richtig – noch nicht bestanden' }]);
});
