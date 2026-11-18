const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb, warte } = require('./helfer');

const HTML = `<details class="act"><div class="fx-feld" data-fx-id="a/k/f0" data-fx-art="text"><textarea class="fx-text"></textarea></div>
<div class="fx-feld" data-fx-id="a/k/v" data-fx-art="vermutung" data-fx-sperrt="1"><textarea class="fx-text"></textarea></div>
<div class="fx-feld" data-fx-id="a/k/f" data-fx-art="text"><textarea class="fx-text"></textarea></div></details>
<details class="act"><div class="fx-feld" data-fx-id="a/k2/g" data-fx-art="text"><textarea class="fx-text"></textarea></div></details>`;

async function aufbau(vorher) {
  const w = mitDb(dom(HTML)); const FX = lade(w, 'store', 'felder');
  const s = await FX.store.oeffne('k');
  if (vorher) await s.schreibe('a/k/v', { text: vorher });
  await FX.felder.start(s);
  const d = w.document;
  return { w, FX, s, f0: d.querySelector('[data-fx-id="a/k/f0"]'), f: d.querySelector('[data-fx-id="a/k/f"]'), g: d.querySelector('[data-fx-id="a/k2/g"]'), v: d.querySelector('[data-fx-id="a/k/v"]') };
}

test('nur das folgende Feld derselben Karte ist gesperrt', async () => {
  const { f0, f, g } = await aufbau();
  assert.ok(f.hasAttribute('data-fx-gesperrt'));
  assert.ok(!f0.hasAttribute('data-fx-gesperrt'));
  assert.ok(!g.hasAttribute('data-fx-gesperrt'));
});

test('nach Eingabe der Vermutung entsperrt', async () => {
  const { w, v, f } = await aufbau();
  const ta = v.querySelector('textarea'); ta.value = 'Wird heller'; ta.dispatchEvent(new w.Event('input', { bubbles: true }));
  assert.ok(!f.hasAttribute('data-fx-gesperrt'));
});

test('nach Neuladen mit gespeicherter Vermutung entsperrt', async () => {
  const { f } = await aufbau('Wird heller');
  assert.ok(!f.hasAttribute('data-fx-gesperrt'));
});

test('freiwillige Felder (optional) werden nie gesperrt', async () => {
  const w = mitDb(dom(`<div class="fx-karte" data-karte="a/k" data-abschnitt-id="a"><div class="fx-feld" data-fx-id="a/k/v" data-fx-art="text" data-fx-sperrt="1"><textarea class="fx-text"></textarea></div>
    <div class="fx-feld" data-fx-id="a/k/n" data-fx-art="text" data-fx-optional="1"><textarea class="fx-text"></textarea></div>
    <div class="fx-feld" data-fx-id="a/k/g" data-fx-art="text"><textarea class="fx-text"></textarea></div></div>`));
  const FX = lade(w, 'store', 'felder'); const s = await FX.store.oeffne('k'); await FX.felder.start(s);
  const d = w.document;
  assert.ok(!d.querySelector('[data-fx-id="a/k/n"]').hasAttribute('data-fx-gesperrt'));
  assert.ok(d.querySelector('[data-fx-id="a/k/g"]').hasAttribute('data-fx-gesperrt'));
});

test('Hinweis auf gesperrter Folgekarte kürzt lange Feldtitel', async () => {
  const lang = 'Was denkst du: Wie könnte Alice eine geheime Nachricht an Bob schicken, ohne dass jemand mitliest und was wäre dabei zu beachten?';
  const w = mitDb(dom(`<div class="fx-karte" data-karte="a/k1" data-abschnitt-id="a"><div class="fx-feld" data-fx-id="a/k1/f" data-fx-art="text" data-fx-sperrt="1" data-fx-titel="${lang}"><textarea class="fx-text"></textarea></div></div>
    <div class="fx-karte" data-karte="a/k2" data-abschnitt-id="a"><h2>K2</h2><p>Inhalt</p></div>`));
  const FX = lade(w, 'store', 'felder'); const s = await FX.store.oeffne('k'); await FX.felder.start(s);
  const t = w.document.querySelector('.fx-karte[data-karte="a/k2"] .fx-kartensperre-hinweis').textContent;
  assert.match(t, /^Tragt zuerst etwas in ‚Was denkst du: .*…‘ ein\.$/); assert.ok(t.length < 110);
});

test('Karten-Sperrhinweis: bei Feldern ohne Texteingabe neutral', async () => {
  const w = mitDb(dom(`<div class="fx-karte" data-karte="a/k1" data-abschnitt-id="a"><div class="fx-feld" data-fx-id="a/k1/m" data-fx-art="eigen" data-fx-sperrt="1" data-fx-titel="Messung"></div></div>
    <div class="fx-karte" data-karte="a/k2" data-abschnitt-id="a"><h2>K2</h2><p>Inhalt</p></div>`));
  const FX = lade(w, 'store', 'felder');
  FX.felder.registriere('eigen', { laden() {}, wert: () => ({}), leer: () => true });
  const s = await FX.store.oeffne('k'); await FX.felder.start(s);
  assert.strictEqual(w.document.querySelector('.fx-karte[data-karte="a/k2"] .fx-kartensperre-hinweis').textContent, 'Erledigt zuerst ‚Messung‘.');
});

test('Sperrhinweis hängt vom sperrenden Feld ab: Vermutung, neutral, eigene Feldart', async () => {
  const html = `<div class="fx-karte" data-karte="a/k" data-abschnitt-id="a">
<div class="fx-feld" data-fx-id="a/k/v" data-fx-art="vermutung" data-fx-sperrt="1"><textarea></textarea></div>
<div class="fx-feld" data-fx-id="a/k/t" data-fx-art="text" data-fx-sperrt="1"><textarea></textarea></div>
<div class="fx-feld" data-fx-id="a/k/e" data-fx-art="eigen" data-fx-sperrt="1"></div>
<div class="fx-feld" data-fx-id="a/k/z" data-fx-art="text"><textarea></textarea></div></div>`;
  const w = mitDb(dom(html)); const FX = lade(w, 'store', 'felder');
  FX.felder.registriere('eigen', { laden() {}, wert: () => ({}), leer: () => true, sperrhinweis: (el) => 'Messt zuerst (' + el.getAttribute('data-fx-id') + ').' });
  const s = await FX.store.oeffne('k'); await FX.felder.start(s);
  const hin = (id) => w.document.querySelector(`[data-fx-id="${id}"] .fx-sperrhinweis`).textContent;
  assert.strictEqual(hin('a/k/v'), 'Tragt zuerst eure Vermutung ein.');
  assert.strictEqual(hin('a/k/t'), 'Erledigt zuerst diese Aufgabe, dann geht es weiter.');
  assert.strictEqual(hin('a/k/e'), 'Messt zuerst (a/k/e).');
});
