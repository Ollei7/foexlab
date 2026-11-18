/* Schreibfläche für Stift (Apple Pencil) oder Finger.
   Striche: {farbe, breite, punkte:[[x, y]]} mit x in 0..1 (Anteil der Breite) und y in Einheiten, bei denen die Breite 1000 entspricht;
   so kann die Fläche nach unten wachsen. Radierer entfernt ganze Striche (bleibt im PDF als Vektor sauber). */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).stiftfeld = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  var START_HOEHE = 240, PLATZ = 120, BREITE = 2.4, RADIERER = 14, FARBE = '#33416E';

  function r2(x) { return Math.round(x * 100) / 100; }

  /* Strich glätten: ein Durchgang gleitender Mittelwert, Anfang und Ende bleiben */
  function glaette(p) {
    if (p.length < 3) return p;
    return p.map(function (q, i) {
      if (i === 0 || i === p.length - 1) return q;
      return [r2((p[i - 1][0] + q[0] + p[i + 1][0]) / 3 * 1e4) / 1e4, r2((p[i - 1][1] + q[1] + p[i + 1][1]) / 3)];
    });
  }

  /* Alle Striche in einen Canvas-Kontext der Breite w zeichnen (Bildschirm und Ergebnisseite) */
  function zeichne(ctx, striche, w) {
    var f = w / 1000;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = FARBE;
    (striche || []).forEach(function (s) {
      var p = s.punkte || []; if (!p.length) return;
      ctx.lineWidth = s.breite * f; ctx.strokeStyle = s.farbe || FARBE;
      ctx.beginPath(); ctx.moveTo(p[0][0] * w, p[0][1] * f);
      for (var i = 1; i < p.length - 1; i++) ctx.quadraticCurveTo(p[i][0] * w, p[i][1] * f, (p[i][0] + p[i + 1][0]) / 2 * w, (p[i][1] + p[i + 1][1]) / 2 * f);
      if (p.length > 1) ctx.lineTo(p[p.length - 1][0] * w, p[p.length - 1][1] * f);
      else ctx.lineTo(p[0][0] * w + 0.01, p[0][1] * f);
      ctx.stroke();
    });
  }

  function abstand2(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
    t = Math.max(0, Math.min(1, t));
    var x = ax + t * dx - px, y = ay + t * dy - py; return x * x + y * y;
  }
  function trifft(strich, x, y) {   // x, y in Einheiten
    var p = strich.punkte, r = RADIERER + strich.breite / 2;
    for (var i = 0; i < p.length; i++) {
      var b = p[i + 1] || p[i];
      if (abstand2(x, y, p[i][0] * 1000, p[i][1], b[0] * 1000, b[1]) <= r * r) return true;
    }
    return false;
  }

  function binde(c, opt) {
    opt = opt || {};
    var doc = c.ownerDocument, canvas = c.querySelector('canvas');
    var z = { striche: [], undo: [], redo: [], aktiv: null, werkzeug: 'stift', hoehe: START_HOEHE, nurPencil: true, scroll: null };

    function melde() { if (opt.beiAenderung) opt.beiAenderung(); }
    function neuZeichnen() {
      var ctx = canvas && canvas.getContext && canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      zeichne(ctx, z.striche, canvas.width);
    }
    function groesse() {
      var r = canvas.getBoundingClientRect(), dpr = root.devicePixelRatio || 1;
      if (!r.width) return;
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.width * z.hoehe / 1000 * dpr);
      neuZeichnen();
    }
    function setzeHoehe(h) {
      z.hoehe = Math.max(START_HOEHE, Math.round(h));
      canvas.style.aspectRatio = '1000 / ' + z.hoehe; c.setAttribute('data-hoehe', z.hoehe);
      groesse();
    }
    function setzeWerkzeug(w) {
      z.werkzeug = w;
      Array.prototype.forEach.call(c.querySelectorAll('[data-werkzeug]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-werkzeug') === w ? 'true' : 'false'); });
    }

    function radiere(x, y) {
      var rest = z.striche.filter(function (s) { return !trifft(s, x * 1000, y); });
      if (rest.length === z.striche.length) return;
      if (!z.aktiv.geaendert) { z.undo.push(z.striche.slice()); z.redo = []; z.aktiv.geaendert = true; }
      z.striche = rest; neuZeichnen();
    }
    function beginne(x, y, druck) {
      if (z.aktiv) beende();   // hängender Strich (pointerup ging verloren)
      if (z.werkzeug === 'radierer') { z.aktiv = { radierer: true, geaendert: false }; radiere(x, y); return; }
      z.undo.push(z.striche.slice()); z.redo = [];
      z.aktiv = { farbe: FARBE, breite: r2(BREITE * (druck > 0 ? 0.5 + druck : 1)), punkte: [[x, y]] };
      z.striche.push(z.aktiv); neuZeichnen();
    }
    function ziehe(x, y) {
      if (!z.aktiv) return;
      if (z.aktiv.radierer) { radiere(x, y); return; }
      z.aktiv.punkte.push([x, y]); neuZeichnen();
    }
    function beende() {
      var a = z.aktiv; if (!a) return;
      z.aktiv = null;
      if (a.radierer) { if (a.geaendert) melde(); return; }
      a.punkte = glaette(a.punkte);
      neuZeichnen(); melde();
    }
    function rueckgaengig() {
      beende();
      if (!z.undo.length) return;
      z.redo.push(z.striche.slice()); z.striche = z.undo.pop(); neuZeichnen(); melde();
    }
    function wiederholen() {
      beende();
      if (!z.redo.length) return;
      z.undo.push(z.striche.slice()); z.striche = z.redo.pop(); neuZeichnen(); melde();
    }

    function pos(e) {
      var r = canvas.getBoundingClientRect(), b = r.width || 1;
      return [Math.round((e.clientX - r.left) / b * 1e4) / 1e4, Math.round((e.clientY - r.top) * 1000 / b * 100) / 100];
    }
    canvas.style.touchAction = 'none'; canvas.style.webkitTouchCallout = 'none';
    canvas.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' && z.nurPencil) {   // Finger blättert nur
        z.scroll = e.clientY; if (e.preventDefault) e.preventDefault(); return;
      }
      if (e.preventDefault) e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* egal */ }
      var p = pos(e); beginne(p[0], p[1], e.pointerType === 'pen' ? e.pressure : 0);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (z.scroll !== null) { if (root.scrollBy) try { root.scrollBy(0, z.scroll - e.clientY); } catch (x) { /* jsdom */ } z.scroll = e.clientY; return; }
      if (!z.aktiv) return;
      var p = pos(e); ziehe(p[0], p[1]);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { canvas.addEventListener(t, function () { z.scroll = null; beende(); }); });
    doc.addEventListener('visibilitychange', beende);
    root.addEventListener('blur', beende);

    Array.prototype.forEach.call(c.querySelectorAll('[data-werkzeug]'), function (b) {
      b.addEventListener('click', function () { setzeWerkzeug(b.getAttribute('data-werkzeug')); });
    });
    var u = c.querySelector('.fx-rueckgaengig'); if (u) u.addEventListener('click', rueckgaengig);
    var w = c.querySelector('.fx-wiederholen'); if (w) w.addEventListener('click', wiederholen);
    var m = c.querySelector('.fx-mehr-platz'); if (m) m.addEventListener('click', function () { setzeHoehe(z.hoehe + PLATZ); melde(); });
    var h = c.querySelector('.fx-hintergrund');
    if (h) { var hg = function () { c.setAttribute('data-hintergrund', h.value); }; h.addEventListener('change', hg); hg(); }
    var n = c.querySelector('.fx-nur-pencil');
    if (n) { z.nurPencil = n.checked; n.addEventListener('change', function () { z.nurPencil = n.checked; }); }
    if (root.ResizeObserver) new root.ResizeObserver(groesse).observe(canvas);
    setzeHoehe(START_HOEHE); setzeWerkzeug('stift');

    return {
      striche: function () { return z.striche.slice(); },
      setze: function (s) { z.striche = (s || []).slice(); z.undo = []; z.redo = []; z.aktiv = null; neuZeichnen(); },
      hoehe: function () { return z.hoehe; }, setzeHoehe: setzeHoehe, setzeWerkzeug: setzeWerkzeug,
      beginne: beginne, ziehe: ziehe, beende: beende, rueckgaengig: rueckgaengig, wiederholen: wiederholen, neuZeichnen: groesse
    };
  }

  return { binde: binde, zeichne: zeichne, START_HOEHE: START_HOEHE };
});
