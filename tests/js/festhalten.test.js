const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb } = require('./helfer');

const TA = '<textarea class="fx-text"></textarea>';
const fd = (id, art, extra) => `<div class="fx-feld" data-fx-id="${id}" data-fx-art="${art}" ${extra || ''}>${TA}</div>`;
// Kapitel a: Karte k1 (Vermutung v, Feld f), Karte k2 (Feld g); Kapitel b: Karte k3 (Feld h)
const HTML = `<div class="fx-karte" data-karte="a/k1" data-abschnitt-id="a">${fd('a/k1/v', 'vermutung')}${fd('a/k1/f', 'text')}</div>
<div class="fx-karte" data-karte="a/k2" data-abschnitt-id="a">${fd('a/k2/g', 'text')}</div>
<div class="fx-karte" data-karte="b/k3" data-abschnitt-id="b">${fd('b/k3/h', 'text')}</div>`;

async function aufbau(html, werte, vorher) {
  const w = mitDb(dom(html || HTML)); const FX = lade(w, 'store', 'felder', 'stiftfeld', 'antwort');
  if (vorher) vorher(FX, w);
  const s = await FX.store.oeffne('k');
  for (const k of Object.keys(werte || {})) await s.schreibe(k, werte[k]);
  await FX.felder.start(s);
  const d = w.document, q = (id) => d.querySelector(`[data-fx-id="${id}"]`);
  const tippe = (id, t) => { const ta = q(id).querySelector('textarea'); ta.value = t; ta.dispatchEvent(new w.Event('input', { bubbles: true })); };
  return { w, FX, s, d, q, tippe };
}
const fest = (el) => el.hasAttribute('data-fx-festgehalten');

test('Vermutung bleibt bearbeitbar, solange danach im Kapitel nichts ausgefüllt ist', async () => {
  const { q, tippe } = await aufbau();
  tippe('a/k1/v', 'Wird heller');
  assert.ok(!fest(q('a/k1/v')));
  assert.strictEqual(q('a/k1/v').querySelector('textarea').readOnly, false);
  assert.ok(!q('a/k1/v').querySelector('.fx-festhinweis'));
});

test('späteres Feld derselben Karte ausgefüllt → festgehalten (readOnly, Hinweis)', async () => {
  const { q, tippe } = await aufbau();
  tippe('a/k1/f', 'Messwert');
  const v = q('a/k1/v');
  assert.ok(fest(v)); assert.strictEqual(v.querySelector('textarea').readOnly, true);
  assert.strictEqual(v.querySelector('.fx-festhinweis').textContent, 'Festgehalten – eure Hypothese vor der Messung.');
  assert.strictEqual(v.querySelectorAll('.fx-festhinweis').length, 1);
  tippe('a/k1/f', 'Messwert 2');
  assert.strictEqual(v.querySelectorAll('.fx-festhinweis').length, 1);
});

test('Feld auf späterer Karte desselben Kapitels ausgefüllt → festgehalten', async () => {
  const { q, tippe } = await aufbau();
  tippe('a/k2/g', 'später');
  assert.ok(fest(q('a/k1/v')));
});

test('Feld in einem anderen Kapitel → nicht festgehalten', async () => {
  const { q, tippe } = await aufbau();
  tippe('b/k3/h', 'anderes Kapitel');
  assert.ok(!fest(q('a/k1/v')));
});

test('Werkzeug mit hypothese:true wird über schreibschutz gesperrt', async () => {
  const log = [];
  const html = `<div class="fx-karte" data-karte="a/k1" data-abschnitt-id="a"><div class="fx-feld" data-fx-id="a/k1/w" data-fx-art="dummy"></div>${fd('a/k1/f', 'text')}</div>`;
  const { q, tippe } = await aufbau(html, {}, (FX) => FX.felder.registriere('dummy', {
    hypothese: true, laden() {}, wert() { return { x: 1 }; }, leer() { return false; },
    schreibschutz(el, an) { log.push(an); }
  }));
  assert.ok(!fest(q('a/k1/w')));
  tippe('a/k1/f', 'Messung');
  assert.ok(fest(q('a/k1/w'))); assert.strictEqual(log[log.length - 1], true);
});

