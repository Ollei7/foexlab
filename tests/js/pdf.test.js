const test = require('node:test');
const assert = require('node:assert');
const { dom, lade } = require('./helfer');
const { jsPDF } = require('jspdf');

const breite = (t, pt) => String(t).length * pt * 0.18;
const PNG1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function protokoll(n) {
  const eintraege = [];
  for (let i = 0; i < n; i++) eintraege.push({ id: 'a/k/' + i, titel: 'Frage ' + i, art: 'text', leer: false, text: 'Antwort ' + i + ' mit etwas längerem Text, der umgebrochen werden muss, weil er nicht in eine Zeile passt.' });
  return { kurs: { id: 'michelson', titel: 'Michelson-Interferometer' }, datum: '21.10.2026', gruppe: 'Ada, Emmy', abschnitte: [{ titel: '2 Brechungsindex', eintraege }] };
}
const alleOps = (seiten) => Array.from(seiten).flatMap((s) => Array.from(s.ops));

test('Seitenumbruch und kein Text im Fußbereich', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const seiten = FX.pdf.plane(protokoll(60), { breite });
  assert.ok(seiten.length >= 2);
  for (const s of seiten) for (const o of s.ops) if (o.art === 'text' && !o.fuss) assert.ok(o.y <= 297 - 18, o.text + ' bei ' + o.y);
});

test('Fuß mit Seitenzahl und Lizenz', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const seiten = FX.pdf.plane(protokoll(60), { breite });
  const n = seiten.length;
  const fuss = seiten[0].ops.find((o) => o.fuss);
  assert.strictEqual(fuss.text, `Seite 1 von ${n} · Aufgabentexte: foeXlab, Leibniz Universität Hannover – CC BY 4.0`);
});

test('Kopf mit Kurs, Datum und Gruppe', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const texte = FX.pdf.plane(protokoll(1), { breite })[0].ops.filter((o) => o.art === 'text').map((o) => o.text);
  assert.ok(texte.includes('Protokoll · Michelson-Interferometer'));
  assert.ok(texte.some((t) => t.includes('21.10.2026') && t.includes('Ada, Emmy')));
});

test('Haken nur bei geprüften Quizfragen', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const p = { kurs: { titel: 'K' }, datum: 'x', gruppe: '', abschnitte: [{ titel: 'A', eintraege: [
    { titel: 'Q1', art: 'quiz', leer: false, antwortText: 'Laser', anteil: 1 },
    { titel: 'Q2', art: 'quiz', leer: false, antwortText: 'LED', anteil: 0 },
    { titel: 'Q3', art: 'quiz', leer: false, antwortText: 'X', anteil: null }] }] };
  const haken = alleOps(FX.pdf.plane(p, { breite })).filter((o) => o.art === 'haken');
  assert.deepStrictEqual(Array.from(haken, (h) => h.ok), [true, false]);
});

test('aufgelöste Kontrollfrage: Text „nach 2 Versuchen aufgelöst“, kein Haken', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const p = { kurs: { titel: 'K' }, datum: 'x', gruppe: '', abschnitte: [{ titel: 'A', eintraege: [
    { titel: 'Q', art: 'quiz', leer: false, antwortText: 'Laser', anteil: 0, aufgegeben: true, versuche: 2 }] }] };
  const ops = alleOps(FX.pdf.plane(p, { breite }));
  assert.strictEqual(ops.filter((o) => o.art === 'haken').length, 0);
  assert.ok(ops.some((o) => o.art === 'text' && /Laser\s+\(nach 2 Versuchen aufgelöst\)/.test(o.text)));
});

test('aufgegebene Kontrollfrage ohne Versuche: „aufgelöst“ ohne Zahl', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const p = { kurs: { titel: 'K' }, datum: 'x', gruppe: '', abschnitte: [{ titel: 'A', eintraege: [
    { titel: 'Q', art: 'quiz', leer: false, antwortText: 'Laser', anteil: 0, aufgegeben: true }] }] };
  const ops = alleOps(FX.pdf.plane(p, { breite }));
  assert.ok(ops.some((o) => o.art === 'text' && /Laser\s+\(aufgelöst\)/.test(o.text)), 'kein „(aufgelöst)“');
  assert.ok(!ops.some((o) => o.art === 'text' && /nach\s+Versuch/.test(o.text)));
});

