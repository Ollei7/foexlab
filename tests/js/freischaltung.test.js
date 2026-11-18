const test = require('node:test');
const assert = require('node:assert');
const { dom, lade, mitDb, plain, warte } = require('./helfer');

const li = (id, t) => `<li data-karte="${id}"><a href="#k/${id}">${t}</a><span class="fx-fortschritt" data-karte="${id}"></span><span class="fx-sperre-klein" hidden></span></li>`;
const abs = (id, karten) => `<li data-abschnitt-id="${id}"><h2>${id}</h2><p class="fx-sperre" hidden></p><ul class="fx-kartenliste">${karten}</ul></li>`;
const karte = (id, ab, inhalt, extra) => `<section class="fx-karte fx-ansicht" data-karte="${id}" data-abschnitt="${ab}" data-abschnitt-id="${ab}"${extra || ''} hidden><h2>Titel ${id}</h2>${inhalt || ''}</section>`;
const feld = (id, art, extra) => `<div class="fx-feld" data-fx-id="${id}" data-fx-art="${art}" data-fx-titel="Feld ${id}"${extra || ''}><textarea class="fx-text"></textarea></div>`;

const HTML = `<div class="fx-oben"><span class="fx-herkunft">foeXlab · LUH</span><span class="fx-ort"></span><button type="button" class="fx-labor" aria-pressed="false">Labormodus</button></div>
<div id="fx-warnung" hidden></div><main>
<section id="fx-start" class="fx-ansicht"><input id="fx-gruppe">
<ol class="fx-abschnitte">${abs('lern', li('lern/v', 'V'))}${abs('kap1', li('kap1/lesen', 'L') + li('kap1/quiz', 'Q'))}${abs('kap2', li('kap2/a', 'A') + li('kap2/b', 'B') + li('kap2/c', 'C'))}</ol>
<h2 class="fx-zwischen">Zum Nachschlagen</h2><ol class="fx-abschnitte">${abs('nach', li('nach/ueb', 'U'))}</ol>
<button type="button" id="fx-neue-gruppe">Neue Gruppe beginnen</button></section>
${karte('lern/v', 'lern', feld('lern/v/f1', 'text', ' data-fx-sperrt="1"') + feld('lern/v/f2', 'text', ' data-fx-sperrt="1"') + feld('lern/v/notiz', 'text', ' data-fx-optional="1"'))}
${karte('kap1/lesen', 'kap1', '<p>Lesen</p>')}
${karte('kap1/quiz', 'kap1', feld('kap1/quiz/quiz', 'quizserie'))}
${karte('kap2/a', 'kap2', feld('kap2/a/f', 'text', ' data-fx-sperrt="1"'))}${karte('kap2/b', 'kap2', '<p>B</p>')}${karte('kap2/c', 'kap2', '<p>C</p>')}
${karte('nach/ueb', 'nach', '<p>Nachschlagen</p>', ' data-nachschlagen="1"')}
<section id="fx-gesperrt" class="fx-ansicht" hidden><p class="fx-grund"></p><button type="button" class="fx-zur-uebersicht">Zur Übersicht</button></section>
<section id="fx-ergebnis" class="fx-ansicht" hidden></section></main>
<nav class="fx-unten" hidden><button type="button" class="fx-zurueck-karte">Zurück</button><button type="button" class="fx-zur-uebersicht">Übersicht</button><button type="button" class="fx-weiter-karte">Weiter</button></nav>`;

const REGELN = {
  abschnitte: {
    lern: {},
    kap1: { oeffnet_nach: 'felder:lern/v', grund: 'Öffnet sich, wenn alle Fragen im Lernblatt beantwortet sind.' },
    kap2: { oeffnet_nach: 'quiz:kap1/quiz', grund: 'Öffnet sich, wenn ‚Q‘ vollständig richtig beantwortet ist.' },
    nach: { nachschlagen: true }
  },
  karten: { 'lern/v': 'lern', 'kap1/lesen': 'kap1', 'kap1/quiz': 'kap1', 'kap2/a': 'kap2', 'kap2/b': 'kap2', 'kap2/c': 'kap2', 'nach/ueb': 'nach' },
  kartenregeln: { 'kap2/b': { oeffnet_nach: 'quiz:kap2/a', grund: 'Erst der Wissenscheck.' } }
};

