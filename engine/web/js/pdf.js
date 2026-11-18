/* Protokoll-PDF: plane() legt die Seiten als Liste von Zeichenbefehlen an (rein, testbar),
   erzeuge() rastert Bilder und zeichnet mit jsPDF (Helvetica, WinAnsi). */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).pdf = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  var A4 = { b: 210, h: 297 }, RAND = 18, FUSS_Y = 297 - 10, UNTEN = 297 - 18;
  var LIZENZ = 'Aufgabentexte: foeXlab, Leibniz Universität Hannover – CC BY 4.0';
  var NAVY = [51, 65, 110], GRAU = [107, 112, 128], ORANGE = [245, 132, 17];

  /* ---------------------------------------------------------------- Text für WinAnsi */
  var GRIECHISCH = { 'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'η': 'eta', 'θ': 'theta', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'my', 'ν': 'ny', 'π': 'pi', 'ρ': 'rho', 'σ': 'sigma', 'τ': 'tau', 'φ': 'phi', 'ϕ': 'phi', 'χ': 'chi', 'ψ': 'psi', 'ω': 'omega',
    'Δ': 'Delta', 'Γ': 'Gamma', 'Θ': 'Theta', 'Λ': 'Lambda', 'Π': 'Pi', 'Σ': 'Sigma', 'Φ': 'Phi', 'Ψ': 'Psi', 'Ω': 'Omega' };
  /* Helvetica kennt weder Pfeile noch ⟩: Sie werden als Marken (private use) durchgereicht und von plane() als Vektorzeichen gesetzt */
  var PFEIL = { '↑': '\uE000', '→': '\uE001', '↗': '\uE002', '↘': '\uE003' }, KLAMMER = '\uE004', RICHTUNG = ['↑', '→', '↗', '↘'];
  var MARKEN = /[\uE000-\uE004]/, MARKEN_G = /([\uE000-\uE004])/;
  var ZEICHEN = { '⇒': '=>', '⊕': '(+)', '⁄': '/', '✓': 'ja', '✗': 'nein', '⟨': '<', '≥': '>=', '≤': '<=', '≈': '~', '≠': '!=', '→': '->', '←': '<-', '⋅': '·', '−': '-', '√': 'sqrt', '∞': 'unendlich', '°': '°', '²': '²', '³': '³' };
  var WINANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
  function pdfText(s) {
    s = String(s == null ? '' : s).replace(/\r/g, '');
    s = s.replace(/\|([↑→↗↘])⟩/g, function (m, k) { return '|' + PFEIL[k] + KLAMMER; });
    if (/^\s*[↑→↗↘]\s*$/.test(s)) s = PFEIL[s.trim()];
    s = s.replace(/[↑↗↘]/g, function (k) { return PFEIL[k]; }).replace(/⟩/g, KLAMMER);
    s = s.replace(/[Ͱ-Ͽ]/g, function (c, i, ganz) {
      var n = GRIECHISCH[c]; if (!n) return '?';
      return /[A-Za-zÄÖÜäöüß0-9]/.test(ganz.charAt(i + 1) || '') ? n + ' ' : n;
    });
    s = s.replace(/[^\x00-\xFF]/g, function (c) { return ZEICHEN[c] || (WINANSI_EXTRA.indexOf(c) >= 0 || MARKEN.test(c) ? c : '?'); });
    return s;
  }

  /* ---------------------------------------------------------------- Umbruch */
  function umbrechen(text, pt, fett, maxB, breite) {
    var zeilen = [];
    String(text).split('\n').forEach(function (absatz) {
      var woerter = absatz.split(/\s+/).filter(Boolean), z = '';
      if (!woerter.length) { zeilen.push(''); return; }
      woerter.forEach(function (w) {
        var t = z ? z + ' ' + w : w;
        if (breite(t, pt, fett) <= maxB) { z = t; return; }
        if (z) zeilen.push(z);
        while (breite(w, pt, fett) > maxB && w.length > 1) {   // überlange Wörter hart trennen
          var k = w.length; while (k > 1 && breite(w.slice(0, k), pt, fett) > maxB) k--;
          zeilen.push(w.slice(0, k)); w = w.slice(k);
        }
        z = w;
      });
      if (z) zeilen.push(z);
    });
    return zeilen;
  }

  /* ---------------------------------------------------------------- Layout */
  function ersteHoehe(e) {
    var b = e.bildDaten && e.bildDaten[0];
    if (e.art === 'foto' && b) return Math.min(100, 80 * (b.h / b.w || 0.75)) + 3;
    if (e.art === 'skizze' && b) return 120 / (e.verhaeltnis || 4 / 3) + 3;
    var t0 = e.teile && e.teile[0];
    if (t0 && t0.typ === 'striche') return Math.min(170 / (t0.verhaeltnis || 1000 / 240), 60) + 3;
    return 0;
  }

  function plane(p, masse) {
    var roh = masse.breite, seiten = [], s, y, B = A4.b - 2 * RAND;
    var MM = 0.3528;   // Punkt in mm
    function markenB(c, pt) { return (c === KLAMMER ? 0.34 : 0.70) * pt * MM; }
    function breite(t, pt, fett) {   // Pfeile und ⟩ zählen mit ihrer gezeichneten Breite
      var n = 0, rest = String(t).replace(/[\uE000-\uE004]/g, function (c) { n += markenB(c, pt); return ''; });
      return roh(rest, pt, fett) + n;
    }
    /* Text-Op; enthält die Zeile Marken, wird sie in Text, Pfeile (art 'pfeil') und ⟩ (art 'klammer') zerlegt */
    function textOp(text, x, y0, pt, fett, farbe) {
      if (!MARKEN.test(text)) { s.ops.push({ art: 'text', x: x, y: y0, text: text, pt: pt, fett: !!fett, farbe: farbe }); return; }
      var cx = x;
      text.split(MARKEN_G).forEach(function (t) {
        if (!t) return;
        if (t.length === 1 && MARKEN.test(t)) {
          var w = markenB(t, pt);
          s.ops.push(t === KLAMMER ? { art: 'klammer', x: cx, y: y0, w: w, pt: pt, farbe: farbe } : { art: 'pfeil', x: cx, y: y0, w: w, pt: pt, richtung: RICHTUNG[t.charCodeAt(0) - 0xE000], farbe: farbe });
          cx += w;
        } else { s.ops.push({ art: 'text', x: cx, y: y0, text: t, pt: pt, fett: !!fett, farbe: farbe }); cx += roh(t, pt, fett); }
      });
    }
    function neueSeite() { s = { ops: [] }; seiten.push(s); y = RAND; }
    function platz(h) { if (y + h > UNTEN) neueSeite(); }
    function zeile(t, pt, fett, opt) {
      opt = opt || {};
      var lh = pt * 0.45;
      umbrechen(pdfText(t), pt, fett, B - (opt.einzug || 0), breite).forEach(function (z) {
        platz(lh);
        y += lh;
        textOp(z, RAND + (opt.einzug || 0), y, pt, fett, opt.farbe);
      });
    }
    function bild(quelle, w, h) {
      if (h > UNTEN - RAND) { w = w * (UNTEN - RAND) / h; h = UNTEN - RAND; }
      platz(h + 2);
      s.ops.push({ art: 'bild', x: RAND, y: y + 1, w: w, h: h, quelle: quelle });
      y += h + 3;
    }

    function tabelle(kopf, zeilen, markierung) {
      var n = kopf.length, PT = 9.5, LH = 4.3, ABST = 3;
      var kopfT = kopf.map(pdfText), zeilenT = zeilen.map(function (z) { return z.map(pdfText); });
      var sb = kopfT.map(function (k, j) {   // Breite: längstes Kopfwort, breitester Wert, Kopf bis 50 mm in einer Zeile
        var woerter = k.split(' ').map(function (t) { return breite(t, PT, true); });
        var werte = zeilenT.map(function (z) { return breite(z[j] || '', PT, false); });
        return Math.max.apply(null, [12, Math.min(breite(k, PT, true), 50)].concat(woerter, werte));
      });
      var summe = sb.reduce(function (a, b) { return a + b + ABST; }, 0);
      if (summe > B) sb = sb.map(function (w) { return w * (B - n * ABST) / (summe - n * ABST); });
      var xs = [], x0 = RAND; sb.forEach(function (w) { xs.push(x0); x0 += w + ABST; });
      [kopfT].concat(zeilenT).forEach(function (z, i) {
        var zellen = z.map(function (c, j) { return umbrechen(c, PT, i === 0, sb[j], breite); });
        var hoehe = Math.max.apply(null, zellen.map(function (l) { return l.length; })) * LH + 1;
        platz(hoehe + 1);
        var m = i > 0 && markierung ? markierung[i - 1] : null;
        if (m) s.ops.push({ art: 'rechteck', x: RAND, y: y, w: Math.max(x0 - ABST - RAND, 1), h: hoehe, farbe: m === 'ok' ? '#E6F1E6' : '#F8E3E3' });
        zellen.forEach(function (l, j) {
          l.forEach(function (t, k) { textOp(t, xs[j], y + LH * (k + 1), PT, i === 0); });
        });
        y += hoehe;
        s.ops.push({ art: 'linie', x1: RAND, y1: y, x2: x0 - ABST, y2: y, farbe: [217, 219, 226] });
      });
      y += 2;
    }
    function striche(t) {
      var w = 170, h = w / (t.verhaeltnis || 1000 / 240);
      if (h > UNTEN - RAND) { w = w * (UNTEN - RAND) / h; h = UNTEN - RAND; }
      platz(h + 2);
      s.ops.push({ art: 'linien', x: RAND, y: y + 1, w: w, h: h, striche: t.striche, hoehe_einheiten: 1000 / (t.verhaeltnis || 1000 / 240) });
      y += h + 3;
    }
    function teil(e, t, i) {
      if (t.titel) zeile(t.titel, 10, true);
      if (t.typ === 'text') zeile((e.art === 'vermutung' && i === 0 ? 'Vermutung: ' : '') + t.text, 10.5, false);
      else if (t.typ === 'tabelle') tabelle(t.kopf, t.zeilen, t.markierung);
      else if (t.typ === 'grafik' && t.bildDaten) { var w = t.breite_mm || 120, h = w * t.bildDaten.h / t.bildDaten.w; bild(t.bildDaten, w, h); }
      else if (t.typ === 'striche') striche(t);
    }

    var lizenzText = masse.lizenz && masse.lizenz !== 'CC BY 4.0' ? masse.lizenz : LIZENZ;
    neueSeite();
    var x2 = A4.b - RAND, logoOps = [];   // Logos rechts im Kopf, nebeneinander, 10 mm hoch
    (masse.logos || []).slice().reverse().forEach(function (l) {
      var w = 10 * l.w / l.h; x2 -= w;
      logoOps.unshift({ art: 'bild', x: x2, y: RAND - 10, w: w, h: 10, quelle: { url: l.url } });
      x2 -= 3;
    });
    logoOps.forEach(function (o) { s.ops.push(o); });
    zeile('Protokoll · ' + (p.kurs.titel || ''), 18, true, { farbe: NAVY });
    y += 1;
    zeile('Datum: ' + p.datum + (p.gruppe ? '   ·   Gruppe: ' + p.gruppe : '') + (p.rolle ? '   ·   Rolle: ' + p.rolle.charAt(0).toUpperCase() + p.rolle.slice(1) : ''), 11, false);
    y += 3; s.ops.push({ art: 'linie', x1: RAND, y1: y, x2: A4.b - RAND, y2: y, farbe: ORANGE }); y += 4;

    /* Seite 1 „Auf einen Blick“: Meine Definitionen (Text und/oder Handschrift) und Das hast du gelernt; das übrige Protokoll beginnt auf einer neuen Seite */
    if (p.blick) {
      platz(24); y += 2; zeile('Meine Definitionen', 14, true, { farbe: NAVY }); y += 1;
      p.blick.definitionen.forEach(function (d) {
        var e = d.eintrag; platz(14 + ersteHoehe(e)); y += 2;
        zeile(d.titel, 11, true);
        if (e.leer) zeile('noch nicht ausgefüllt', 10, false, { farbe: GRAU });
        else if (e.teile) e.teile.forEach(function (t, i) { teil({ art: 'definition' }, t, i); });
        else zeile(e.text, 10.5, false);
      });
      if (p.blick.zusammenfassung) {
        platz(30); y += 5; zeile('Das hast du gelernt', 14, true, { farbe: NAVY }); y += 1;
        p.blick.zusammenfassung.split('\n').forEach(function (z) { platz(8); zeile('• ' + z, 10, false, { einzug: 3 }); y += 0.8; });
      }
      var weiter = p.abschnitte.some(function (a) { return a.eintraege.some(function (e) { return !e.blick; }); });
      if (weiter) neueSeite();
    }

    p.abschnitte.forEach(function (a) {
      var es = a.eintraege.filter(function (e) { return (!e.leer || e.begonnen) && !e.blick; });   // begonnene Messungen auch
      if (!es.length) return;
      platz(20); y += 4;
      zeile(a.titel, 14, true, { farbe: NAVY });
      y += 1;
      es.forEach(function (e) {
        platz(12 + ersteHoehe(e)); y += 2;   // Überschrift nicht vom ersten Bild trennen
        zeile(e.titel, 11, true);
        if (e.teile) e.teile.forEach(function (t, i) { teil(e, t, i); });
        else if (e.art === 'text' || e.art === 'vermutung') zeile((e.art === 'vermutung' ? 'Vermutung: ' : '') + e.text, 10.5, false);
        else if (e.art === 'quiz') {
          var vorher = y;
          if (e.aufgegeben) zeile(e.antwortText + '  (' + (e.versuche ? 'nach ' + e.versuche + (e.versuche === 1 ? ' Versuch' : ' Versuchen') + ' ' : '') + 'aufgelöst)', 10.5, false);   // kein Haken, kein Kreuz
          else zeile(e.antwortText + (e.anteil > 0 && e.anteil < 0.999 ? '  (teilweise richtig)' : ''), 10.5, false, { einzug: e.anteil == null ? 0 : 6 });
          if (e.anteil != null && !e.aufgegeben) s.ops.push({ art: 'haken', x: RAND, y: Math.max(vorher, y - 4.5) + 0.5, ok: e.anteil >= 0.999 });
          if (e.zuordnung) tabelle(e.zuordnung.kopf, e.zuordnung.zeilen, null);
          if (e.loesung) zeile('Lösung: ' + e.loesung, 9.5, false, { farbe: GRAU });
        } else if (e.art === 'tabelle') {
          tabelle(e.kopf, e.zeilen, null);
          if (e.diagramm) bild(e.diagramm, 120, 75);
          if (e.ausgleichText) zeile(e.ausgleichText, 10.5, true, { farbe: NAVY });
        } else if (e.art === 'foto') {
          (e.bildDaten || []).forEach(function (b) { var w = 80, h = w * (b.h / b.w || 0.75); if (h > 100) { w = w * 100 / h; h = 100; } bild(b, w, h); });
        } else if (e.art === 'skizze') {
          if (e.bildDaten && e.bildDaten[0]) bild(e.bildDaten[0], 120, 120 / (e.verhaeltnis || 4 / 3));
        } else if (e.art === 'schritte') zeile(e.erledigt + ' von ' + e.gesamt + ' Schritten erledigt', 10.5, false);
        if (e.loesung && e.art !== 'quiz') zeile('Lösung: ' + e.loesung, 9.5, false, { farbe: GRAU });
      });
    });

    var offen = p.abschnitte.map(function (a) { return { titel: a.titel, leer: a.eintraege.filter(function (e) { return e.leer && !e.blick && !e.optional && e.art !== 'quiz'; }) }; }).filter(function (a) { return a.leer.length; });
    if (offen.length) {
      platz(24); y += 4;
      zeile('Noch offen', 14, true, { farbe: NAVY });
      y += 1;
      offen.forEach(function (a) {
        platz(12); y += 2;
        zeile(a.titel, 11, true);
        a.leer.forEach(function (e) { zeile('– ' + e.titel, 10.5, false, { einzug: 3 }); });
      });
    }

    seiten.forEach(function (sx, i) {
      sx.ops.push({ art: 'text', x: RAND, y: FUSS_Y, text: pdfText('Seite ' + (i + 1) + ' von ' + seiten.length + ' · ' + lizenzText), pt: 8, fett: false, farbe: GRAU, fuss: true });
    });
    return seiten;
  }

  /* ---------------------------------------------------------------- Bilder rastern (Browser) */
  function ladeBild(url) {
    return new Promise(function (ok, fehler) { var i = new root.Image(); i.onload = function () { ok(i); }; i.onerror = fehler; i.src = url; });
  }
  function leinwand(w, h) { var c = root.document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function blobUrl(b) { return new Promise(function (ok) { var r = new root.FileReader(); r.onload = function () { ok(r.result); }; r.readAsDataURL(b); }); }

  function rastereSvg(svg) {
    return ladeBild('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)).then(function (img) {
      var vb = /viewBox="[\d.\-]+[ ,]+[\d.\-]+[ ,]+([\d.]+)[ ,]+([\d.]+)"/.exec(svg), hh = vb ? Math.round(1440 * vb[2] / vb[1]) : 900;
      var c = leinwand(1440, hh), ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
      return { url: c.toDataURL('image/png'), w: c.width, h: c.height };
    });
  }
  function rastereFoto(blob) {
    return blobUrl(blob).then(function (u) { return ladeBild(u).then(function (i) { return { url: u, w: i.naturalWidth, h: i.naturalHeight }; }); });
  }
  function rastereSkizze(e) {
    var w = 1200, h = Math.round(w / (e.verhaeltnis || 4 / 3)), c = leinwand(w, h), ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    var vorlage = e.bild ? ladeBild(e.bild).then(function (i) {
      var f = Math.min(w / i.naturalWidth, h / i.naturalHeight), iw = i.naturalWidth * f, ih = i.naturalHeight * f;
      ctx.globalAlpha = 0.6; ctx.drawImage(i, (w - iw) / 2, (h - ih) / 2, iw, ih); ctx.globalAlpha = 1;
    }, function () {}) : Promise.resolve();
    return vorlage.then(function () {
      var o = leinwand(w, h), octx = o.getContext('2d');   // Radierer wirkt nur auf die Striche, nicht auf die Vorlage
      root.FX.skizze.zeichne(octx, e.striche, w, h);
      ctx.drawImage(o, 0, 0);
      return { url: c.toDataURL('image/jpeg', 0.85), w: w, h: h };
    });
  }
  function standardBild(e, quelle) {
    if (e.art === 'tabelle' || e.art === 'grafik') return rastereSvg(quelle);
    if (e.art === 'foto') return rastereFoto(quelle);
    if (e.art === 'skizze') return rastereSkizze(e);
    return Promise.resolve(null);
  }

  /* Pfeil (Linie mit Spitze, in Schriftgröße) und ⟩ (zwei kurze Linien) an der Grundlinie o.y */
  function zeichneMarke(doc, o) {
    var u = o.pt * 0.3528, f = o.farbe || [17, 17, 17];
    doc.setDrawColor.apply(doc, f); doc.setLineWidth(Math.max(0.15, u * 0.085));
    try { doc.setLineCap('round'); } catch (e) { /* ältere jsPDF */ }
    if (o.art === 'klammer') {
      var x = o.x + 0.04 * u, t = o.y - 0.72 * u, m = o.y - 0.34 * u, b = o.y + 0.04 * u;
      doc.line(x, t, x + 0.22 * u, m); doc.line(x + 0.22 * u, m, x, b); return;
    }
    var d = { '↑': [0, -1], '→': [1, 0], '↗': [0.7071, -0.7071], '↘': [0.7071, 0.7071] }[o.richtung], l = 0.56 * u / (d[0] && d[1] ? 1.15 : 1);
    var cx = o.x + 0.35 * u, cy = o.y - 0.34 * u, ax = cx - d[0] * l / 2, ay = cy - d[1] * l / 2, bx = cx + d[0] * l / 2, by = cy + d[1] * l / 2;
    doc.line(ax, ay, bx, by);
    [0.5, -0.5].forEach(function (w) {   // Spitze: zwei Linien, ±30° rückwärts
      var c = Math.cos(w), sn = Math.sin(w), rx = -(d[0] * c - d[1] * sn), ry = -(d[0] * sn + d[1] * c), k = 0.22 * u;
      doc.line(bx, by, bx + rx * k, by + ry * k);
    });
  }

  /* ---------------------------------------------------------------- PDF erzeugen */
  function erzeuge(p, opt) {
    opt = opt || {};
    var JsPDF = opt.jsPDF || (root.jspdf && root.jspdf.jsPDF);
    if (!JsPDF) return Promise.reject(new Error('jsPDF fehlt'));
    var bildVon = opt.bild || standardBild, arbeit = [];
    p.abschnitte.forEach(function (a) {
      a.eintraege.forEach(function (e) {
        if (e.leer && !e.begonnen) return;
        if (e.art === 'tabelle' && e.svg) arbeit.push(bildVon(e, e.svg).then(function (b) { e.diagramm = b; }, function () {}));
        (e.teile || []).forEach(function (t) { if (t.typ === 'grafik') arbeit.push(bildVon({ art: 'grafik' }, t.svg).then(function (b) { t.bildDaten = b; }, function () {})); });
        if (e.art === 'foto') arbeit.push(Promise.all(e.bilder.map(function (b) { return bildVon(e, b).catch(function () { return null; }); }))
          .then(function (l) { e.bildDaten = l.filter(Boolean); }));
        if (e.art === 'skizze') arbeit.push(bildVon(e, null).then(function (b) { e.bildDaten = b ? [b] : []; }, function () {}));
      });
    });
    return Promise.all(arbeit).then(function () {
      var doc = new JsPDF({ unit: 'mm', format: 'a4', compress: true });
      function schrift(pt, fett) { doc.setFont('helvetica', fett ? 'bold' : 'normal'); doc.setFontSize(pt); }
      var seiten = plane(p, { logos: opt.logos, lizenz: opt.lizenz, breite: function (t, pt, fett) { schrift(pt, fett); return doc.getTextWidth(t); } });
      seiten.forEach(function (sx, i) {
        if (i > 0) doc.addPage();
        sx.ops.forEach(function (o) {
          if (o.art === 'text') { schrift(o.pt, o.fett); doc.setTextColor.apply(doc, o.farbe || [17, 17, 17]); doc.text(o.text, o.x, o.y); }
          else if (o.art === 'linie') { doc.setDrawColor.apply(doc, o.farbe || [0, 0, 0]); doc.setLineWidth(o.farbe === ORANGE ? 0.8 : 0.2); doc.line(o.x1, o.y1, o.x2, o.y2); }
          else if (o.art === 'pfeil' || o.art === 'klammer') zeichneMarke(doc, o);
          else if (o.art === 'rechteck') { var hx = o.farbe.replace('#', ''); doc.setFillColor(parseInt(hx.slice(0, 2), 16), parseInt(hx.slice(2, 4), 16), parseInt(hx.slice(4, 6), 16)); doc.rect(o.x, o.y, o.w, o.h, 'F'); }
          else if (o.art === 'linien') {
            var f = o.w / 1000; try { doc.setLineCap('round'); doc.setLineJoin('round'); } catch (e) { /* ältere jsPDF */ }
            o.striche.forEach(function (st) {
              var c = (st.farbe || '#33416E').replace('#', '');
              doc.setDrawColor(parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)); doc.setLineWidth(Math.max(st.breite * f, 0.15));
              var q = st.punkte; if (q.length === 1) q = [q[0], [q[0][0] + 0.0002, q[0][1]]];
              for (var k = 1; k < q.length; k++) doc.line(o.x + q[k - 1][0] * o.w, o.y + q[k - 1][1] * f, o.x + q[k][0] * o.w, o.y + q[k][1] * f);
            });
          }
          else if (o.art === 'bild' && o.quelle && o.quelle.url) {
            var fmt = /^data:image\/png/.test(o.quelle.url) ? 'PNG' : 'JPEG';
            try { doc.addImage(o.quelle.url, fmt, o.x, o.y, o.w, o.h); } catch (e) { /* Bild überspringen */ }
          } else if (o.art === 'haken') {
            doc.setLineWidth(0.6);
            if (o.ok) { doc.setDrawColor(42, 121, 176); doc.line(o.x, o.y + 2, o.x + 1.5, o.y + 3.5); doc.line(o.x + 1.5, o.y + 3.5, o.x + 4, o.y); }
            else { doc.setDrawColor(180, 74, 96); doc.line(o.x, o.y, o.x + 3.5, o.y + 3.5); doc.line(o.x + 3.5, o.y, o.x, o.y + 3.5); }
          }
        });
      });
      return new Uint8Array(doc.output('arraybuffer'));
    });
  }

  return { plane: plane, erzeuge: erzeuge, pdfText: pdfText, umbrechen: umbrechen };
});
