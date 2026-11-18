const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb, plain } = require('./helfer');

function frage(attr, versuche) {
  return `<div class="fx-feld" data-fx-id="a/k/q" data-fx-art="quiz" data-fx-sperrt="1"${attr}${versuche ? ' data-fx-versuche="' + versuche + '"' : ''}>
<div class="q" data-type="mc"><ul class="opts">
<li><label><input type="radio" name="q1" data-f="1"></label></li>
<li><label><input type="radio" name="q1" data-f="0"></label></li></ul>
<div class="qctl"><button type="button" class="check">Prüfen</button><button type="button" class="reset">Zurücksetzen</button><span class="res"></span></div>
<div class="fx-nach-versuchen" hidden>Lösung: erste.</div></div></div>
<div class="fx-feld" data-fx-id="a/k/n" data-fx-art="text"><textarea class="fx-text"></textarea></div>`;
}

async function aufbau(attr, versuche, vorher) {
  const w = mitDb(dom(frage(attr, versuche))); const FX = lade(w, 'store', 'felder', 'quiz');
  const s = await FX.store.oeffne('k');
  if (vorher) await s.schreibe('a/k/q', vorher);
  await FX.felder.start(s);
  const d = w.document, f = d.querySelector('[data-fx-id="a/k/q"]');
  const opt = i => f.querySelectorAll('input')[i];
  const waehle = i => { opt(i).checked = true; opt(i).dispatchEvent(new w.Event('change', { bubbles: true })); };
  const pruefen = () => FX.felder.pruefen(f);
  return { w, FX, s, f, opt, waehle, pruefen, n: d.querySelector('[data-fx-id="a/k/n"]') };
}
const K = ' data-fx-kontrolle="1"';

test('Kontrolle: Auswahl allein entsperrt nicht', async () => {
  const { n, waehle } = await aufbau(K);
  assert.ok(n.hasAttribute('data-fx-gesperrt'));
  waehle(1);
  assert.ok(n.hasAttribute('data-fx-gesperrt'));
});

test('Kontrolle: falsch geprüft → gesperrt, richtig geprüft → frei', async () => {
  const { n, waehle, pruefen, opt, f } = await aufbau(K);
  waehle(1); await pruefen();
  assert.ok(n.hasAttribute('data-fx-gesperrt'));
  assert.ok(!opt(0).disabled);
  waehle(0); await pruefen();
  assert.ok(!n.hasAttribute('data-fx-gesperrt'));
  assert.ok(opt(0).disabled && opt(1).disabled);
  assert.ok(f.querySelector('.reset').hidden);
});

test('versuche=2: nach zwei Fehlversuchen Lösung markiert, Text sichtbar, frei', async () => {
  const { n, waehle, pruefen, opt, f, FX } = await aufbau(K, 2);
  waehle(1); await pruefen();
  assert.ok(f.querySelector('.fx-nach-versuchen').hidden);
  assert.ok(n.hasAttribute('data-fx-gesperrt'));
  await pruefen();   // zweiter Fehlversuch
  assert.ok(!f.querySelector('.fx-nach-versuchen').hidden);
  assert.ok(opt(0).checked && !opt(1).checked && opt(0).disabled);
  assert.ok(opt(0).closest('li').classList.contains('right'));
  assert.ok(!n.hasAttribute('data-fx-gesperrt'));
  const w = FX.felder.speicher() && plain(await FX.felder.speicher().lies('a/k/q'));
  assert.strictEqual(w.aufgegeben, true);
});

test('bisheriges {.mc} ohne sperrt: leer nur ohne Auswahl', async () => {
  const { FX } = await aufbau('');
  assert.strictEqual(FX.felder.istLeer('quiz', { antwort: [], anteil: null }), true);
  assert.strictEqual(FX.felder.istLeer('quiz', { antwort: [1], anteil: null }), false);
  assert.strictEqual(FX.felder.istLeer('quiz', { antwort: [1], anteil: 0, kontrolle: true }), true);
  assert.strictEqual(FX.felder.istLeer('quiz', { antwort: [0], anteil: 1, kontrolle: true }), false);
});

