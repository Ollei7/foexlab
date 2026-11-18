const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb } = require('./helfer');

function spots(n, extra) {
  const opts = '<option value="">…</option><option value="A">A</option><option value="B">B</option><option value="Z">Z</option>';
  return Array.from({ length: n }, (_, i) =>
    `<span class="spot" style="left:${10 + 30 * i}%;top:10%"><select class="gap" data-correct="${(extra || ['A', 'B'])[i]}">${opts}</select></span>`).join('');
}
function html(korrekt, kontrolle) {
  const k = korrekt || ['A', 'B'];
  return `<div class="fx-feld" data-fx-id="k/k/b" data-fx-art="quiz"${kontrolle ? ' data-fx-kontrolle="1" data-fx-sperrt="1"' : ''}><div class="q" data-type="gaps">
  <div class="ddimg fx-ziehen"><img alt="">${spots(k.length, k)}</div>
  <div class="fx-ablage">${k.concat(['Z']).sort().map(v => `<span class="fx-chip" data-v="${v}">${v}</span>`).join('')}</div>
  <div class="qctl"><button class="check">Prüfen</button><button class="reset">Zurücksetzen</button><span class="res"></span></div></div></div>
  <div class="fx-feld" data-fx-id="k/k/n" data-fx-art="text"><textarea class="fx-text"></textarea></div>`;
}
function aufbau(h, kor) {
  const w = dom(h || html(kor));
  const FX = lade(w, 'quiz', 'ziehen');
  const d = w.document;
  // jsdom hat kein Layout: elementFromPoint über eine Karte x -> Element
  FX.ziehen.init(); w.__ziel = null;
  d.elementFromPoint = () => w.__ziel;
  return { w, FX, d, chip: v => d.querySelector(`.fx-chip[data-v="${v}"]`), spot: i => d.querySelectorAll('.spot')[i],
           sel: i => d.querySelectorAll('select.gap')[i], ablage: d.querySelector('.fx-ablage') };
}
const ev = (w, typ, x, y) => new w.MouseEvent(typ, { clientX: x, clientY: y, bubbles: true, cancelable: true });
function ziehe(t, chip, ziel, ende) {
  chip.dispatchEvent(ev(t.w, 'pointerdown', 0, 0));
  chip.dispatchEvent(ev(t.w, 'pointermove', 20, 20));
  t.w.__ziel = ziel;
  chip.dispatchEvent(ev(t.w, 'pointermove', 40, 40));
  chip.dispatchEvent(ev(t.w, 'pointerup', 40, 40));
}
function hat(t, i) { return t.spot(i).querySelector('.fx-chip'); }

test('Ziehen: Pointer-Ziehen setzt select und löst change aus', () => {
  const t = aufbau(); let n = 0;
  t.sel(0).addEventListener('change', () => n++);
  ziehe(t, t.chip('A'), t.spot(0));
  assert.strictEqual(t.sel(0).value, 'A'); assert.strictEqual(n, 1);
  assert.strictEqual(hat(t, 0).dataset.v, 'A');
  assert.ok(!t.d.querySelector('.fx-chip.drag'), 'Geist entfernt');
});

test('kleine Bewegung unter 6 px ist ein Antippen, kein Ziehen', () => {
  const t = aufbau();
  t.chip('A').dispatchEvent(ev(t.w, 'pointerdown', 0, 0));
  t.chip('A').dispatchEvent(ev(t.w, 'pointermove', 2, 2));
  assert.ok(!t.d.querySelector('.fx-chip.drag'));
  t.chip('A').dispatchEvent(ev(t.w, 'pointerup', 2, 2));
  assert.ok(t.chip('A').classList.contains('sel'));
});

test('Antippen Baustein, dann Platz', () => {
  const t = aufbau();
  t.chip('B').dispatchEvent(ev(t.w, 'pointerdown', 0, 0)); t.chip('B').dispatchEvent(ev(t.w, 'pointerup', 0, 0));
  assert.ok(t.chip('B').classList.contains('sel'));
  t.spot(1).dispatchEvent(new t.w.MouseEvent('click', { bubbles: true }));
  assert.strictEqual(t.sel(1).value, 'B');
  assert.ok(!t.chip('B').classList.contains('sel'));
});

