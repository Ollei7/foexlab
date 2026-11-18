/* Baustein Skizze: Zeichenfläche für Stift oder Finger; Striche normiert (0..1) gespeichert. */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).skizze = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  var BREITE = 0.006, RADIERER = 0.035;

  function normiere(x, y, w, h) { return [Math.round(x / w * 1e4) / 1e4, Math.round(y / h * 1e4) / 1e4]; }

  /* Zeichnet alle Striche in einen Canvas-Kontext der Größe w × h (auch für das PDF). */
  function zeichne(ctx, striche, w, h) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    (striche || []).forEach(function (s) {
      var p = s.punkte || []; if (!p.length) return;
      ctx.globalCompositeOperation = s.farbe === 'radierer' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = s.farbe === 'radierer' ? '#000' : s.farbe;
      ctx.lineWidth = s.breite * w;
      ctx.beginPath(); ctx.moveTo(p[0][0] * w, p[0][1] * h);
      p.forEach(function (q) { ctx.lineTo(q[0] * w, q[1] * h); });
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  function zustand(el) { if (!el._fxZ) el._fxZ = { striche: [], farbe: '#33416E', aktiv: null }; return el._fxZ; }
  function canvas(el) { return el.querySelector('canvas'); }

  function neuZeichnen(el) {
    var c = canvas(el), ctx = c && c.getContext && c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    zeichne(ctx, zustand(el).striche, c.width, c.height);
  }

  function aendern(el) { el.dispatchEvent(new el.ownerDocument.defaultView.Event('change')); }

  function beginne(el, x, y, druck) {
    var z = zustand(el), b = z.farbe === 'radierer' ? RADIERER : BREITE * (druck ? 0.5 + druck : 1);
    z.aktiv = { farbe: z.farbe, breite: Math.round(b * 1e4) / 1e4, punkte: [[x, y]] };
    z.striche.push(z.aktiv); neuZeichnen(el);
  }
  function ziehe(el, x, y) { var z = zustand(el); if (!z.aktiv) return; z.aktiv.punkte.push([x, y]); neuZeichnen(el); }
  function beende(el) { var z = zustand(el); if (!z.aktiv) return; z.aktiv = null; aendern(el); }

  function groesse(el) {
    var c = canvas(el), r = c.getBoundingClientRect(), dpr = root.devicePixelRatio || 1;
    if (!r.width) return;
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    neuZeichnen(el);
  }

  function init(el) {
    var c = canvas(el), z = zustand(el);
    function pos(e) { var r = c.getBoundingClientRect(); return normiere(e.clientX - r.left, e.clientY - r.top, r.width || 1, r.height || 1); }
    c.style.touchAction = 'none';
    c.addEventListener('pointerdown', function (e) {
      e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch (x) { /* egal */ }
      var p = pos(e); beginne(el, p[0], p[1], e.pointerType === 'pen' ? e.pressure : 0);
    });
    c.addEventListener('pointermove', function (e) { if (!z.aktiv) return; var p = pos(e); ziehe(el, p[0], p[1]); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { c.addEventListener(t, function () { beende(el); }); });
    Array.prototype.forEach.call(el.querySelectorAll('.fx-farbe'), function (b) {
      b.addEventListener('click', function () {
        z.farbe = b.getAttribute('data-farbe');
        Array.prototype.forEach.call(el.querySelectorAll('.fx-farbe'), function (x) { x.setAttribute('aria-pressed', x === b); });
      });
    });
    var u = el.querySelector('.fx-rueckgaengig');
    if (u) u.addEventListener('click', function () { z.striche.pop(); neuZeichnen(el); aendern(el); });
    var a = el.querySelector('.fx-alles-loeschen');
    if (a) a.addEventListener('click', function () {
      if (!z.striche.length || !root.FX.felder.frage('Die ganze Skizze löschen?')) return;
      z.striche = []; neuZeichnen(el); aendern(el);
    });
    if (root.ResizeObserver) new root.ResizeObserver(function () { groesse(el); }).observe(c);
    groesse(el);
  }

  if (root.FX && root.FX.felder) root.FX.felder.registriere('skizze', {
    init: init,
    laden: function (el, w) { zustand(el).striche = (w.striche || []).slice(); neuZeichnen(el); },
    wert: function (el) { return { striche: zustand(el).striche.slice() }; },
    leer: function (w) { return !(w && w.striche && w.striche.length); }
  });
  return { normiere: normiere, zeichne: zeichne, beginne: beginne, ziehe: ziehe, beende: beende };
});