test('bisheriges {.mc sperrt} ohne Kontrolle: Auswahl entsperrt', async () => {
  const { n, waehle } = await aufbau('');
  assert.ok(n.hasAttribute('data-fx-gesperrt'));
  waehle(1);
  assert.ok(!n.hasAttribute('data-fx-gesperrt'));
});

test('Kontrolle nach Neuladen: bestanden bleibt bestanden', async () => {
  const { n, opt } = await aufbau(K, null, { antwort: [0], anteil: 1, versuche: 0, aufgegeben: false, kontrolle: true });
  assert.ok(!n.hasAttribute('data-fx-gesperrt'));
  assert.ok(opt(0).disabled);
});

test('Kontrolle nach Neuladen: aufgegeben bleibt frei, Text sichtbar', async () => {
  const { n, f } = await aufbau(K, 2, { antwort: [0], anteil: 0, versuche: 2, aufgegeben: true, kontrolle: true });
  assert.ok(!n.hasAttribute('data-fx-gesperrt'));
  assert.ok(!f.querySelector('.fx-nach-versuchen').hidden);
});

test('Kontrolle nach Neuladen: falsch geprüft bleibt gesperrt', async () => {
  const { n } = await aufbau(K, 2, { antwort: [1], anteil: 0, versuche: 1, aufgegeben: false, kontrolle: true });
  assert.ok(n.hasAttribute('data-fx-gesperrt'));
});

test('versuche=2: nach Aufgeben „Lösung angezeigt“ statt „Nicht richtig“', async () => {
  const { waehle, pruefen, f } = await aufbau(K, 2);
  waehle(1); await pruefen(); await pruefen();
  const r = f.querySelector('.res');
  assert.strictEqual(r.textContent, 'Lösung angezeigt');
  assert.ok(!r.classList.contains('bad') && !r.classList.contains('ok'));
});

test('Neuladen nach Aufgeben: kein neues Prüfen, Lösung angezeigt bleibt', async () => {
  const { n, opt, f } = await aufbau(K, 2, { antwort: [0], anteil: 0, versuche: 2, aufgegeben: true, kontrolle: true });
  const r = f.querySelector('.res');
  assert.strictEqual(r.textContent, 'Lösung angezeigt');
  assert.ok(!r.classList.contains('ok'));
  assert.ok(opt(0).checked && opt(0).disabled);
  assert.ok(!f.querySelector('.fx-nach-versuchen').hidden);
  assert.ok(!n.hasAttribute('data-fx-gesperrt'));
});


function luecke(attr, versuche) {
  return `<div class="fx-feld" data-fx-id="a/k/q" data-fx-art="quiz" data-fx-sperrt="1"${attr}${versuche ? ' data-fx-versuche="' + versuche + '"' : ''}>
<div class="q" data-type="gaps"><div class="qbody">
<select class="gap" data-correct="A"><option value=""></option><option>A</option><option>B</option></select>
<select class="gap" data-correct="B"><option value=""></option><option>A</option><option>B</option></select></div>
<div class="qctl"><button type="button" class="check">Prüfen</button><button type="button" class="reset">Zurücksetzen</button><span class="res"></span></div>
<div class="fx-nach-versuchen" hidden>Lösung: A, B.</div></div></div>
<div class="fx-feld" data-fx-id="a/k/n" data-fx-art="text"><textarea class="fx-text"></textarea></div>`;
}
async function aufbauL(attr, versuche) {
  const w = mitDb(dom(luecke(attr, versuche))); const FX = lade(w, 'store', 'felder', 'quiz');
  const s = await FX.store.oeffne('k'); await FX.felder.start(s);
  const d = w.document, f = d.querySelector('[data-fx-id="a/k/q"]');
  const sel = i => f.querySelectorAll('select.gap')[i];
  const waehle = (i, v) => { sel(i).value = v; sel(i).dispatchEvent(new w.Event('change', { bubbles: true })); };
  return { w, FX, s, f, sel, waehle, pruefen: () => FX.felder.pruefen(f), n: d.querySelector('[data-fx-id="a/k/n"]') };
}

