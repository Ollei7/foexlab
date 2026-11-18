const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, ladeDatei, plain } = require('../helfer');

const klartext = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const LOESUNG = { n1L: 'c_n1L', n1R: 'c_n1R', n2L: 'c_n2L', n2R: 'c_n2R', n3L: 'c_n3L', n3R: 'c_n3R', p1: 'c_p1', p2: 'c_p2', p3: 'c_p3', p4: 'c_p4', p5: 'c_p5', p6: 'c_p6', e0: 'c_e0', e1: 'c_e1', e2: 'c_e2', e3: 'c_e3' };

function aufbau() {
  const w = dom('<div class="fx-feld" data-fx-id="a/k/bd" data-fx-art="baumdiagramm" data-fx-titel="Frage 3"><div class="fx-werkzeug-flaeche"></div></div>');
  lade(w, 'store', 'felder');
  ladeDatei(w, 'kurse/bb84/werkzeuge/bb84kern.js'); const FX = ladeDatei(w, 'kurse/bb84/werkzeuge/baumdiagramm.js');
  const el = w.document.querySelector('.fx-feld'), H = FX.felder.arten.baumdiagramm; H.init(el);
  const karte = (id) => el.querySelector(`.fx-bd-karte[data-karte="${id}"]`), feld = (id) => el.querySelector(`.fx-bd-feld[data-feld="${id}"]`);
  return { w, el, H, karte, feld, wert: () => plain(H.wert(el)), q: (s) => el.querySelector(s), alle: () => { for (const [f, k] of Object.entries(LOESUNG)) el._bdLege(k, f); } };
}

test('Tippen: Kärtchen wählen, Feld antippen legt es ab', () => {
  const { karte, feld, wert } = aufbau();
  karte('c_n1L').click(); assert.strictEqual(karte('c_n1L').getAttribute('aria-pressed'), 'true');
  feld('n1L').click();
  assert.deepStrictEqual(wert().belegung, { n1L: 'c_n1L' });
  assert.strictEqual(karte('c_n1L').disabled, true); assert.match(feld('n1L').textContent, /Basis Bob ≠ Basis Alice/);
});

test('Ein belegtes Feld nimmt kein zweites Kärtchen (Review Focus 5)', () => {
  const { karte, feld, wert, q } = aufbau();
  karte('c_n1L').click(); feld('n1L').click();
  karte('c_n1R').click(); feld('n1L').click();
  assert.deepStrictEqual(wert().belegung, { n1L: 'c_n1L' });
  assert.match(q('.fx-bd-rueckmeldung').textContent, /schon belegt/);
  assert.strictEqual(karte('c_n1R').disabled, false);
});

test('Zurücklegen: Tipp auf ein belegtes Feld ohne gewähltes Kärtchen', () => {
  const { karte, feld, wert } = aufbau();
  karte('c_n1L').click(); feld('n1L').click();
  feld('n1L').click();
  assert.deepStrictEqual(wert().belegung, {}); assert.strictEqual(karte('c_n1L').disabled, false); assert.strictEqual(feld('n1L').textContent.trim(), '?');
});

test('Die sechs ½ sind untereinander austauschbar: c_p4 in p1 zählt als richtig', () => {
  const { el, H, q } = aufbau();
  el._bdLege('c_p4', 'p1'); q('.fx-bd-pruefen').click();
  assert.strictEqual(plain(H.wert(el)).richtig, 1); assert.match(q('.fx-bd-rueckmeldung').textContent, /1 von 16 Feldern richtig/);
});

test('Typen: ½ gehört nur auf Pfade, Ereignisse und Ergebnisse nur in Knoten und Endfelder', () => {
  const { karte, feld, wert } = aufbau();
  karte('c_p1').click(); feld('n1L').click(); assert.deepStrictEqual(wert().belegung, {});
  karte('c_p1').click(); feld('n1L').click();   // Auswahl aufgehoben und erneut gewählt, immer noch abgelehnt
  karte('c_n1L').click(); feld('p1').click(); assert.deepStrictEqual(wert().belegung, {});
  karte('c_e0').click(); feld('n1L').click(); assert.deepStrictEqual(wert().belegung, { n1L: 'c_e0' });   // wie bei Dominik möglich, aber falsch
});

test('Volle richtige Belegung: 16 von 16', () => {
  const { el, H, alle, q } = aufbau();
  alle(); q('.fx-bd-pruefen').click();
  assert.strictEqual(plain(H.wert(el)).richtig, 16); assert.strictEqual(plain(H.wert(el)).geprueft, true);
  assert.match(q('.fx-bd-rueckmeldung').textContent, /Alle 16 Felder richtig|16 von 16 Feldern richtig/);
  assert.strictEqual(el.querySelectorAll('.fx-bd-feld.fx-richtig').length, 16);
});

test('Falsch belegte Felder werden rot, richtige grün', () => {
  const { el, q } = aufbau();
  el._bdLege('c_n1R', 'n1L'); el._bdLege('c_n1R'.replace('n1R', 'n1L'), 'n1R'); q('.fx-bd-pruefen').click();
  assert.strictEqual(el.querySelectorAll('.fx-bd-feld.fx-falsch').length, 2); assert.strictEqual(el.querySelectorAll('.fx-bd-feld.fx-richtig').length, 0);
});