async function aufbau(opt) {
  opt = opt || {};
  const w = mitDb(dom(HTML));
  if (opt.hash) w.location.hash = opt.hash;
  if (opt.confirm !== undefined) w.confirm = () => opt.confirm;
  const FX = lade(w, 'store', 'felder', 'stiftfeld', 'antwort', 'freischaltung', 'oberflaeche');
  FX.felder.registriere('quizserie', { laden: (el, v) => { el.dataset.b = v.bestanden ? '1' : ''; }, wert: (el) => ({ bestanden: !!el.dataset.b }), leer: (v) => !v.bestanden });
  FX.oberflaeche.neuLaden = () => { w._neugeladen = true; };
  const s = await FX.store.oeffne('k');
  if (opt.vorher) for (const [k, v] of Object.entries(opt.vorher)) await s.schreibe(k, v);
  await FX.felder.start(s);
  await FX.freischaltung.start(s, REGELN);
  await FX.oberflaeche.starte(s);
  const d = w.document;
  const tippe = async (id, text) => { const t = d.querySelector('[data-fx-id="' + id + '"] textarea'); t.value = text; t.dispatchEvent(new w.Event('input', { bubbles: true })); await FX.felder.speichereAlle(); };
  const sichtbar = () => Array.from(d.querySelectorAll('.fx-ansicht')).filter((x) => !x.hidden).map((x) => x.dataset.karte || x.id);
  return { w, FX, s, d, tippe, sichtbar, F: FX.freischaltung };
}

test('Kapitel 1 öffnet sich, wenn alle Lernblattfelder gefüllt sind (Notiz zählt nicht)', async () => {
  const { F, tippe } = await aufbau();
  assert.strictEqual(F.istOffen('kap1'), false);
  await tippe('lern/v/f1', 'a'); assert.strictEqual(F.istOffen('kap1'), false);
  await tippe('lern/v/f2', 'b'); assert.strictEqual(F.istOffen('kap1'), true);
  assert.strictEqual(F.grund('kap1'), 'Öffnet sich, wenn alle Fragen im Lernblatt beantwortet sind.');
});

test('Freischaltung bleibt bestehen und wird gespeichert', async () => {
  const { F, tippe, s } = await aufbau();
  await tippe('lern/v/f1', 'a'); await tippe('lern/v/f2', 'b'); await warte(30);
  await tippe('lern/v/f2', '');   // wieder leer: bleibt offen
  assert.strictEqual(F.istOffen('kap1'), true);
  assert.ok((await s.lies('_frei')).offen.includes('kap1'));
});

test('quiz-Bedingung: öffnet nach oeffne("kap2")', async () => {
  const { F, d } = await aufbau();
  assert.strictEqual(F.istOffen('kap2'), false);
  F.oeffne('kap2'); assert.strictEqual(F.istOffen('kap2'), true);
  await warte(30);
});

test('quiz-Bedingung: öffnet, wenn die Quizserie bestanden ist', async () => {
  const { F, d, FX } = await aufbau();
  d.querySelector('[data-fx-id="kap1/quiz/quiz"]').dataset.b = '1';
  assert.strictEqual(F.istOffen('kap2'), true);
});

test('Weiter vor Sperre zeigt Grund statt leerer Ansicht', async () => {
  const { d, sichtbar } = await aufbau({ hash: '#k/lern/v' });
  d.querySelector('.fx-weiter-karte').click();
  assert.deepStrictEqual(sichtbar(), ['fx-gesperrt']);
  assert.strictEqual(d.querySelector('.fx-grund').textContent, 'Öffnet sich, wenn alle Fragen im Lernblatt beantwortet sind.');
});

test('Hash auf gesperrte Karte zeigt Sperransicht', async () => {
  const { sichtbar, d } = await aufbau({ hash: '#k/kap2/a' });
  assert.deepStrictEqual(sichtbar(), ['fx-gesperrt']);
  assert.match(d.querySelector('.fx-grund').textContent, /vollständig richtig beantwortet/);
});

test('Nachschlagen nicht in Weiter-Reihenfolge, immer offen', async () => {
  const { d, sichtbar, F } = await aufbau({ hash: '#k/nach/ueb' });
  assert.strictEqual(F.istOffen('nach'), true);
  assert.deepStrictEqual(sichtbar(), ['nach/ueb']);
  assert.strictEqual(d.querySelector('.fx-weiter-karte').disabled, true);
  assert.strictEqual(d.querySelector('.fx-zurueck-karte').disabled, true);
  const r = await aufbau({ hash: '#k/kap2/c', vorher: { _frei: { offen: ['kap1', 'kap2'], alles: false } } });
  assert.strictEqual(r.d.querySelector('.fx-weiter-karte').disabled, true, 'letzte Karte der Hauptreihenfolge, Nachschlagen zählt nicht');
});

test('Übersicht zeigt Schloss mit Grund und gibt frei', async () => {
  const { d, tippe } = await aufbau();
  const li = d.querySelector('li[data-abschnitt-id="kap1"]');
  assert.strictEqual(li.querySelector('.fx-sperre').hidden, false);
  assert.match(li.querySelector('.fx-sperre').textContent, /🔒.*alle Fragen im Lernblatt/);
  await tippe('lern/v/f1', 'a'); await tippe('lern/v/f2', 'b');
  assert.strictEqual(li.querySelector('.fx-sperre').hidden, true);
  assert.strictEqual(d.querySelector('li[data-abschnitt-id="nach"] .fx-sperre').hidden, true);
});