test('Lücke sperrt: teilweise richtig öffnet nicht, alles richtig öffnet', async () => {
  const { n, waehle, pruefen, sel, f } = await aufbauL(K);
  assert.ok(n.hasAttribute('data-fx-gesperrt'));
  waehle(0, 'A'); waehle(1, 'A');
  assert.ok(n.hasAttribute('data-fx-gesperrt'));
  await pruefen();
  assert.ok(n.hasAttribute('data-fx-gesperrt'));
  assert.ok(!sel(0).disabled);
  waehle(1, 'B'); await pruefen();
  assert.ok(!n.hasAttribute('data-fx-gesperrt'));
  assert.ok(sel(0).disabled && sel(1).disabled);
  assert.ok(f.querySelector('.reset').hidden);
});

test('Lücke versuche=2: nach zwei Fehlversuchen alle Listen auf richtig, frei, „Lösung angezeigt“', async () => {
  const { n, waehle, pruefen, sel, f, FX } = await aufbauL(K, 2);
  waehle(0, 'B'); waehle(1, 'A'); await pruefen();
  assert.ok(f.querySelector('.fx-nach-versuchen').hidden);
  assert.ok(n.hasAttribute('data-fx-gesperrt'));
  await pruefen();
  assert.ok(!f.querySelector('.fx-nach-versuchen').hidden);
  assert.strictEqual(sel(0).value, 'A'); assert.strictEqual(sel(1).value, 'B');
  assert.ok(sel(0).disabled && sel(1).disabled);
  assert.ok(!n.hasAttribute('data-fx-gesperrt'));
  const r = f.querySelector('.res');
  assert.strictEqual(r.textContent, 'Lösung angezeigt'); assert.ok(r.classList.contains('fx-aufgeloest'));
  const wert = plain(await FX.felder.speicher().lies('a/k/q'));
  assert.strictEqual(wert.aufgegeben, true);
});

test('Lücke ohne sperrt: altes Verhalten (leer nur ohne Auswahl)', async () => {
  const { FX, n, waehle, pruefen, sel } = await aufbauL('');
  assert.strictEqual(FX.felder.istLeer('quiz', { antwort: ['', ''], anteil: null }), true);
  assert.strictEqual(FX.felder.istLeer('quiz', { antwort: ['A', ''], anteil: null }), false);
  waehle(0, 'B'); await pruefen(); await pruefen(); await pruefen();
  assert.ok(!sel(0).disabled && sel(0).value === 'B');
  assert.ok(!n.hasAttribute('data-fx-gesperrt'));
});


test('Lücke Kontrolle: leere Listen zählen nicht als Versuch', async () => {
  const { n, pruefen, f } = await aufbauL(K, 2);
  await pruefen(); await pruefen(); await pruefen();
  assert.strictEqual(f.dataset.versuche, undefined);
  assert.ok(n.hasAttribute('data-fx-gesperrt'));
  assert.ok(!f.dataset.aufgegeben && f.querySelector('.fx-nach-versuchen').hidden);
  assert.strictEqual(f.querySelector('.res').textContent, 'Bitte zuerst alle Felder ausfüllen.');
});

test('Lücke Kontrolle: teilweise leer zählt nicht, vollständig falsch zählt', async () => {
  const { waehle, pruefen, f, sel } = await aufbauL(K, 2);
  waehle(0, 'A'); await pruefen(); await pruefen();
  assert.strictEqual(f.dataset.versuche, undefined);
  assert.strictEqual(f.dataset.anteil, undefined);
  assert.ok(!sel(0).disabled);
  waehle(1, 'A'); await pruefen();
  assert.strictEqual(f.dataset.versuche, '1');
});
