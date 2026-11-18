const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, plain } = require('./helfer');

const breite = (t, pt) => String(t).length * pt * 0.18;
const strich = { farbe: '#33416E', breite: 2.4, punkte: [[0.1, 20], [0.4, 60], [0.7, 30]] };

function prot(eintraege) {
  return { kurs: { id: 'k', titel: 'Kurs' }, datum: '22.10.2026', gruppe: 'Ada', abschnitte: [{ titel: '3 Durchführung', eintraege }] };
}
const e = (id, titel, extra) => Object.assign({ id: 'a/k/' + id, titel, art: 'text', leer: false }, extra);
const ops = (seiten, art) => Array.from(seiten).flatMap((s) => Array.from(s.ops)).filter((o) => o.art === art);
const texte = (seiten) => ops(seiten, 'text').map((o) => o.text);

test('Tabelle mit Markierung färbt Zeilen grün und rot', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const p = prot([e('t', 'Vergleich', { teile: [{ typ: 'tabelle', kopf: ['Nr', 'Basis'], zeilen: [['1', '+'], ['2', '×']], markierung: ['ok', 'fehler'] }] })]);
  const r = ops(FX.pdf.plane(p, { breite }), 'rechteck');
  assert.deepStrictEqual(r.map((o) => o.farbe), ['#E6F1E6', '#F8E3E3']);
});

test('Striche-Teil wird zur linien-Op mit 170 mm Breite', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const p = prot([e('s', 'Antwort', { teile: [{ typ: 'striche', striche: [strich], verhaeltnis: 1000 / 240 }] })]);
  const l = ops(FX.pdf.plane(p, { breite }), 'linien');
  assert.strictEqual(l.length, 1); assert.strictEqual(l[0].w, 170);
  assert.ok(Math.abs(l[0].h - 170 * 240 / 1000) < 1e-9);
  assert.strictEqual(l[0].striche.length, 1);
});

test('Text-Teil und Grafik-Teil', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const p = prot([e('g', 'Diagramm', { teile: [{ typ: 'text', text: 'x von 16 richtig' }, { typ: 'grafik', svg: '<svg/>', bildDaten: { url: 'data:image/png;base64,AA', w: 1440, h: 900 } }] })]);
  const s = FX.pdf.plane(p, { breite });
  assert.ok(texte(s).includes('x von 16 richtig'));
  assert.strictEqual(ops(s, 'bild').length, 1);
});

test('Noch offen: Abschnitt am Ende mit allen leeren Titeln', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const p = prot([e('a', 'Voll', { text: 'ja' }), e('b', 'Leer eins', { leer: true }), e('c', 'Leer zwei', { leer: true })]);
  const t = texte(FX.pdf.plane(p, { breite }));
  const i = t.indexOf('Noch offen');
  assert.ok(i > 0);
  assert.ok(t.slice(i).some((x) => x.includes('Leer eins')) && t.slice(i).some((x) => x.includes('Leer zwei')));
  assert.ok(!t.slice(i).some((x) => x.includes('Voll')));
});

test('Keine leeren Einträge: kein Abschnitt Noch offen', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  assert.ok(!texte(FX.pdf.plane(prot([e('a', 'Voll', { text: 'ja' })]), { breite })).includes('Noch offen'));
});

test('Bit-Text ohne Leerzeichen wird umgebrochen, nichts ragt über den Rand', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const lang = '0'.repeat(120);
  const p = prot([e('b', 'Bits', { teile: [{ typ: 'text', text: lang }, { typ: 'tabelle', kopf: ['Bits'], zeilen: [[lang]] }] })]);
  for (const o of ops(FX.pdf.plane(p, { breite }), 'text')) assert.ok(o.x + breite(o.text, o.pt) <= 192 + 1e-6, o.text.slice(0, 10));
});