test('sperrt wirkt über Kartengrenzen und hebt sich nach Eingabe auf', async () => {
  const { d, tippe, F } = await aufbau({ vorher: { _frei: { offen: ['kap1', 'kap2'], alles: false } } });
  const b = d.querySelector('.fx-karte[data-karte="kap2/b"]'), c = d.querySelector('.fx-karte[data-karte="kap2/c"]');
  assert.ok(b.hasAttribute('data-fx-kartensperre') && c.hasAttribute('data-fx-kartensperre'));
  assert.match(b.querySelector('.fx-kartensperre-hinweis').textContent, /Tragt zuerst etwas in ‚Feld kap2\/a\/f‘ ein\./);
  assert.ok(!d.querySelector('.fx-karte[data-karte="kap1/quiz"]').hasAttribute('data-fx-kartensperre'), 'anderer Abschnitt unberührt');
  await tippe('kap2/a/f', 'x');
  assert.ok(!b.hasAttribute('data-fx-kartensperre') && !c.hasAttribute('data-fx-kartensperre'));
  assert.strictEqual(b.querySelector('.fx-kartensperre-hinweis'), null);
});

test('Kartenregel: Karte und Folgekarten gesperrt bis oeffne(kartenId)', async () => {
  const { F } = await aufbau({ vorher: { _frei: { offen: ['kap1', 'kap2'], alles: false } } });
  assert.strictEqual(F.kartenStatus('kap2/a').offen, true);
  assert.deepStrictEqual(plain(F.kartenStatus('kap2/b')), { offen: false, grund: 'Erst der Wissenscheck.' });
  assert.strictEqual(F.kartenStatus('kap2/c').offen, false);
  F.oeffne('kap2/b');
  assert.strictEqual(F.kartenStatus('kap2/b').offen, true); assert.strictEqual(F.kartenStatus('kap2/c').offen, true);
});

test('gesperrte Folgekarte: Hash zeigt Sperransicht mit Kartengrund', async () => {
  const { sichtbar, d } = await aufbau({ hash: '#k/kap2/c', vorher: { _frei: { offen: ['kap1', 'kap2'], alles: false } } });
  assert.deepStrictEqual(sichtbar(), ['fx-gesperrt']);
  assert.strictEqual(d.querySelector('.fx-grund').textContent, 'Erst der Wissenscheck.');
});

test('Rücksprung: Knopf erscheint nach Nachschlagen und führt zurück', async () => {
  const { w, d, sichtbar } = await aufbau({ hash: '#k/lern/v' });
  const a = d.createElement('a'); a.href = '#k/nach/ueb'; a.setAttribute('data-fx-ruecksprung', ''); d.querySelector('.fx-karte[data-karte="lern/v"]').appendChild(a);
  a.click();
  assert.strictEqual(w.sessionStorage.getItem('fx-zurueck'), 'lern/v');
  w.location.hash = '#k/nach/ueb'; w.dispatchEvent(new w.Event('hashchange'));
  const knopf = d.querySelector('.fx-karte[data-karte="nach/ueb"] .fx-ruecksprung');
  assert.ok(knopf); assert.match(knopf.textContent, /← Zurück zu ‚Titel lern\/v‘/);
  knopf.click();
  assert.deepStrictEqual(sichtbar(), ['lern/v']);
  assert.strictEqual(w.sessionStorage.getItem('fx-zurueck'), null);
});

test('Betreuungsmodus: 5 Tipps + Bestätigung → alles offen', async () => {
  const { w, d, F, sichtbar } = await aufbau({ confirm: true });
  const h = d.querySelector('.fx-herkunft');
  for (let i = 0; i < 4; i++) h.click();
  assert.strictEqual(F.istOffen('kap1'), false);
  h.click();
  assert.strictEqual(F.istOffen('kap1'), true); assert.strictEqual(F.istOffen('kap2'), true);
  assert.strictEqual(F.kartenStatus('kap2/c').offen, true);
  assert.ok(!d.querySelector('.fx-karte[data-karte="kap2/b"]').hasAttribute('data-fx-kartensperre'));
});

test('Betreuungsmodus abgelehnt → nichts', async () => {
  const { d, F } = await aufbau({ confirm: false });
  const h = d.querySelector('.fx-herkunft'); for (let i = 0; i < 5; i++) h.click();
  assert.strictEqual(F.istOffen('kap1'), false);
});

test('Neue Gruppe löscht _frei', async () => {
  const { s, F, FX } = await aufbau({ confirm: true, vorher: { _frei: { offen: ['kap1'], alles: true } } });
  assert.strictEqual(F.istOffen('kap2'), true);
  await FX.oberflaeche.neueGruppe();
  assert.strictEqual(await s.lies('_frei'), undefined);
  assert.strictEqual(F.istOffen('kap1'), false);
});