test('belegter Platz gibt alten Baustein zurück', () => {
  const t = aufbau();
  ziehe(t, t.chip('A'), t.spot(0));
  ziehe(t, t.chip('B'), t.spot(0));
  assert.strictEqual(t.sel(0).value, 'B');
  assert.strictEqual(t.chip('A').parentNode, t.ablage);
  assert.strictEqual(t.spot(0).querySelectorAll('.fx-chip').length, 1);
});

test('Baustein zurück in die Ablage leert den Platz', () => {
  const t = aufbau();
  ziehe(t, t.chip('A'), t.spot(0));
  ziehe(t, t.chip('A'), t.ablage);
  assert.strictEqual(t.sel(0).value, ''); assert.strictEqual(t.chip('A').parentNode, t.ablage);
});

test('Baustein von Platz zu Platz leert den ersten', () => {
  const t = aufbau();
  ziehe(t, t.chip('A'), t.spot(0)); ziehe(t, t.chip('A'), t.spot(1));
  assert.strictEqual(t.sel(0).value, ''); assert.strictEqual(t.sel(1).value, 'A');
});

test('Laden setzt Bausteine nach gespeicherter Auswahl', async () => {
  const w = mitDb(dom(html())); const FX = lade(w, 'store', 'felder', 'quiz', 'ziehen');
  const s = await FX.store.oeffne('k');
  await s.schreibe('k/k/b', { antwort: ['B', 'A'], anteil: null });
  await FX.felder.start(s);
  const sp = w.document.querySelectorAll('.spot');
  assert.strictEqual(sp[0].querySelector('.fx-chip').dataset.v, 'B');
  assert.strictEqual(sp[1].querySelector('.fx-chip').dataset.v, 'A');
  assert.strictEqual(w.document.querySelector('.fx-ablage').querySelectorAll('.fx-chip').length, 1);
});

test('Zurücksetzen räumt die Bausteine in die Ablage', () => {
  const t = aufbau(); ziehe(t, t.chip('A'), t.spot(0));
  t.FX.quiz.zuruecksetzen(t.d.querySelector('.q'));
  assert.strictEqual(t.chip('A').parentNode, t.ablage);
});

test('mit sperrt: nach richtiger Prüfung gesperrt, Folgefeld frei', async () => {
  const w = mitDb(dom(html(null, true))); const FX = lade(w, 'store', 'felder', 'quiz', 'ziehen');
  const d = w.document; d.elementFromPoint = () => w.__ziel;
  const s = await FX.store.oeffne('k'); await FX.felder.start(s);
  const t = { w, d, FX, spot: i => d.querySelectorAll('.spot')[i], sel: i => d.querySelectorAll('select.gap')[i], ablage: d.querySelector('.fx-ablage'), chip: v => d.querySelector(`.fx-chip[data-v="${v}"]`) };
  const folge = d.querySelector('[data-fx-id="k/k/n"]');
  assert.ok(folge.hasAttribute('data-fx-gesperrt'));
  ziehe(t, t.chip('A'), t.spot(0)); ziehe(t, t.chip('B'), t.spot(1));
  await FX.felder.pruefen(d.querySelector('[data-fx-id="k/k/b"]'));
  assert.ok(!folge.hasAttribute('data-fx-gesperrt'));
  assert.ok(t.sel(0).disabled);
  ziehe(t, t.chip('Z'), t.spot(0));   // gesperrt: nichts passiert
  assert.strictEqual(t.sel(0).value, 'A');
  t.chip('Z').dispatchEvent(ev(w, 'pointerdown', 0, 0)); t.chip('Z').dispatchEvent(ev(w, 'pointerup', 0, 0));
  assert.ok(!t.chip('Z').classList.contains('sel'));
});

