/* Oberfläche: Übersicht, Kartenansicht (eine Karte sichtbar), Labormodus, Gruppe, Speicherwarnung,
   Medien der Einzeldatei, Dialog für HTML-Anhänge, Prüfen-Knöpfe. */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).oberflaeche = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  var store = null, ansicht = { labor: false, karte: null, ziel: null };
  var WARNUNG = {
    fluechtig: 'Eure Eingaben werden in diesem Modus nicht dauerhaft gespeichert (privater Tab?). Öffnet die Seite in einem normalen Tab.',
    aus: 'Speichern ist auf diesem Gerät nicht möglich. Erstellt zwischendurch ein PDF.',
    voll: 'Der Speicher des Geräts ist voll – neue Eingaben werden nicht gespeichert. Löscht Fotos oder sichert jetzt ein PDF.'
  };
  var NEUE_GRUPPE = 'Habt ihr euer Protokoll gesichert? Alle Eingaben auf diesem Gerät werden gelöscht, auch in anderen Experimenten. Heruntergeladene PDFs bleiben in der App „Dateien“.';
  var gruppenTimer = null;

  function d() { return root.document; }
  function $(s, r) { return Array.prototype.slice.call((r || d()).querySelectorAll(s)); }
  function karten() { return $('.fx-karte'); }
  function FX() { return root.FX; }

  /* ---------------------------------------------------------------- Fortschritt */
  function fortschritt(karte) {
    var felder = $('.fx-feld', karte), voll = 0;
    felder.forEach(function (f) {
      var art = f.getAttribute('data-fx-art'), h = FX().felder.arten[art];
      if (!h) return;
      var w; try { w = h.wert(f); } catch (e) { w = undefined; }
      if (!FX().felder.istLeer(art, w)) voll++;
    });
    return { voll: voll, gesamt: felder.length };
  }

  /* Anteil ausgefüllter Felder des ganzen Kurses; setzt den Fortschrittsbalken unter dem Kopf */
  function gesamtfortschritt() {
    var voll = 0, gesamt = 0;
    karten().forEach(function (k) { var f = fortschritt(k); voll += f.voll; gesamt += f.gesamt; });
    var i = d().querySelector('.fx-fortschritt-balken i');
    if (i) i.style.width = (gesamt ? Math.round(voll / gesamt * 100) : 0) + '%';
    return { voll: voll, gesamt: gesamt };
  }

  function zeigeFortschritt() {
    $('.fx-fortschritt[data-karte]').forEach(function (s) {
      var k = d().querySelector('.fx-karte[data-karte="' + s.getAttribute('data-karte') + '"]');
      if (!k) return;
      var f = fortschritt(k);
      s.textContent = f.gesamt ? f.voll + '/' + f.gesamt : '';
      s.classList.toggle('fx-komplett', f.gesamt > 0 && f.voll === f.gesamt);
    });
  }

  /* ---------------------------------------------------------------- Ansichten */
  function speichereAnsicht() { if (store) store.schreibe('_ansicht', { labor: ansicht.labor, karte: ansicht.karte }).catch(function () {}); }

  function F() { return root.FX && root.FX.freischaltung; }
  function reihenfolge(k) {   // Nachschlage-Karten bilden eine eigene Reihenfolge
    var nach = k.hasAttribute('data-nachschlagen');
    return karten().filter(function (x) { return x.hasAttribute('data-nachschlagen') === nach; });
  }

  /* „← Zurück zu ‚Karte‘“ oben auf einer Karte, solange ein Rücksprung vorgemerkt ist */
  function ruecksprungKnopf(karte) {
    var alt = karte.querySelector('.fx-ruecksprung'); if (alt) alt.remove();
    var id; try { id = root.sessionStorage.getItem('fx-zurueck'); } catch (e) { id = null; }
    if (!id) return;
    if (id === karte.getAttribute('data-karte')) { try { root.sessionStorage.removeItem('fx-zurueck'); } catch (e) { /* egal */ } return; }
    var ziel = d().querySelector('.fx-karte[data-karte="' + id + '"]'), t = ziel && ziel.querySelector('h2');
    if (!t) return;
    var b = d().createElement('button'); b.type = 'button'; b.className = 'fx-knopf fx-ruecksprung';
    b.textContent = '← Zurück zu ‚' + t.textContent + '‘';
    b.addEventListener('click', function () { try { root.sessionStorage.removeItem('fx-zurueck'); } catch (e) { /* egal */ } geheZu('#k/' + id); });
    karte.insertBefore(b, karte.firstChild);
  }

  function zeige(hash) {
    hash = hash || '';
    var ziel = null, ks = karten(), gesperrt = null, kartenZiel = null;
    if (hash.indexOf('#k/') === 0) kartenZiel = d().querySelector('.fx-karte[data-karte="' + hash.slice(3) + '"]');
    if (kartenZiel) {
      var st = F() ? F().kartenStatus(kartenZiel.getAttribute('data-karte')) : { offen: true };
      if (st.offen) ziel = kartenZiel; else { gesperrt = st; ziel = d().getElementById('fx-gesperrt'); }
    } else if (hash === '#ergebnis') ziel = d().getElementById('fx-ergebnis');
    if (!ziel) ziel = d().getElementById('fx-start');
    $('.fx-ansicht').forEach(function (a) { a.hidden = a !== ziel; });
    var start = ziel && ziel.id === 'fx-start', istKarte = ziel && ziel.classList.contains('fx-karte');
    var unten = d().querySelector('.fx-unten'); if (unten) unten.hidden = !(istKarte || gesperrt);
    $('.fx-oben .fx-zur-uebersicht').forEach(function (b) { b.hidden = start; });
    var ort = d().querySelector('.fx-ort'), aktuell = kartenZiel;
    if (gesperrt) {
      d().querySelector('#fx-gesperrt .fx-grund').textContent = gesperrt.grund;
      if (ort) ort.textContent = 'Noch gesperrt';
    }
    if (aktuell) {
      var folge = reihenfolge(aktuell), i = folge.indexOf(aktuell), ab = aktuell.getAttribute('data-abschnitt');
      var gleiche = ks.filter(function (k) { return k.getAttribute('data-abschnitt') === ab; });
      if (istKarte && ort) ort.textContent = ab + ' · Karte ' + (gleiche.indexOf(aktuell) + 1) + ' von ' + gleiche.length;
      d().querySelector('.fx-zurueck-karte').disabled = i === 0;
      d().querySelector('.fx-weiter-karte').disabled = i === folge.length - 1;
      ansicht.ziel = aktuell.getAttribute('data-karte');
    }
    if (istKarte) {
      ruecksprungKnopf(ziel);
      ansicht.karte = ziel.getAttribute('data-karte'); speichereAnsicht();
      if (root.scrollTo) try { root.scrollTo(0, 0); } catch (e) { /* jsdom */ }
    } else if (!gesperrt && ort) {
      ort.textContent = ziel && ziel.id === 'fx-ergebnis' ? 'Ergebnisse' : 'Übersicht';
    }
    if (start) { zeigeFortschritt(); uebersichtAktualisieren(); }
    d().dispatchEvent(new root.CustomEvent('fx:ansicht', { detail: { ziel: ziel } }));
    return ziel;
  }

  /* Schloss und Grund in der Übersicht */
  function uebersichtAktualisieren() {
    var f = F(); if (!f) return;
    $('.fx-abschnitte > li[data-abschnitt-id]').forEach(function (li) {
      var ab = li.getAttribute('data-abschnitt-id'), offen = f.istOffen(ab), p = li.querySelector('.fx-sperre'), ul = li.querySelector('.fx-kartenliste');
      li.classList.toggle('fx-zu', !offen);
      if (p) { p.hidden = offen; p.textContent = offen ? '' : '🔒 ' + f.grund(ab); }
      if (ul) ul.hidden = !offen;
      $('li[data-karte]', li).forEach(function (k) {
        var st = f.kartenStatus(k.getAttribute('data-karte')), kl = k.querySelector('.fx-sperre-klein');
        k.classList.toggle('fx-zu', !st.offen);
        if (kl) { kl.hidden = st.offen; kl.textContent = st.offen ? '' : '🔒 ' + st.grund; }
      });
    });
  }

  function geheZu(hash) {
    if (root.location.hash !== hash) {
      try { root.history.pushState(null, '', hash || root.location.pathname); } catch (e) { root.location.hash = hash; }
    }
    return zeige(hash);
  }

  function nachbar(schritt) {
    var k = d().querySelector('.fx-karte[data-karte="' + ansicht.ziel + '"]'); if (!k) return;
    var folge = reihenfolge(k), ziel = folge[folge.indexOf(k) + schritt];
    if (ziel) geheZu('#k/' + ziel.getAttribute('data-karte'));
  }

  /* ---------------------------------------------------------------- Labormodus, Gruppe, Neue Gruppe */
  function labor(an) {
    ansicht.labor = !!an;
    if (an) d().documentElement.dataset.labor = '1'; else delete d().documentElement.dataset.labor;
    $('.fx-labor').forEach(function (b) { b.setAttribute('aria-pressed', an ? 'true' : 'false'); });
  }

  function neueGruppe() {
    if (!FX().felder.frage(NEUE_GRUPPE)) return Promise.resolve(false);
    FX().felder.abbrechen(); clearTimeout(gruppenTimer);
    try { root.sessionStorage.removeItem('fx-zurueck'); } catch (e) { /* egal */ }
    return (store.leerenAlles ? store.leerenAlles() : store.leeren()).then(function () {
      if (F()) F().zuruecksetzen();
      try { root.history.replaceState(null, '', root.location.pathname); } catch (e) { /* egal */ }
      api.neuLaden();
      return true;
    });
  }

  function warnung(status) {
    var w = d().getElementById('fx-warnung'); if (!w) return;
    w.textContent = WARNUNG[status] || ''; w.hidden = !WARNUNG[status];
  }

  /* ---------------------------------------------------------------- Medien (Einzeldatei) und Dialog */
  function medien() {
    var AE = d().getElementById('assets'), A = AE ? JSON.parse(AE.textContent) : {}, cache = {};
    function bytes(h) { var b = root.atob(A[h].d), n = b.length, u = new Uint8Array(n); for (var i = 0; i < n; i++) u[i] = b.charCodeAt(i); return u; }
    function url(h) { if (!A[h]) return ''; if (!cache[h]) cache[h] = root.URL.createObjectURL(new root.Blob([bytes(h)], { type: A[h].m })); return cache[h]; }
    var dlg = d().getElementById('dlg'), dlgf = d().getElementById('dlgf');
    function oeffne(name, setze) { if (!dlg) return; d().getElementById('dlgt').textContent = name; setze(); dlg.showModal(); }
    $('[data-asset]').forEach(function (el) {
      var h = el.getAttribute('data-asset');
      if (!A[h]) { if (el.tagName === 'IMG') el.alt = '(Bild nicht eingebettet)'; return; }
      if (el.tagName === 'A') {
        var m = A[h].m, name = el.getAttribute('data-name') || '';
        if (m === 'text/html') el.addEventListener('click', function (e) { e.preventDefault(); oeffne(name, function () { dlgf.removeAttribute('src'); dlgf.srcdoc = new root.TextDecoder().decode(bytes(h)); }); });
        else { el.href = url(h); el.target = '_blank'; el.rel = 'noopener'; if (m === 'application/pdf') el.setAttribute('download', name); }
      } else {
        el.src = url(h);
        if (el.tagName === 'SOURCE' && el.parentNode.load) el.parentNode.load();
      }
    });
    $('iframe[data-pdf]').forEach(function (f) { f.src = url(f.getAttribute('data-pdf')); });
    $('a[data-html]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); oeffne(a.getAttribute('data-name') || '', function () { dlgf.removeAttribute('srcdoc'); dlgf.src = a.getAttribute('href'); }); });
    });
    var x = d().getElementById('dlgx');
    if (x) x.addEventListener('click', function () { dlg.close(); dlgf.removeAttribute('src'); dlgf.srcdoc = ''; });
  }

  /* ---------------------------------------------------------------- Betreuungsmodus: 5-mal auf „foeXlab“ tippen */
  var tipps = [];
  function betreuungsTipp() {
    var jetzt = Date.now(); tipps = tipps.filter(function (t) { return jetzt - t < 3000; }); tipps.push(jetzt);
    if (tipps.length < 5) return;
    tipps = [];
    if (F() && FX().felder.frage('Betreuungsmodus: Alle Kapitel und Karten freischalten?')) F().allesFrei();
  }

  /* ---------------------------------------------------------------- Klicks */
  function klicks() {
    d().addEventListener('click', function (e) {
      var l = e.target.closest && e.target.closest('[data-fx-ruecksprung]');
      if (l && ansicht.karte) { try { root.sessionStorage.setItem('fx-zurueck', ansicht.karte); } catch (x) { /* egal */ } }
      var h = e.target.closest && e.target.closest('.fx-herkunft'); if (h) betreuungsTipp();
      var b = e.target.closest && e.target.closest('button'); if (!b) return;
      var q = b.closest('.q'), f = q && q.closest('.fx-feld');
      if (b.classList.contains('check')) {
        if (f && f.getAttribute('data-fx-art') === 'quiz') FX().felder.pruefen(f);
        else if (q && q.getAttribute('data-type') === 'essay') { var g = q.querySelector('.gfb'); if (g) g.hidden = !g.hidden; }
      } else if (b.classList.contains('reset') && q) {
        FX().quiz.zuruecksetzen(q); if (f) { delete f.dataset.anteil; FX().felder.speichere(f); }
      } else if (b.classList.contains('fx-weiter-karte')) nachbar(1);
      else if (b.classList.contains('fx-zurueck-karte')) nachbar(-1);
      else if (b.classList.contains('fx-zur-uebersicht')) geheZu('');
      else if (b.classList.contains('fx-labor')) { labor(!ansicht.labor); speichereAnsicht(); }
      else if (b.id === 'fx-neue-gruppe') neueGruppe();
      else if (b.id === 'fx-weiter-wo') geheZu('#k/' + ansicht.karte);
    });
  }

  /* ---------------------------------------------------------------- Start */
  /* Betreuungsmodus (alles frei): Hinweise für Lehrkräfte einblenden */
  function betreuungsKlasse() {
    var f = FX().freischaltung;
    d().body.classList.toggle('fx-betreuung', !!(f && f.istAllesFrei && f.istAllesFrei()));
  }
  function starte(s) {
    store = s;
    betreuungsKlasse();
    klicks();
    root.addEventListener('popstate', function () { zeige(root.location.hash); });
    root.addEventListener('hashchange', function () { zeige(root.location.hash); });
    d().addEventListener('fx:freischaltung', function () { betreuungsKlasse(); FX().felder.sperren(d()); uebersichtAktualisieren(); if (!d().getElementById('fx-start').hidden) zeigeFortschritt(); });
    d().addEventListener('fx:geaendert', function () { gesamtfortschritt(); if (!d().getElementById('fx-start').hidden) zeigeFortschritt(); });
    d().addEventListener('fx:speicherfehler', function () { warnung('voll'); });
    function sofortSichern() { FX().felder.speichereAlle(); }
    root.addEventListener('pagehide', sofortSichern);
    d().addEventListener('visibilitychange', function () { if (d().visibilityState === 'hidden') sofortSichern(); });
    var gruppe = d().getElementById('fx-gruppe');
    var fertig = Promise.all([
      s.lies('_ansicht').catch(function () {}),
      s.lies('_gruppe').catch(function () {}),
      FX().store.status()
    ]).then(function (r) {
      if (r[0]) { ansicht.karte = r[0].karte || null; labor(r[0].labor); }
      if (gruppe && r[1]) gruppe.value = r[1].namen || '';
      warnung(r[2]);
      var weiter = d().getElementById('fx-weiter-wo');
      if (weiter) weiter.hidden = !ansicht.karte || !d().querySelector('.fx-karte[data-karte="' + ansicht.karte + '"]');
      zeige(root.location.hash);
      FX().felder.sperren(d());
      gesamtfortschritt();
    });
    if (gruppe) gruppe.addEventListener('input', function () {
      clearTimeout(gruppenTimer);
      gruppenTimer = setTimeout(function () { s.schreibe('_gruppe', { namen: gruppe.value }).catch(function () {}); }, 400);
    });
    return fertig;
  }

  function stoppeOhneSpeicher() {
    warnung('aus');
    zeige(root.location.hash);
  }

  /* Automatischer Start in der echten Seite */
  if (root.document && root.document.getElementById && root.document.getElementById('fx-kurs')) {
    var go = function () {
      medien();
      var kurs = JSON.parse(root.document.getElementById('fx-kurs').textContent);
      root.FX.store.oeffne(kurs.id).then(function (s) {
        var regeln = root.document.getElementById('fx-regeln');
        return root.FX.felder.start(s).then(function () { return root.FX.freischaltung.start(s, regeln ? JSON.parse(regeln.textContent) : null); }).then(function () { return starte(s); });
      }, function () { klicks(); stoppeOhneSpeicher(); });
    };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', go); else go();
  }

  var api = { speicher: function () { return store; }, starte: starte, zeige: zeige, geheZu: geheZu, fortschritt: fortschritt, gesamtfortschritt: gesamtfortschritt, labor: labor, neueGruppe: neueGruppe,
    neuLaden: function () { root.location.reload(); } };
  return api;
});
