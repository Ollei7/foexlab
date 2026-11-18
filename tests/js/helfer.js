// Lädt Module aus engine/web/js in eine jsdom-Umgebung.
const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');
const JS = path.join(__dirname, '..', '..', 'engine', 'web', 'js');

function dom(html) {
  const d = new JSDOM(`<!doctype html><body>${html || ''}</body>`, { runScripts: 'outside-only', url: 'http://localhost/' });
  return d.window;
}
function lade(win, ...namen) {
  for (const n of namen) win.eval(fs.readFileSync(path.join(JS, n + '.js'), 'utf8'));
  return win.FX;
}
const ROOT = path.join(__dirname, '..', '..');
/* Beliebige Datei relativ zum Repository in ein jsdom-Fenster laden (Kurs-Werkzeuge) */
function ladeDatei(win, rel) { win.eval(fs.readFileSync(path.join(ROOT, rel), 'utf8')); return win.FX; }
const plain = (x) => JSON.parse(JSON.stringify(x));
module.exports = { dom, lade, ladeDatei, plain, JS };

// Frische IndexedDB (fake-indexeddb) für ein jsdom-Fenster
function mitDb(win) {
  const { IDBFactory, IDBKeyRange } = require('fake-indexeddb');
  win.indexedDB = new IDBFactory();
  win.IDBKeyRange = IDBKeyRange;
  return win;
}
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
module.exports.mitDb = mitDb;
module.exports.warte = warte;
