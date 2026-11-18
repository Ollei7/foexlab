/* Freischaltung: Kapitel und Karten öffnen sich nach Bedingungen (felder:, quiz:, knopf:) oder über oeffne(ziel).
   Zustand im Speicher unter _frei = {offen: string[], alles: boolean}; einmal Geöffnetes bleibt offen. */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).freischaltung = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  var regeln = { abschnitte: {}, karten: {}, kartenregeln: {} }, store = null, z = { offen: [], alles: false }, verdrahtet = false;

  function d() { return root.document; }
  function $(s, r) { return Array.prototype.slice.call((r || d()).querySelectorAll(s)); }
  function FX() { return root.FX; }
  function karteEl(id) { return d().querySelector('.fx-karte[data-karte="' + id + '"]'); }

  function melde() { d().dispatchEvent(new root.CustomEvent('fx:freischaltung')); }
  function sichere() { return store ? store.schreibe('_frei', { offen: z.offen.slice(), alles: z.alles }).catch(function () {}) : Promise.resolve(); }

  function wert(f) {
    var h = FX().felder.arten[f.getAttribute('data-fx-art')];
    try { return h ? h.wert(f) : undefined; } catch (e) { return undefined; }
  }
  function felderErfuellt(id) {
    var k = karteEl(id); if (!k) return false;
    return $('.fx-feld', k).every(function (f) {
      var art = f.getAttribute('data-fx-art'), h = FX().felder.arten[art];
      if (!h || h.ohneProtokoll || f.hasAttribute('data-fx-optional')) return true;
      return !FX().felder.istLeer(art, wert(f));
    });
  }
  function quizErfuellt(id) {
    var k = karteEl(id); if (!k) return false;
    return $('.fx-feld[data-fx-art="quizserie"]', k).some(function (f) { var w = wert(f); return !!(w && w.bestanden); });
  }
  function bedingung(b) {
    if (!b) return true;
    var i = b.indexOf(':'), art = b.slice(0, i), ziel = b.slice(i + 1);
    if (art === 'felder') return felderErfuellt(ziel);
    if (art === 'quiz') return quizErfuellt(ziel) || z.offen.indexOf(ziel) >= 0;
    if (art === 'knopf') return z.offen.indexOf(b) >= 0;
    return false;
  }

  function istOffen(ab) {
    var r = regeln.abschnitte[ab];
    if (z.alles || !r || r.nachschlagen || !r.oeffnet_nach) return true;
    return z.offen.indexOf(ab) >= 0 || bedingung(r.oeffnet_nach);
  }
  function grund(ab) { var r = regeln.abschnitte[ab]; return (r && r.grund) || ''; }

  /* {offen, grund} für eine Karte: ihr Kapitel muss offen sein, und keine Kartenregel davor (einschließlich ihrer eigenen) darf greifen */
  function kartenStatus(id) {
    var ab = regeln.karten[id];
    if (z.alles || ab === undefined) return { offen: true, grund: '' };
    if (!istOffen(ab)) return { offen: false, grund: grund(ab) };
    var ids = Object.keys(regeln.karten).filter(function (k) { return regeln.karten[k] === ab; });
    for (var i = 0; i <= ids.indexOf(id); i++) {
      var kr = regeln.kartenregeln[ids[i]];
      if (kr && z.offen.indexOf(ids[i]) < 0 && !bedingung(kr.oeffnet_nach)) return { offen: false, grund: kr.grund || '' };
    }
    return { offen: true, grund: '' };
  }

  function oeffne(ziel) {
    if (z.offen.indexOf(ziel) < 0) z.offen.push(ziel);
    melde(); return sichere();
  }
  function allesFrei() { z.alles = true; melde(); return sichere(); }

  /* Bedingungen auswerten und Erreichtes dauerhaft festhalten */
  function pruefe() {
    var neu = false;
    function merke(k, bed) { if (z.offen.indexOf(k) < 0 && bedingung(bed)) { z.offen.push(k); neu = true; } }
    Object.keys(regeln.abschnitte).forEach(function (ab) { var r = regeln.abschnitte[ab]; if (r.oeffnet_nach && !r.nachschlagen) merke(ab, r.oeffnet_nach); });
    Object.keys(regeln.kartenregeln).forEach(function (k) { merke(k, regeln.kartenregeln[k].oeffnet_nach); });
    if (neu) { melde(); return sichere(); }
    return Promise.resolve();
  }

  function start(s, r) {
    store = s; regeln = { abschnitte: (r && r.abschnitte) || {}, karten: (r && r.karten) || {}, kartenregeln: (r && r.kartenregeln) || {} };
    z = { offen: [], alles: false };
    if (!verdrahtet) { verdrahtet = true; d().addEventListener('fx:geaendert', function () { pruefe(); }); }
    return s.lies('_frei').then(function (w) {
      if (w) z = { offen: (w.offen || []).slice(), alles: !!w.alles };
    }, function () { /* ohne Speicher: alles gesperrt wie am Anfang */ }).then(function () { return pruefe(); });
  }
  function zuruecksetzen() { z = { offen: [], alles: false }; melde(); }

  return { start: start, istOffen: istOffen, oeffne: oeffne, grund: grund, allesFrei: allesFrei, istAllesFrei: function () { return z.alles; },
    kartenStatus: kartenStatus, pruefe: pruefe, zuruecksetzen: zuruecksetzen };
});