test('leere Einträge erscheinen nicht', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const p = { kurs: { titel: 'K' }, datum: 'x', gruppe: '', abschnitte: [{ titel: 'A', eintraege: [{ titel: 'Leer', art: 'text', leer: true, text: '' }] }] };
  assert.ok(!alleOps(FX.pdf.plane(p, { breite })).some((o) => o.text === 'Leer'));
});

test('Zeichen außerhalb von WinAnsi werden umschrieben', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  assert.strictEqual(FX.pdf.pdfText('Δp ≥ 5 · λ → ✓ äöüß „x“'), 'Delta p >= 5 · lambda -> ja äöüß „x“');
});

test('erzeuge liefert eine PDF-Datei', async () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const p = protokoll(3);
  p.abschnitte[0].eintraege.push({ titel: 'Foto', art: 'foto', leer: false, bilder: [{}] });
  p.abschnitte[0].eintraege.push({ titel: 'Messung', art: 'tabelle', leer: false, kopf: ['dp [mbar]', 'dN'], zeilen: [['92,3', '5']], svg: '<svg/>', ausgleichText: 'm = 0,05417' });
  const bytes = await FX.pdf.erzeuge(p, { jsPDF, bild: async () => ({ url: PNG1, w: 1, h: 1 }) });
  assert.strictEqual(Buffer.from(bytes.slice(0, 5)).toString(), '%PDF-');
});

test('Überschrift bleibt beim Bild', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const p = protokoll(28);
  p.abschnitte[0].eintraege.push({ titel: 'Foto vom Muster', art: 'foto', leer: false, bildDaten: [{ url: 'x', w: 4, h: 3 }] });
  const seiten = Array.from(FX.pdf.plane(p, { breite }));
  const seiteMit = (pruefe) => seiten.findIndex((s) => Array.from(s.ops).some(pruefe));
  assert.strictEqual(seiteMit((o) => o.text === 'Foto vom Muster'), seiteMit((o) => o.art === 'bild'));
});

test('Tabellenköpfe überlappen nicht', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const p = { kurs: { titel: 'K' }, datum: 'x', gruppe: '', abschnitte: [{ titel: 'A', eintraege: [
    { titel: 'Messung', art: 'tabelle', leer: false, kopf: ['Druckunterschied Delta p [mbar]', 'Anzahl Wechsel Delta N', 'n'], zeilen: [['92,3', '5', '1,0003']] }] }] };
  const texte = alleOps(FX.pdf.plane(p, { breite })).filter((o) => o.art === 'text' && o.pt === 9.5);
  const zeilen = {};
  texte.forEach((o) => { (zeilen[o.y] = zeilen[o.y] || []).push(o); });
  Object.values(zeilen).forEach((z) => {
    z.sort((a, b) => a.x - b.x);
    for (let i = 1; i < z.length; i++) assert.ok(z[i - 1].x + breite(z[i - 1].text, 9.5) <= z[i].x, `${z[i - 1].text} überlappt ${z[i].text}`);
  });
});

test('PDF-Kopf: zwei Logos nebeneinander, 10 mm hoch', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const logos = [{ url: 'a', w: 100, h: 50 }, { url: 'b', w: 200, h: 100 }];
  const ops = FX.pdf.plane(protokoll(1), { breite, logos })[0].ops.filter((o) => o.art === 'bild');
  assert.strictEqual(ops.length, 2);
  for (const o of ops) { assert.strictEqual(o.h, 10); assert.ok(o.y + o.h <= 20, 'Logo endet über der Titelzeile'); assert.ok(o.x + o.w <= 192); }
  assert.ok(ops[0].x + ops[0].w <= ops[1].x);
});

test('Fuß: eigene Lizenz aus dem Kurs, Standard bleibt', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const f = (lizenz) => FX.pdf.plane(protokoll(1), { breite, lizenz })[0].ops.find((o) => o.fuss).text;
  assert.match(f('Material: Dominik Spicka, Bachelorarbeit 2026, Leibniz Universität Hannover'), /Seite 1 von 1 · Material: Dominik Spicka/);
  assert.match(f('CC BY 4.0'), /Aufgabentexte: foeXlab/);
});

