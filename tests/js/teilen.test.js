const test = require('node:test');
const assert = require('node:assert');
const { dom, lade } = require('./helfer');

const PDF = new Uint8Array([37, 80, 68, 70, 45]);

test('Dateiname mit Kurs und Datum', () => {
  const w = dom(); const FX = lade(w, 'teilen');
  assert.strictEqual(FX.teilen.dateiname({ id: 'michelson' }, new Date(2026, 9, 1)), 'Protokoll-michelson-2026-10-01.pdf');
});

test('ohne Teilen-Funktion wird heruntergeladen', async () => {
  const w = dom(); const FX = lade(w, 'teilen');
  w.URL.createObjectURL = () => 'blob:x'; w.URL.revokeObjectURL = () => {};
  let geklickt = null;
  w.HTMLAnchorElement.prototype.click = function () { geklickt = this.download; };
  assert.strictEqual(await FX.teilen.sichern(PDF, 'p.pdf'), 'heruntergeladen');
  assert.strictEqual(geklickt, 'p.pdf');
});

test('abgebrochenes Teilen ist kein Fehler', async () => {
  const w = dom(); const FX = lade(w, 'teilen');
  w.navigator.canShare = () => true;
  w.navigator.share = async () => { const e = new Error('abgebrochen'); e.name = 'AbortError'; throw e; };
  assert.strictEqual(await FX.teilen.sichern(PDF, 'p.pdf'), 'abgebrochen');
});

test('Teilen über das Teilen-Menü', async () => {
  const w = dom(); const FX = lade(w, 'teilen');
  let datei = null;
  w.navigator.canShare = () => true;
  w.navigator.share = async (d) => { datei = d.files[0]; };
  assert.strictEqual(await FX.teilen.sichern(PDF, 'p.pdf'), 'geteilt');
  assert.strictEqual(datei.name, 'p.pdf'); assert.strictEqual(datei.type, 'application/pdf');
});

test('Abholcode: Server nicht erreichbar zeigt WLAN-Hinweis', async () => {
  const w = dom(); const FX = lade(w, 'teilen');
  w.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(FX.teilen.abholcode(PDF, 'michelson'), /WLAN „foeXlab“/);
});

test('Abholcode: Erfolg', async () => {
  const w = dom(); const FX = lade(w, 'teilen');
  let anfrage = null;
  w.fetch = async (url, opt) => { anfrage = { url, opt }; return { ok: true, status: 201, json: async () => ({ code: 'K7P2', url: '/abholen?code=K7P2' }) }; };
  const r = await FX.teilen.abholcode(PDF, 'michelson');
  assert.strictEqual(r.code, 'K7P2');
  assert.strictEqual(anfrage.url, '/api/ablegen');
  assert.strictEqual(anfrage.opt.headers['X-Experiment'], 'michelson');
});

test('ohne Abholdienst kein Knopf „Abholcode erzeugen“', () => {
  const w = dom('<div class="fx-sichern"></div>'); const FX = lade(w, 'teilen');
  const box = w.document.querySelector('.fx-sichern');
  FX.teilen.knoepfe(box, { id: 'm', abholdienst: false });
  const texte = Array.from(box.querySelectorAll('button'), (b) => b.textContent);
  assert.ok(texte.includes('Protokoll als PDF sichern'));
  assert.ok(!texte.some((t) => /Abholcode/.test(t)));
  FX.teilen.knoepfe(box, { id: 'm', abholdienst: true });
  assert.ok(Array.from(box.querySelectorAll('button'), (b) => b.textContent).includes('Abholcode erzeugen'));
});