test('Betreuungsmodus: nie festgehalten', async () => {
  const { w, FX, q, tippe } = await aufbau();
  FX.freischaltung = { istAllesFrei: () => true };
  tippe('a/k1/f', 'Messwert');
  assert.ok(!fest(q('a/k1/v')));
  FX.freischaltung = { istAllesFrei: () => false };
  FX.felder.sperren(w.document);
  assert.ok(fest(q('a/k1/v')));
  FX.freischaltung = { istAllesFrei: () => true };
  FX.felder.sperren(w.document);
  assert.ok(!fest(q('a/k1/v'))); assert.strictEqual(q('a/k1/v').querySelector('textarea').readOnly, false);
  assert.ok(!q('a/k1/v').querySelector('.fx-festhinweis'));
});

test('nach Neuladen mit gespeicherten Werten sofort festgehalten', async () => {
  const { q } = await aufbau(null, { 'a/k1/v': { text: 'Vermutung' }, 'a/k1/f': { text: 'Messwert' } });
  assert.ok(fest(q('a/k1/v')));
  assert.strictEqual(q('a/k1/v').querySelector('textarea').readOnly, true);
});

test('{.frei sperrt} wird nie festgehalten', async () => {
  const html = `<div class="fx-karte" data-karte="a/k1" data-abschnitt-id="a">${fd('a/k1/fr', 'text', 'data-fx-sperrt="1"')}${fd('a/k1/f', 'text')}</div>`;
  const { q, tippe } = await aufbau(html);
  tippe('a/k1/fr', 'frei'); tippe('a/k1/f', 'weiter');
  assert.ok(!fest(q('a/k1/fr')));
  assert.strictEqual(q('a/k1/fr').querySelector('textarea').readOnly, false);
});

test('Begründung (vermutung) nach Vorhersage friert die Vorhersage nicht ein', async () => {
  const html = `<div class="fx-karte" data-karte="a/k1" data-abschnitt-id="a"><div class="fx-feld" data-fx-id="a/k1/w" data-fx-art="dummy"></div>${fd('a/k1/b', 'vermutung')}${fd('a/k1/f', 'text')}</div>`;
  const { q, tippe } = await aufbau(html, {}, (FX) => FX.felder.registriere('dummy', {
    hypothese: true, laden() {}, wert() { return { x: 1 }; }, leer() { return false; }, schreibschutz() {}
  }));
  tippe('a/k1/b', 'Weil …');
  assert.ok(!fest(q('a/k1/w'))); assert.ok(!fest(q('a/k1/b')));
  tippe('a/k1/f', 'Messung');
  assert.ok(fest(q('a/k1/w'))); assert.ok(fest(q('a/k1/b')));
});

test('ohneProtokoll-Felder und leere optionale Felder lösen nichts aus', async () => {
  const html = `<div class="fx-karte" data-karte="a/k1" data-abschnitt-id="a">${fd('a/k1/v', 'vermutung')}<div class="fx-feld" data-fx-id="a/k1/o" data-fx-art="stumm"></div>${fd('a/k1/n', 'text', 'data-fx-optional="1"')}</div>`;
  const { q, tippe } = await aufbau(html, {}, (FX) => FX.felder.registriere('stumm', {
    ohneProtokoll: true, laden() {}, wert() { return { x: 1 }; }, leer() { return false; }
  }));
  assert.ok(!fest(q('a/k1/v')));
  tippe('a/k1/n', 'freiwillig');
  assert.ok(fest(q('a/k1/v')));
});

test('begonnen(wert) löst das Festhalten aus, auch wenn das Feld noch leer ist', async () => {
  let zaehl = 0;
  const html = `<div class="fx-karte" data-karte="a/k1" data-abschnitt-id="a">${fd('a/k1/v', 'vermutung')}<div class="fx-feld" data-fx-id="a/k1/m" data-fx-art="messung"></div></div>`;
  const { q, FX } = await aufbau(html, {}, (FX) => FX.felder.registriere('messung', {
    laden() {}, wert() { return { n: zaehl }; }, leer(w) { return !(w && w.n >= 5); }, begonnen(w) { return !!w && w.n > 0; }
  }));
  assert.ok(!fest(q('a/k1/v')));
  zaehl = 2; FX.felder.festhalten(q('a/k1/v').ownerDocument);
  assert.ok(fest(q('a/k1/v')), 'leer (2 von 5), aber begonnen → festgehalten');
  assert.ok(FX.felder.istLeer('messung', { n: 2 }));
});
