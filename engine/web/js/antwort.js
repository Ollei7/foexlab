/* Antwortfeld „Tippen | Stift“ für die Feldarten text und vermutung. Gespeichert werden Text und Striche,
   Wert: {text, striche, modus, hoehe}. Ein Altwert {text} lädt weiter. Felder ohne Stift-Markup bleiben reine Textfelder. */
(function (root, factory) {
  factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {
  var FX = root.FX;
  if (!FX || !FX.felder) return;

  function bereit(el) {
    var a = el.querySelector('.fx-antwort');
    if (!a || el._fxStift) return !!el._fxStift;
    var win = el.ownerDocument.defaultView;
    el._fxStift = FX.stiftfeld.binde(a.querySelector('.fx-stift'), {
      beiAenderung: function () { el.dispatchEvent(new win.Event('change', { bubbles: true })); }
    });
    Array.prototype.forEach.call(a.querySelectorAll('[data-modus]'), function (b) {
      b.addEventListener('click', function () { setzeModus(el, b.getAttribute('data-modus')); el.dispatchEvent(new win.Event('change', { bubbles: true })); });
    });
    setzeModus(el, a.getAttribute('data-start') === 'stift' ? 'stift' : 'tippen');
    return true;
  }

  function setzeModus(el, modus) {
    var a = el.querySelector('.fx-antwort'); if (!a) return;
    el._fxModus = modus === 'stift' ? 'stift' : 'tippen';
    a.querySelector('textarea').hidden = el._fxModus === 'stift';
    a.querySelector('.fx-stift').hidden = el._fxModus !== 'stift';
    Array.prototype.forEach.call(a.querySelectorAll('[data-modus]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-modus') === el._fxModus ? 'true' : 'false'); });
    if (el._fxModus === 'stift' && el._fxStift) el._fxStift.neuZeichnen();
  }

  var handler = {
    init: bereit,
    laden: function (el, w) {
      el.querySelector('textarea').value = w.text || '';
      if (!bereit(el)) return;
      el._fxStift.setze(w.striche || []);
      if (w.hoehe) el._fxStift.setzeHoehe(w.hoehe);
      setzeModus(el, w.modus || 'tippen');
    },
    wert: function (el) {
      var t = el.querySelector('textarea').value;
      if (!bereit(el)) return { text: t };
      return { text: t, striche: el._fxStift.striche(), modus: el._fxModus, hoehe: el._fxStift.hoehe() };
    },
    leer: function (w) { return !(w && ((w.text && w.text.trim()) || (w.striche && w.striche.length))); },
    protokoll: function (el, w) {
      var teile = [];
      if (w && w.text && w.text.trim()) teile.push({ typ: 'text', text: w.text });
      if (w && w.striche && w.striche.length) teile.push({ typ: 'striche', striche: w.striche, verhaeltnis: 1000 / (w.hoehe || FX.stiftfeld.START_HOEHE) });
      return teile;
    }
  };
  FX.felder.registriere('text', handler);
  /* Vermutung ist eine Hypothese: nach der Messung schreibgeschützt (Textfeld, Umschalter, Stift-Leiste, Zeichenfläche) */
  function schreibschutz(el, an) {
    var a = el.querySelector('.fx-antwort'); if (!a) { el.querySelector('textarea').readOnly = an; return; }
    a.querySelector('textarea').readOnly = an;
    Array.prototype.forEach.call(a.querySelectorAll('[data-modus]'), function (b) { b.disabled = an; });
    var l = a.querySelector('.fx-stift-leiste'); if (l) l.hidden = an;
    var c = a.querySelector('.fx-stift canvas'); if (c) c.style.pointerEvents = an ? 'none' : '';
  }
  FX.felder.registriere('vermutung', Object.assign({}, handler, { hypothese: true, schreibschutz: schreibschutz }));
});