test('zwei gleich beschriftete Plätze sind austauschbar', () => {
  const t = aufbau(null, ['A', 'A']);
  const chips = [...t.d.querySelectorAll('.fx-chip[data-v="A"]')];
  assert.strictEqual(chips.length, 2);
  ziehe(t, chips[1], t.spot(0)); ziehe(t, chips[0], t.spot(1));
  const r = t.FX.quiz.pruefe(t.d.querySelector('.q'));
  assert.strictEqual(r.anteil, 1);
});

test('pointercancel bricht ab: nichts gesetzt, Geist weg, keine Auswahl', () => {
  const t = aufbau(); const c = t.chip('A');
  c.dispatchEvent(ev(t.w, 'pointerdown', 0, 0)); c.dispatchEvent(ev(t.w, 'pointermove', 20, 20));
  t.w.__ziel = t.spot(0); c.dispatchEvent(ev(t.w, 'pointermove', 40, 40));
  assert.ok(t.d.querySelector('.fx-chip.drag'));
  c.dispatchEvent(ev(t.w, 'pointercancel', 40, 40));
  assert.strictEqual(t.sel(0).value, ''); assert.ok(!t.d.querySelector('.fx-chip.drag'));
  assert.strictEqual(c.parentNode, t.ablage); assert.ok(!c.classList.contains('ghosted') && !c.classList.contains('sel'));
  assert.ok(!t.spot(0).classList.contains('over'));
});

test('Klick nach dem Ziehen hinterlässt keine Auswahl, Platzierung genau einmal', () => {
  const t = aufbau(); let n = 0;
  t.sel(0).addEventListener('change', () => n++);
  ziehe(t, t.chip('A'), t.spot(0));
  t.chip('A').dispatchEvent(new t.w.MouseEvent('click', { bubbles: true }));
  assert.ok(!t.chip('A').classList.contains('sel')); assert.strictEqual(n, 1); assert.strictEqual(t.sel(0).value, 'A');
});

test('Rechte Maustaste startet kein Ziehen', () => {
  const t = aufbau(); const c = t.chip('A');
  c.dispatchEvent(new t.w.MouseEvent('pointerdown', { button: 2, bubbles: true }));
  c.dispatchEvent(ev(t.w, 'pointerup', 0, 0));
  assert.ok(!c.classList.contains('sel'));
});

test('Aufgeben (versuche=1): Bausteine auf der Lösung, ohne Wirkung', async () => {
  const w = mitDb(dom(html(null, true).replace('data-fx-kontrolle="1"', 'data-fx-kontrolle="1" data-fx-versuche="1"')));
  const FX = lade(w, 'store', 'felder', 'quiz', 'ziehen'); const d = w.document; d.elementFromPoint = () => w.__ziel;
  const s = await FX.store.oeffne('k'); await FX.felder.start(s);
  const t = { w, d, spot: i => d.querySelectorAll('.spot')[i], sel: i => d.querySelectorAll('select.gap')[i], chip: v => d.querySelector(`.fx-chip[data-v="${v}"]`) };
  ziehe(t, t.chip('B'), t.spot(0)); ziehe(t, t.chip('A'), t.spot(1));
  await FX.felder.pruefen(d.querySelector('[data-fx-id="k/k/b"]'));
  assert.strictEqual(t.spot(0).querySelector('.fx-chip').dataset.v, 'A');
  assert.strictEqual(t.spot(1).querySelector('.fx-chip').dataset.v, 'B');
  ziehe(t, t.chip('Z'), t.spot(0));
  t.chip('Z').dispatchEvent(ev(w, 'pointerdown', 0, 0)); t.chip('Z').dispatchEvent(ev(w, 'pointerup', 0, 0));
  t.spot(0).dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  assert.strictEqual(t.sel(0).value, 'A'); assert.ok(!t.chip('Z').classList.contains('sel'));
  assert.strictEqual(t.spot(0).querySelector('.fx-chip').dataset.v, 'A');
});