test('Symbole: ✓ ✗ ⇒ ⊕ ≠ werden umschrieben, Pfeile und ⟩ werden zu Zeichenmarken', () => {
  const w = dom(); const FX = lade(w, 'pdf'), t = FX.pdf.pdfText;
  assert.strictEqual(t('✓ ✗ ⇒ ⊕ ≠ ½ ×'), 'ja nein => (+) != ½ ×');
  assert.ok(!/\?/.test(t('|↑⟩ + 1⁄√2')));
  assert.ok(!/[VHDA]>/.test(t('|↑⟩ |→⟩ |↗⟩ |↘⟩')));
  assert.strictEqual(t('wird zu →'), 'wird zu ->');
});

const pfeile = (seiten) => Array.from(seiten).flatMap((s) => Array.from(s.ops)).filter((o) => o.art === 'pfeil');
const eintrag = (titel, text) => ({ kurs: { titel: 'K' }, datum: 'x', gruppe: '', abschnitte: [{ titel: 'A', eintraege: [{ id: 'a/b', titel, art: 'text', leer: false, text: text || 'ok' }] }] });

test('Kets: |↗⟩ wird als Pfeil gezeichnet, nicht als |D>', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const seiten = FX.pdf.plane(eintrag('Zustand |↗⟩ (diagonal)'), { breite });
  const texte = Array.from(seiten).flatMap((s) => Array.from(s.ops)).filter((o) => o.art === 'text').map((o) => o.text);
  assert.ok(!texte.some((t) => /\|D>|D>/.test(t)));
  const p = pfeile(seiten); assert.strictEqual(p.length, 1); assert.strictEqual(p[0].richtung, '↗');
  assert.ok(texte.includes('Zustand |') && texte.includes(' (diagonal)'));
  assert.ok(Array.from(seiten[0].ops).some((o) => o.art === 'klammer'));
});

test('Alle vier Pfeilrichtungen, auch in Tabellen und Fließtext', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const p = eintrag('|↑⟩ |→⟩', '|↗⟩ und |↘⟩');
  p.abschnitte[0].eintraege.push({ id: 'a/t', titel: 'T', art: 'text', leer: false, teile: [{ typ: 'tabelle', kopf: ['Zustand'], zeilen: [['↑'], ['|→⟩']] }] });
  const r = pfeile(FX.pdf.plane(p, { breite })).map((o) => o.richtung).sort().join('');
  assert.strictEqual(r, ['↑', '→', '↗', '↘', '↑', '→'].sort().join(''));
});

test('Kein Text überlappt den Pfeil, Zeilenumbruch rechnet die Pfeilbreite ein', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const text = Array(14).fill('Zustand |↗⟩ und |↘⟩ sowie').join(' ');
  const seiten = FX.pdf.plane(eintrag('Titel', text), { breite });
  const ops = Array.from(seiten).flatMap((s) => Array.from(s.ops));
  const pf = ops.filter((o) => o.art === 'pfeil' || o.art === 'klammer'), tx = ops.filter((o) => o.art === 'text' && !o.fuss);
  assert.ok(pf.length > 20);
  for (const f of pf) {
    assert.ok(f.x + f.w <= 192 + 1e-6, 'Pfeil ragt über den Rand');
    for (const t of tx) if (Math.abs(t.y - f.y) < 0.01) assert.ok(t.x + breite(t.text, t.pt) <= f.x + 1e-6 || t.x >= f.x + f.w - 1e-6, `Text „${t.text}“ überlappt`);
  }
  for (const t of tx) assert.ok(t.x + breite(t.text, t.pt) <= 192 + 1e-6);
});

test('Keine Legende mehr', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const t = Array.from(FX.pdf.plane(eintrag('Zustand |↑⟩'), { breite })).flatMap((s) => Array.from(s.ops)).filter((o) => o.art === 'text').map((o) => o.text);
  assert.ok(!t.some((x) => /antidiagonal \(-45/.test(x)));
});

test('Freiwillige Felder erscheinen nicht unter Noch offen', () => {
  const w = dom(); const FX = lade(w, 'pdf');
  const p = { kurs: { titel: 'K' }, datum: 'x', gruppe: '', abschnitte: [{ titel: 'A', eintraege: [{ id: 'a/1', titel: 'Pflicht', art: 'text', leer: true }, { id: 'a/2', titel: 'Notizen', art: 'text', leer: true, optional: true }] }] };
  const t = Array.from(FX.pdf.plane(p, { breite })).flatMap((s) => Array.from(s.ops)).filter((o) => o.art === 'text').map((o) => o.text);
  assert.ok(t.some((x) => x.includes('Pflicht'))); assert.ok(!t.some((x) => x.includes('Notizen')));
});
