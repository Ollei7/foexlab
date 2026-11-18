const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, plain } = require('./helfer');

const HTML = `<div class="fx-stift"><div class="fx-stift-leiste">
<button type="button" data-werkzeug="stift" aria-pressed="true">Stift</button><button type="button" data-werkzeug="radierer">Radierer</button>
<button type="button" class="fx-rueckgaengig">Rückgängig</button><button type="button" class="fx-wiederholen">Wiederholen</button>
<button type="button" class="fx-mehr-platz">+ mehr Platz</button>
<select class="fx-hintergrund"><option value="linien">Linien</option><option value="karo">Karo</option><option value="leer">leer</option></select>
<label><input type="checkbox" class="fx-nur-pencil" checked> Nur Apple Pencil</label></div><canvas></canvas></div>`;

function aufbau() {
  const w = dom(HTML); const FX = lade(w, 'stiftfeld');
  let n = 0;
  const c = w.document.querySelector('.fx-stift');
  const s = FX.stiftfeld.binde(c, { beiAenderung: () => n++ });
  return { w, FX, s, c, aenderungen: () => n };
}

test('Strich beginnen, ziehen, beenden', () => {
  const { s, aenderungen } = aufbau();
  s.beginne(0.1, 20, 0); s.ziehe(0.2, 30); s.ziehe(0.3, 40); s.beende();
  assert.strictEqual(s.striche().length, 1);
  assert.strictEqual(s.striche()[0].punkte.length, 3);
  assert.strictEqual(aenderungen(), 1);
});

test('hängender Strich wird bei neuem pointerdown beendet', () => {
  const { s, aenderungen } = aufbau();
  s.beginne(0.1, 20, 0);            // pointerup ging verloren
  s.beginne(0.5, 50, 0);
  assert.strictEqual(s.striche().length, 2);
  assert.strictEqual(aenderungen(), 1, 'der erste Strich wurde abgeschlossen und gemeldet');
  s.beende();
  assert.strictEqual(aenderungen(), 2);
});

test('hängender Strich wird bei visibilitychange und blur beendet', () => {
  let r = aufbau();
  r.s.beginne(0.1, 20, 0);
  r.w.document.dispatchEvent(new r.w.Event('visibilitychange'));
  assert.strictEqual(r.aenderungen(), 1);
  r = aufbau(); r.s.beginne(0.1, 20, 0);
  r.w.dispatchEvent(new r.w.Event('blur'));
  assert.strictEqual(r.aenderungen(), 1);
});

test('Rückgängig und Wiederholen', () => {
  const { s } = aufbau();
  s.beginne(0.1, 20, 0); s.beende(); s.beginne(0.2, 20, 0); s.beende();
  s.rueckgaengig(); assert.strictEqual(s.striche().length, 1);
  s.wiederholen(); assert.strictEqual(s.striche().length, 2);
  s.rueckgaengig(); s.rueckgaengig(); s.rueckgaengig(); assert.strictEqual(s.striche().length, 0);
});

test('Radierer entfernt getroffene Striche, Rückgängig holt sie zurück', () => {
  const { s } = aufbau();
  s.beginne(0.1, 20, 0); s.ziehe(0.2, 20); s.beende();
  s.beginne(0.8, 200, 0); s.ziehe(0.9, 200); s.beende();
  s.setzeWerkzeug('radierer');
  s.beginne(0.15, 21, 0); s.beende();
  assert.strictEqual(s.striche().length, 1);
  assert.strictEqual(s.striche()[0].punkte[0][0], 0.8);
  s.rueckgaengig(); assert.strictEqual(s.striche().length, 2);
});

test('mehr Platz: +120, setze und lies Striche und Höhe', () => {
  const { s, c } = aufbau();
  const h = s.hoehe();
  c.querySelector('.fx-mehr-platz').click();
  assert.strictEqual(s.hoehe(), h + 120);
  s.setzeHoehe(500); assert.strictEqual(s.hoehe(), 500);
  s.setze([{ farbe: '#33416E', breite: 2, punkte: [[0.1, 10], [0.2, 20]] }]);
  assert.deepStrictEqual(plain(s.striche()).length, 1);
});

test('Andruck verbreitert den Strich, Radierer erzeugt keinen Strich', () => {
  const { s } = aufbau();
  s.beginne(0.1, 20, 0.9); s.beende(); s.beginne(0.2, 20, 0.1); s.beende();
  assert.ok(s.striche()[0].breite > s.striche()[1].breite);
});

test('Nur Apple Pencil: Finger zeichnet nicht, Pencil schon; ausgeschaltet zeichnet der Finger', () => {
  const { w, s, c } = aufbau();
  const cv = c.querySelector('canvas');
  cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 240 });
  const ereignis = (typ, art, x, y) => { const e = new w.Event(typ, { bubbles: true, cancelable: true }); e.pointerType = art; e.clientX = x; e.clientY = y; e.pressure = 0.5; e.pointerId = 1; return e; };
  cv.dispatchEvent(ereignis('pointerdown', 'touch', 100, 50)); cv.dispatchEvent(ereignis('pointerup', 'touch', 100, 50));
  assert.strictEqual(s.striche().length, 0);
  cv.dispatchEvent(ereignis('pointerdown', 'pen', 100, 50)); cv.dispatchEvent(ereignis('pointermove', 'pen', 200, 60)); cv.dispatchEvent(ereignis('pointerup', 'pen', 200, 60));
  assert.strictEqual(s.striche().length, 1);
  c.querySelector('.fx-nur-pencil').checked = false; c.querySelector('.fx-nur-pencil').dispatchEvent(new w.Event('change', { bubbles: true }));
  cv.dispatchEvent(ereignis('pointerdown', 'touch', 100, 50)); cv.dispatchEvent(ereignis('pointerup', 'touch', 100, 50));
  assert.strictEqual(s.striche().length, 2);
});