test('Die untere Vertauschung (Knoten und Ergebnis zusammen) zählt als richtig', () => {
  const { el, H, alle, q } = aufbau();
  alle(); el._bdZurueck('n3L'); el._bdZurueck('n3R'); el._bdZurueck('e2'); el._bdZurueck('e3');
  el._bdLege('c_n3R', 'n3L'); el._bdLege('c_n3L', 'n3R'); el._bdLege('c_e3', 'e2'); el._bdLege('c_e2', 'e3');
  q('.fx-bd-pruefen').click(); assert.strictEqual(plain(H.wert(el)).richtig, 16);
  el._bdZurueck('e2'); el._bdLege('c_e2', 'e2'); q('.fx-bd-pruefen').click();   // nur teilweise vertauscht
  assert.ok(plain(H.wert(el)).richtig < 16);
});

test('Lösung aufdecken zeigt die gezeichnete Lösung und verbirgt sie wieder', () => {
  const { q } = aufbau();
  q('.fx-bd-loesungsknopf').click();
  assert.strictEqual(q('.fx-bd-loesung').hidden, false); assert.match(q('.fx-bd-loesung').innerHTML, /<svg/); assert.match(klartext(q('.fx-bd-loesung').innerHTML), /Eve hat sich verraten!/);
  q('.fx-bd-loesungsknopf').click(); assert.strictEqual(q('.fx-bd-loesung').hidden, true);
});

test('Zurücksetzen leert alle Felder', () => {
  const { el, H, alle, q } = aufbau();
  alle(); q('.fx-bd-zurueck').click();
  assert.deepStrictEqual(plain(H.wert(el)).belegung, {}); assert.strictEqual(plain(H.wert(el)).geprueft, false);
  assert.ok(H.leer(H.wert(el)));
});

test('Laden stellt die Belegung wieder her; ungültige Einträge werden ignoriert', () => {
  const { el, H, feld, karte } = aufbau();
  H.laden(el, { belegung: { n1L: 'c_n1L', p1: 'c_p3', xx: 'c_n1R', n2L: 'c_p1' }, geprueft: true, richtig: 2 });
  assert.deepStrictEqual(plain(H.wert(el)).belegung, { n1L: 'c_n1L', p1: 'c_p3' });
  assert.strictEqual(karte('c_p3').disabled, true); assert.match(feld('p1').textContent, /½/);
});

test('Protokoll: gezeichnetes Diagramm und Zählung', () => {
  const { el, H, alle } = aufbau();
  alle(); el._bdZurueck('e0');
  const teile = plain(H.protokoll(el, H.wert(el)));
  const g = teile.find((t) => t.typ === 'grafik'), t = teile.find((x) => x.typ === 'text');
  assert.strictEqual(g.titel, undefined, 'kein doppelter Titel über der Grafik'); assert.match(g.svg, /^<svg/); assert.match(klartext(g.svg), /Eve hat sich verraten!/);
  assert.strictEqual(t.text, '15 von 16 Feldern richtig');
  assert.strictEqual(H.leer({ belegung: {} }), true);
});

test('Skalierung: alle 16 Feldrechtecke liegen bei 676, 900 und 1024 px Breite im Container', () => {
  const w = dom(); lade(w, 'store', 'felder'); ladeDatei(w, 'kurse/bb84/werkzeuge/bb84kern.js'); const FX = ladeDatei(w, 'kurse/bb84/werkzeuge/baumdiagramm.js');
  const { ZONEN, skalierung, HOEHE } = FX.bb84.baumdiagramm;
  assert.strictEqual(ZONEN.length, 16);
  for (const b of [676, 900, 1024, 1400]) {
    const f = skalierung(b);
    assert.ok(f > 0 && f <= 1);
    for (const z of ZONEN) {
      assert.ok((z.x - z.w / 2) * f >= 0 && (z.x + z.w / 2) * f <= b + 1e-9, `${z.id} bei ${b}: ${(z.x + z.w / 2) * f}`);
      assert.ok((z.y + z.h) * f <= HOEHE * f + 1e-9);
    }
  }
  assert.strictEqual(skalierung(5000), 1);
});

test('Hülle und Baum werden auf die verfügbare Breite skaliert und bei Größenänderung neu berechnet', () => {
  const w = dom('<div class="fx-feld" data-fx-id="a/k/bd" data-fx-art="baumdiagramm"><div class="fx-werkzeug-flaeche"></div></div>'); lade(w, 'store', 'felder');
  let breite = 676; Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', { get() { return this.classList && this.classList.contains('fx-bd-huelle') ? breite : 0; } });
  ladeDatei(w, 'kurse/bb84/werkzeuge/bb84kern.js'); const FX = ladeDatei(w, 'kurse/bb84/werkzeuge/baumdiagramm.js');
  const el = w.document.querySelector('.fx-feld'); FX.felder.arten.baumdiagramm.init(el);
  const { skalierung, HOEHE } = FX.bb84.baumdiagramm, f = skalierung(676);
  const baum = () => el.querySelector('.fx-bd-baum'), huelle = () => el.querySelector('.fx-bd-huelle');
  assert.match(baum().style.transform, new RegExp('scale\\(' + f)); assert.strictEqual(huelle().style.height, Math.ceil(HOEHE * f) + 'px');
  breite = 900; w.dispatchEvent(new w.Event('resize')); w.document.dispatchEvent(new w.CustomEvent('fx:ansicht'));
  assert.match(baum().style.transform, new RegExp('scale\\(' + skalierung(900)));
});
