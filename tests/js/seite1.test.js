const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, plain } = require('./helfer');

const breite = (t, pt) => String(t).length * pt * 0.18;
const texte = (seiten) => Array.from(seiten).map((s) => Array.from(s.ops).filter((o) => o.art === 'text' && !o.fuss).map((o) => o.text));
const e = (id, titel, extra) => Object.assign({ id, titel, art: 'text', leer: false, text: '' }, extra);

function prot(blick, rolle) {
  return { kurs: { id: 'bb84', titel: 'BB84' }, datum: '22.10.2026', gruppe: 'Ada', rolle: rolle || '', blick,
    abschnitte: [{ titel: '0 Lernblatt', eintraege: [e('lern/k/f', 'Frage', { text: 'Antwort' })] }, { titel: '2 Grundlagen', eintraege: [e('g/k/def-zustand', 'Z', { text: 'Ein Zustand ist ein Vorhersagekatalog.', blick: true })] }] };
}
const BLICK = (z, p) => ({ definitionen: [{ titel: 'Quantenzustand', eintrag: z }, { titel: 'Präparation', eintrag: p }, { titel: 'Messung', eintrag: e('x', 'M', { leer: true }) }, { titel: 'Superposition', eintrag: e('y', 'S', { leer: true }) }],
  zusammenfassung: 'Quantenzustand: Vorhersagekatalog.\nSifting: Bits mit ungleichen Basen werden verworfen.' });

test('Seite 1: Meine Definitionen mit zwei Antworten und zweimal „noch nicht ausgefüllt“', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const z = e('g/k/def-zustand', 'Z', { text: 'Ein Zustand ist ein Vorhersagekatalog.' }), p = e('g/k/def-praeparation', 'P', { text: 'Gezielt herstellen.' });
  const s1 = texte(FX.pdf.plane(prot(BLICK(z, p)), { breite }))[0];
  assert.ok(s1.includes('Meine Definitionen'));
  assert.ok(s1.some((t) => t.includes('Vorhersagekatalog')) && s1.some((t) => t.includes('Gezielt herstellen')));
  assert.strictEqual(s1.filter((t) => t === 'noch nicht ausgefüllt').length, 2);
  assert.ok(s1.includes('Das hast du gelernt') && s1.some((t) => t.includes('Sifting')));
});

test('Seite 2 beginnt mit dem Lernblatt; Definitionen stehen nicht doppelt im Protokoll', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const z = e('g/k/def-zustand', 'Z', { text: 'Ein Zustand ist ein Vorhersagekatalog.', blick: true });
  const seiten = texte(FX.pdf.plane(prot(BLICK(z, e('g/k/def-praeparation', 'P', { leer: true }))), { breite }));
  assert.ok(seiten.length >= 2); assert.strictEqual(seiten[1][0], '0 Lernblatt');
  assert.strictEqual(seiten.slice(1).flat().filter((t) => t.includes('Vorhersagekatalog')).length, 0);
});

test('Handschrift auf Seite 1 als Linien', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const z = e('g/k/def-zustand', 'Z', { teile: [{ typ: 'striche', striche: [{ farbe: '#33416E', breite: 2, punkte: [[0.1, 10], [0.5, 40]] }], verhaeltnis: 1000 / 240 }] });
  const ops = FX.pdf.plane(prot(BLICK(z, e('p', 'P', { leer: true }))), { breite })[0].ops;
  assert.ok(ops.some((o) => o.art === 'linien'));
});

test('Ohne auf_einen_blick bleibt alles wie vorher: Protokoll beginnt auf Seite 1', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const s1 = texte(FX.pdf.plane(prot(undefined), { breite }))[0];
  assert.ok(!s1.includes('Meine Definitionen') && !s1.includes('Das hast du gelernt')); assert.ok(s1.includes('0 Lernblatt'));
});

test('Rolle im Kopf, sofern gesetzt', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const kopf = (r) => texte(FX.pdf.plane(prot(undefined, r), { breite }))[0].find((t) => t.startsWith('Datum:'));
  assert.match(kopf('alice'), /Gruppe: Ada.*Rolle: Alice/); assert.ok(!/Rolle/.test(kopf('')));
});

const KARTEN = `<section class="fx-karte" data-karte="g/k" data-abschnitt="2 Grundlagen">
  <div class="fx-feld" data-fx-id="g/k/def-zustand" data-fx-art="text" data-fx-titel="Zustand"><textarea></textarea></div>
  <div class="fx-feld" data-fx-id="g/k/def-praeparation" data-fx-art="text" data-fx-titel="Präparation"><textarea></textarea></div></section>
<section class="fx-karte" data-karte="abschluss/gelernt" data-abschnitt="4 Abschluss"><h2>Das hast du gelernt</h2><aside class="fx-merksatz"><ul><li><strong>Quantenzustand:</strong> Vorhersagekatalog.</li><li><strong>Sifting:</strong> Verwerfen.</li></ul></aside></section>`;

test('sammle: Definitionen über die Kennung am Ende der Feld-ID, Zusammenfassung aus der Karte, Rolle', () => {
  const w = dom(KARTEN); const FX = lade(w, 'store', 'felder', 'protokoll');
  const kurs = { id: 'bb84', titel: 'BB84', auf_einen_blick: { definitionen: { Quantenzustand: 'def-zustand', Präparation: 'def-praeparation', Messung: 'def-messung' }, zusammenfassung: 'abschluss/gelernt' } };
  const p = plain(FX.protokoll.sammle(w.document, { 'g/k/def-zustand': { text: 'Mein Zustand' }, _gruppe: { namen: 'Ada' }, _rolle: 'bob' }, kurs, new Date(2026, 9, 22)));
  assert.deepStrictEqual(p.blick.definitionen.map((d) => d.titel), ['Quantenzustand', 'Präparation', 'Messung']);
  assert.strictEqual(p.blick.definitionen[0].eintrag.text, 'Mein Zustand'); assert.strictEqual(p.blick.definitionen[1].eintrag.leer, true); assert.strictEqual(p.blick.definitionen[2].eintrag.leer, true);
  assert.strictEqual(p.blick.zusammenfassung, 'Quantenzustand: Vorhersagekatalog.\nSifting: Verwerfen.');
  assert.strictEqual(p.rolle, 'bob');
  assert.ok(p.abschnitte[0].eintraege.every((x) => x.blick), 'Definitionsfelder sind markiert');
  assert.strictEqual(plain(FX.protokoll.sammle(w.document, {}, { id: 'm', titel: 'M' }, new Date())).blick, undefined);
});

test('Ergebnisseite zeigt Auf einen Blick oben und lässt die Definitionen im Verlauf weg', () => {
  const w = dom(); const FX = lade(w, 'protokoll');
  const z = e('g/k/def-zustand', 'Z', { text: 'Mein Zustand', blick: true });
  const h = FX.protokoll.html(prot(BLICK(z, e('p', 'P', { leer: true })), 'alice'));
  assert.ok(h.indexOf('Auf einen Blick') < h.indexOf('0 Lernblatt'));
  assert.match(h, /Meine Definitionen/); assert.match(h, /noch nicht ausgefüllt/); assert.match(h, /Das hast du gelernt/); assert.match(h, /Rolle: Alice/);
  assert.strictEqual((h.match(/Mein Zustand/g) || []).length, 1);
});
