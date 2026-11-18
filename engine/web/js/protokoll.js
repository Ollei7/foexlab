/* Protokoll: alle Eingaben in Seitenreihenfolge sammeln (für Ergebnisseite und PDF). */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).protokoll = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  function FX() { return root.FX; }
  function $(s, r) { return Array.prototype.slice.call(r.querySelectorAll(s)); }
  function zwei(n) { return (n < 10 ? '0' : '') + n; }
  function datumText(d) { return zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '.' + d.getFullYear(); }
  function text(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function antwortText(feld, w) {
    var q = feld.querySelector('.q'), t = q && q.getAttribute('data-type'), a = w && w.antwort;
    if (a == null) return '';
    if ((t === 'mc' || t === 'gaps') && !Array.isArray(a)) return '';
    if (t === 'mc') return a.map(function (i) { var li = $('li', q)[i]; return text(li && (li.querySelector('label span') || li)); }).join(' · ');
    if (t === 'gaps') return a.filter(function (x) { return x; }).join(' · ');
    var u = q && q.querySelector('.unit');
    return String(a).trim() + (t === 'num' && u && String(a).trim() ? ' ' + text(u) : '');
  }

  /* Bildzuordnung: Tabelle „Platz | Zuordnung“ (Platz n = n-ter Platz im Bild, dort als kleine Nummer sichtbar) */
  function zuordnungTabelle(feld, w) {
    var q = feld.querySelector('.q'), a = w && w.antwort;
    if (!q || q.getAttribute('data-type') !== 'gaps' || !q.querySelector('.ddimg') || !Array.isArray(a)) return null;
    var n = $('.ddimg .spot', q).length;
    if (!n) return null;
    var zeilen = [];
    for (var i = 0; i < n; i++) zeilen.push(['Platz ' + (i + 1), a[i] ? String(a[i]) : '–']);
    return { kopf: ['Platz', 'Zuordnung'], zeilen: zeilen };
  }

  function eintrag(feld, w, kurs) {
    var art = feld.getAttribute('data-fx-art'), e = { id: feld.getAttribute('data-fx-id'), titel: feld.getAttribute('data-fx-titel') || '', art: art };
    if (feld.hasAttribute('data-fx-optional')) e.optional = true;
    e.leer = FX().felder ? FX().felder.istLeer(art, w) : w === undefined;
    var h = FX().felder && FX().felder.arten[art];
    /* Begonnene, aber noch nicht erledigte Felder (z. B. Messung mit 1000 von 5000 Photonen) erscheinen trotzdem im Protokoll;
       leer bleibt gesetzt (Liste „Noch offen“, Sperren), ein solches Feld steht dann in beiden. */
    if (h && h.begonnen && e.leer && w !== undefined && w !== null) { try { e.begonnen = !!h.begonnen(w); } catch (x) { e.begonnen = false; } }
    if (h && h.protokoll && (!e.leer || e.begonnen)) e.teile = h.protokoll(feld, w);
    if (art === 'text' || art === 'vermutung') {
      e.text = (w && w.text) || '';
      var lo = kurs.musterloesungen && feld.querySelector('.fx-loesung'); if (lo) e.loesung = text(lo);
    }
    else if (art === 'quiz') {
      e.antwortText = antwortText(feld, w);
      var zt = zuordnungTabelle(feld, w);
      if (zt) { e.zuordnung = zt; e.antwortText = 'Zuordnung'; }
      e.anteil = w && w.anteil != null ? w.anteil : null;
      if (w && w.kontrolle && w.aufgegeben) { e.aufgegeben = true; e.versuche = +w.versuche || 0; }
      if (kurs.musterloesungen) {
        var g = feld.querySelector('.gfb'); if (g) { var k = g.cloneNode(true), s = k.querySelector('strong'); if (s) s.remove(); e.loesung = text(k); }
        var ex = feld.querySelector('.fx-loesung'); if (ex) e.loesung = text(ex);
      }
    } else if (art === 'tabelle') {
      var M = FX().messtabelle, konf = JSON.parse(feld.getAttribute('data-fx-konfig')), zeilen = (w && w.zeilen) || [];
      e.kopf = konf.spalten.map(M.kopf);
      e.zeilen = zeilen.filter(function (z) { return z.some(function (c) { return String(c || '').trim(); }); }).map(function (z) {
        var v = M.berechne(konf, z), i = 0;
        return konf.spalten.map(function (s) { return s.formel ? M.fmt(v[s.kuerzel]) : String(z[i++] || '').trim(); });
      });
      if (konf.diagramm) {
        var p = M.punkte(konf, { zeilen: zeilen });
        e.gerade = konf.diagramm.ausgleich === 'keiner' ? null : FX().ausgleich.gerade(p, konf.diagramm.ausgleich);
        e.ausgleichText = M.ausgleichText(konf, e.gerade, p.length);
        e.svg = p.length ? M.svgDiagramm(p, e.gerade, { x: M.kopf(M.spalte(konf, konf.diagramm.x)), y: M.kopf(M.spalte(konf, konf.diagramm.y)) }) : '';
      }
    } else if (art === 'foto') e.bilder = (w && w.bilder) || [];
    else if (art === 'skizze') {
      var kf = feld.getAttribute('data-fx-konfig'), fl = feld.querySelector('.fx-flaeche');
      e.striche = (w && w.striche) || [];
      e.bild = kf ? JSON.parse(kf).bild : null;
      var vm = fl && /aspect-ratio:\s*([\d.]+)\s*\/\s*([\d.]+)/.exec(fl.getAttribute('style') || '');
      e.verhaeltnis = vm ? +vm[1] / +vm[2] : 4 / 3;
    } else if (art === 'schritte') {
      e.gesamt = $('.fx-schritt', feld).length; e.erledigt = ((w && w.erledigt) || []).length;
    }
    return e;
  }

  /* „Auf einen Blick“: Definitionen (Feld-ID endet auf /<kennung>) und Zusammenfassung (Text einer Karte) */
  function kartenText(dokument, id) {
    var k = dokument.querySelector('.fx-karte[data-karte="' + id + '"]'); if (!k) return '';
    var li = $('li', k).filter(function (x) { return !x.closest('.fx-lehrkraft'); }).map(text).filter(Boolean);
    if (li.length) return li.join('\n');
    return $('p', k).filter(function (x) { return !x.closest('.fx-info, .fx-kicker, .fx-lehrkraft'); }).map(text).filter(Boolean).join('\n');
  }
  function blickDaten(abschnitte, dokument, cfg) {
    var defs = Object.keys(cfg.definitionen || {}).map(function (titel) {
      var kennung = cfg.definitionen[titel], fund = null;
      abschnitte.forEach(function (a) { a.eintraege.forEach(function (e) { if (!fund && (e.id === kennung || e.id.slice(-(kennung.length + 1)) === '/' + kennung)) fund = e; }); });
      if (fund) fund.blick = true;
      return { titel: titel, eintrag: fund || { id: kennung, titel: titel, art: 'text', leer: true } };
    });
    return { definitionen: defs, zusammenfassung: cfg.zusammenfassung ? kartenText(dokument, cfg.zusammenfassung) : '' };
  }

  function sammle(dokument, werte, kurs, datum) {
    werte = werte || {}; kurs = kurs || {};
    var abschnitte = [], nachTitel = {};
    $('.fx-karte', dokument).forEach(function (k) {
      var felder = $('.fx-feld', k); if (!felder.length) return;
      var t = k.getAttribute('data-abschnitt') || '';
      if (!nachTitel[t]) { nachTitel[t] = { titel: t, eintraege: [] }; abschnitte.push(nachTitel[t]); }
      felder.forEach(function (f) {
        var hh = FX().felder && FX().felder.arten[f.getAttribute('data-fx-art')];
        if (hh && hh.ohneProtokoll) return;
        var e;
        try { e = eintrag(f, werte[f.getAttribute('data-fx-id')], kurs); }
        catch (x) { e = { id: f.getAttribute('data-fx-id'), titel: f.getAttribute('data-fx-titel') || '', art: f.getAttribute('data-fx-art'), leer: true }; }
        nachTitel[t].eintraege.push(e);
      });
    });
    var p = { kurs: { id: kurs.id, titel: kurs.titel }, datum: datumText(datum || new Date()),
      gruppe: (werte._gruppe && werte._gruppe.namen) || '', rolle: typeof werte._rolle === 'string' ? werte._rolle : '', abschnitte: abschnitte };
    if (kurs.auf_einen_blick) p.blick = blickDaten(abschnitte, dokument, kurs.auf_einen_blick);
    return p;
  }

  /* ---------------------------------------------------------------- Ergebnisansicht */
  /* Kontrollfrage nach n Fehlversuchen aufgelöst: neutral, nicht „nicht richtig“ */
  function aufgeloestText(e) { return e.versuche ? 'nach ' + e.versuche + (e.versuche === 1 ? ' Versuch' : ' Versuchen') + ' aufgelöst' : 'aufgelöst'; }
  function bewertung(a, e) {
    if (e && e.aufgegeben) return '<span class="fx-bew">' + aufgeloestText(e) + '</span>';
    if (a === null || a === undefined) return '<span class="fx-bew">nicht geprüft</span>';
    return a >= 0.999 ? '<span class="fx-bew ok">✓ richtig</span>' : a > 0 ? '<span class="fx-bew part">teilweise richtig</span>' : '<span class="fx-bew bad">✗ nicht richtig</span>';
  }

  function teilHtml(e, t, i) {
    var kopf = t.titel ? '<h5>' + esc(t.titel) + '</h5>' : '';
    if (t.typ === 'text') return kopf + '<p class="fx-antwort">' + esc(t.text).replace(/\n/g, '<br>') + '</p>';
    if (t.typ === 'tabelle') return kopf + '<div class="fx-tab-wrap"><table class="fx-ergebnis-tabelle"><thead><tr>' + t.kopf.map(function (k) { return '<th>' + esc(k) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      t.zeilen.map(function (z, j) { var m = t.markierung && t.markierung[j]; return '<tr' + (m ? ' class="fx-' + m + '"' : '') + '>' + z.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    if (t.typ === 'grafik') return kopf + '<div class="fx-diagramm">' + t.svg + '</div>';
    if (t.typ === 'striche') return kopf + '<div class="fx-flaeche fx-striche-erg" style="aspect-ratio:' + t.verhaeltnis + '"><canvas data-striche="' + esc(e.id + '#' + i) + '"></canvas></div>';
    return '';
  }

  function inhalt(e, bildUrl) {
    if (e.leer && !e.begonnen) return '<p class="note">(leer)</p>';
    var lo = e.loesung && e.art !== 'quiz' ? '<p class="note">Lösung: ' + esc(e.loesung) + '</p>' : '';
    if (e.teile) return e.teile.map(function (t, i) { return teilHtml(e, t, i); }).join('') + lo;
    switch (e.art) {
      case 'text': case 'vermutung': return '<p class="fx-antwort">' + esc(e.text).replace(/\n/g, '<br>') + '</p>' + lo;
      case 'quiz': return '<p class="fx-antwort">' + esc(e.antwortText) + ' ' + bewertung(e.anteil, e) + '</p>' + (e.zuordnung ? teilHtml(e, { typ: 'tabelle', kopf: e.zuordnung.kopf, zeilen: e.zuordnung.zeilen }, 0) : '') + (e.loesung ? '<p class="note">Lösung: ' + esc(e.loesung) + '</p>' : '');
      case 'tabelle':
        return '<div class="fx-tab-wrap"><table class="fx-ergebnis-tabelle"><thead><tr>' + e.kopf.map(function (k) { return '<th>' + esc(k) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          e.zeilen.map(function (z) { return '<tr>' + z.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
          (e.svg ? '<div class="fx-diagramm">' + e.svg + '</div>' : '') + (e.ausgleichText ? '<p class="fx-ausgleich">' + esc(e.ausgleichText) + '</p>' : '');
      case 'foto': return '<div class="fx-fotos">' + e.bilder.map(function (b, i) { return '<img alt="Foto ' + (i + 1) + '" src="' + esc(bildUrl(b)) + '">'; }).join('') + '</div>';
      case 'skizze': return '<div class="fx-flaeche" style="aspect-ratio:' + e.verhaeltnis + '">' + (e.bild ? '<img class="fx-vorlage" alt="" src="' + esc(e.bild) + '">' : '') + '<canvas data-skizze="' + esc(e.id) + '"></canvas></div>';
      case 'schritte': return '<p class="fx-antwort">' + e.erledigt + ' von ' + e.gesamt + ' Schritten erledigt</p>';
    }
    return '';
  }

  function html(p, opt) {
    opt = opt || {};
    var bildUrl = opt.bildUrl || function (b) { try { return root.URL.createObjectURL(b); } catch (e) { return ''; } };
    var kopf = '<p class="fx-protokoll-kopf"><strong>' + esc(p.kurs.titel) + '</strong> · ' + esc(p.datum) + (p.gruppe ? ' · Gruppe: ' + esc(p.gruppe) : '') + (p.rolle ? ' · Rolle: ' + esc(rolleText(p.rolle)) : '') + '</p>';
    return kopf + blickHtml(p, bildUrl) + (p.abschnitte.map(function (a) {
      var es = a.eintraege.filter(function (e) { return !e.blick && (opt.leereZeigen || !e.leer || e.begonnen); });
      if (!es.length) return '';
      return '<section class="fx-erg-abschnitt"><h3>' + esc(a.titel) + '</h3>' + es.map(function (e) {
        return '<div class="fx-erg-eintrag' + (e.leer && !e.begonnen ? ' fx-leer' : '') + '"><h4>' + esc(e.titel) + '</h4>' + inhalt(e, bildUrl) + '</div>';
      }).join('') + '</section>';
    }).join('') || '<p class="note">Noch keine Eingaben.</p>') + offenHtml(p);
  }

  function rolleText(r) { return r ? r.charAt(0).toUpperCase() + r.slice(1) : ''; }
  function blickHtml(p, bildUrl) {
    if (!p.blick) return '';
    var defs = p.blick.definitionen.map(function (d) {
      return '<div class="fx-erg-eintrag' + (d.eintrag.leer ? ' fx-leer' : '') + '"><h4>' + esc(d.titel) + '</h4>' + (d.eintrag.leer ? '<p class="note">noch nicht ausgefüllt</p>' : inhalt(d.eintrag, bildUrl)) + '</div>';
    }).join('');
    var zus = p.blick.zusammenfassung ? '<h4>Das hast du gelernt</h4><ul>' + p.blick.zusammenfassung.split('\n').map(function (z) { return '<li>' + esc(z) + '</li>'; }).join('') + '</ul>' : '';
    return '<section class="fx-erg-abschnitt fx-blick"><h3>Auf einen Blick</h3><h4 class="fx-blick-titel">Meine Definitionen</h4>' + defs + zus + '</section>';
  }

  function offenHtml(p) {
    var a = p.abschnitte.map(function (x) { return { titel: x.titel, leer: x.eintraege.filter(function (e) { return e.leer && !e.blick && !e.optional && e.art !== 'quiz'; }) }; }).filter(function (x) { return x.leer.length; });
    if (!a.length) return '';
    return '<section class="fx-erg-abschnitt fx-offen"><h3>Noch offen</h3>' + a.map(function (x) {
      return '<h4>' + esc(x.titel) + '</h4><ul>' + x.leer.map(function (e) { return '<li>' + esc(e.titel) + '</li>'; }).join('') + '</ul>';
    }).join('') + '</section>';
  }

  function zeichneSkizzen(container, p) {
    p.abschnitte.forEach(function (a) {
      a.eintraege.forEach(function (e) {
        if (e.art !== 'skizze') return;
        var c = container.querySelector('canvas[data-skizze="' + e.id + '"]'); if (!c || !c.getContext) return;
        var r = c.getBoundingClientRect(); c.width = Math.round(r.width) || 800; c.height = Math.round(r.height) || 600;
        var ctx = c.getContext('2d'); if (ctx) FX().skizze.zeichne(ctx, e.striche, c.width, c.height);
      });
    });
  }

  function zeichneStriche(container, p) {
    p.abschnitte.forEach(function (a) {
      a.eintraege.forEach(function (e) {
        (e.teile || []).forEach(function (t, i) {
          if (t.typ !== 'striche') return;
          var c = container.querySelector('canvas[data-striche="' + e.id + '#' + i + '"]'); if (!c || !c.getContext) return;
          var r = c.getBoundingClientRect(); c.width = Math.round(r.width) || 800; c.height = Math.round(c.width / t.verhaeltnis);
          var ctx = c.getContext('2d'); if (ctx) FX().stiftfeld.zeichne(ctx, t.striche, c.width);
        });
      });
    });
  }

  /* In der echten Seite: Ergebnisansicht bei jedem Öffnen neu aufbauen */
  var letztes = null;
  function zeigeErgebnis() {
    var box = root.document.getElementById('fx-ergebnis-inhalt'), ober = FX().oberflaeche;
    if (!box || !ober || !ober.speicher()) return Promise.resolve(null);
    var kurs = JSON.parse(root.document.getElementById('fx-kurs').textContent);
    return FX().felder.speichereAlle().then(function () { return ober.speicher().alle(); }).then(function (werte) {
      letztes = sammle(root.document, werte, kurs, new Date());
      var schalter = box.querySelector('#fx-leere');
      var zeigen = schalter ? schalter.checked : false;
      box.innerHTML = '<label class="fx-haken"><input type="checkbox" id="fx-leere"' + (zeigen ? ' checked' : '') + '> Leere Felder anzeigen</label>' +
        '<div class="fx-sichern"></div><div class="fx-erg-inhalt">' + html(letztes, { leereZeigen: zeigen }) + '</div>';
      zeichneSkizzen(box, letztes); zeichneStriche(box, letztes);
      box.querySelector('#fx-leere').addEventListener('change', zeigeErgebnis);
      root.document.dispatchEvent(new root.CustomEvent('fx:ergebnis', { detail: { protokoll: letztes, box: box } }));
      return letztes;
    });
  }
  if (root.document && root.document.addEventListener) root.document.addEventListener('fx:ansicht', function (e) {
    if (e.detail && e.detail.ziel && e.detail.ziel.id === 'fx-ergebnis') zeigeErgebnis();
  });

  return { sammle: sammle, html: html, zeigeErgebnis: zeigeErgebnis, zeichneSkizzen: zeichneSkizzen, letztes: function () { return letztes; } };
});
