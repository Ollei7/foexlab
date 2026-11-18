/* Werkzeug „zitat“ (Kapitel 3, Deutung): zeigt die Hypothese vom Anfang des Kapitels als Blockzitat.
   Konfig: quelle "<feld-id der Vermutung>". Text als Zitat; bei Stift-Antwort die Striche als Bild (FX.stiftfeld, falls vorhanden),
   sonst der Hinweis „(mit Stift geschrieben, siehe Protokoll)“. Kein Wert, nicht im Protokoll. */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h;

  function init(el) {
    if (el._ztLaden) return;   // schon aufgebaut
    el._ztLaden = true;
    const flaeche = el.querySelector('.fx-werkzeug-flaeche'), quelle = M.konfig(el).quelle;
    const zitat = h('blockquote', { 'class': 'mzi-zitat', 'data-o': 'zitat' });
    flaeche.appendChild(zitat);

    /* Striche auf eine Zeichenfläche bringen; false, wenn keine Stiftfläche oder kein Canvas zur Verfügung steht */
    function bild(w) {
      if (!FX.stiftfeld || !FX.stiftfeld.zeichne) return false;
      try {
        const c = h('canvas', { 'aria-label': 'Handschriftliche Vorhersage' }), breite = 800, ctx = c.getContext && c.getContext('2d');
        if (!ctx) return false;
        c.width = breite; c.height = Math.round(breite * (w.hoehe || FX.stiftfeld.START_HOEHE || 240) / 1000);
        FX.stiftfeld.zeichne(ctx, w.striche, breite);
        zitat.appendChild(c); return true;
      } catch (e) { return false; }
    }
    function zeige(w) {
      const text = ((w && w.text) || '').trim(), striche = !!(w && w.striche && w.striche.length);
      zitat.textContent = text;
      if (striche && !bild(w)) zitat.appendChild(h('p', {}, '(mit Stift geschrieben, siehe Protokoll)'));
      if (!text && !striche) zitat.textContent = '(Keine Vorhersage eingetragen.)';
    }
    const lade = () => M.lies(quelle).then(zeige);
    el.ownerDocument.addEventListener('fx:geaendert', (e) => { if (e.detail && e.detail.id === quelle) lade(); });
    zeige(null); lade();
  }

  FX.felder.registriere('zitat', {
    init: init,
    laden: (el) => { if (!el._ztLaden) init(el); },
    wert: () => ({}),
    leer: () => false,
    ohneProtokoll: true
  });
})(typeof self !== 'undefined' ? self : this);