test('Ergebnisseite stellt Teile dar', () => {
  const w = dom('<div id="b"></div>'); const FX = lade(w, 'protokoll');
  const p = prot([e('t', 'Tab', { teile: [{ typ: 'text', text: 'Hallo' }, { typ: 'tabelle', kopf: ['A'], zeilen: [['1'], ['2']], markierung: ['ok', 'fehler'] },
    { typ: 'grafik', svg: '<svg viewBox="0 0 10 10"></svg>' }, { typ: 'striche', striche: [strich], verhaeltnis: 4 }] }), e('o', 'Offen', { leer: true })]);
  const h = FX.protokoll.html(p);
  assert.match(h, /Hallo/); assert.match(h, /<tr class="fx-ok">/); assert.match(h, /<tr class="fx-fehler">/);
  assert.match(h, /<svg viewBox/); assert.match(h, /<canvas[^>]+data-striche/);
  assert.match(h, /Noch offen[\s\S]*Offen/);
});

test('Ergebnisseite ohne leere Einträge: kein Noch offen', () => {
  const w = dom(); const FX = lade(w, 'protokoll');
  assert.ok(!/Noch offen/.test(FX.protokoll.html(prot([e('a', 'Voll', { text: 'ja' })]))));
});

test('erzeuge zeichnet Striche, Tabellenfarben und Noch offen mit echtem jsPDF', async () => {
  const { jsPDF } = require('jspdf');
  const w = dom(); const FX = lade(w, 'pdf');
  const p = prot([e('s', 'Antwort', { teile: [{ typ: 'text', text: 'Hallo' }, { typ: 'striche', striche: [strich, { farbe: '#33416E', breite: 2, punkte: [[0.5, 100]] }], verhaeltnis: 1000 / 240 },
    { typ: 'tabelle', kopf: ['A'], zeilen: [['1'], ['2']], markierung: ['ok', 'fehler'] }] }), e('o', 'Offen', { leer: true })]);
  const b = await FX.pdf.erzeuge(p, { jsPDF, bild: async () => null });
  assert.ok(b.length > 800); assert.strictEqual(String.fromCharCode(...b.slice(0, 4)), '%PDF');
});

test('Ergebnisseite: freiwillige leere Felder stehen nicht unter Noch offen', () => {
  const w = dom(); const FX = lade(w, 'protokoll');
  const h = FX.protokoll.html(prot([e('p', 'Pflichtfeld', { leer: true }), e('n', 'Freie Notizen', { leer: true, optional: true })]));
  assert.match(h, /Pflichtfeld/); assert.ok(!/Freie Notizen/.test(h));
});

test('sammle markiert freiwillige Felder', () => {
  const w = dom('<section class="fx-karte" data-abschnitt="A"><div class="fx-feld" data-fx-id="a/k/n" data-fx-art="text" data-fx-titel="N" data-fx-optional="1"><textarea></textarea></div></section>');
  const FX = lade(w, 'store', 'felder', 'protokoll');
  assert.strictEqual(plain(FX.protokoll.sammle(w.document, {}, { id: 'k', titel: 'K' }, new Date())).abschnitte[0].eintraege[0].optional, true);
});

test('Noch offen: einzelne Selbstkontrollfragen (quiz) fehlen, Quiz-Serien stehen drin', () => {
  const w = dom(); const FX = lade(w, 'pdf', 'protokoll');
  const p = prot([e('q', 'Einzelfrage MC', { art: 'quiz', leer: true }), e('s', 'Verständnisfragen – Kapitel 2', { art: 'quizserie', leer: true }), e('t', 'Textfeld', { leer: true })]);
  const t = Array.from(FX.pdf.plane(p, { breite })).flatMap((s) => Array.from(s.ops)).filter((o) => o.art === 'text').map((o) => o.text).slice();
  const ab = t.slice(t.indexOf('Noch offen'));
  assert.ok(ab.some((x) => x.includes('Verständnisfragen')) && ab.some((x) => x.includes('Textfeld')) && !ab.some((x) => x.includes('Einzelfrage')));
  const h = FX.protokoll.html(p); const off = h.slice(h.indexOf('Noch offen'));
  assert.ok(/Verständnisfragen/.test(off) && /Textfeld/.test(off) && !/Einzelfrage/.test(off));
});
