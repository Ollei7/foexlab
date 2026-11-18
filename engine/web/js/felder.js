/* Bindet alle .fx-feld an den Speicher: laden, bei Änderung entprellt speichern, fx:geaendert melden. */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).felder = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  var arten = {}, store = null, VERZOEGERUNG = 400, ausstehend = [];

  function registriere(art, h) { arten[art] = h; }

  function istLeer(art, wert) {
    if (wert === undefined || wert === null) return true;
    var h = arten[art];
    try { return h && h.leer ? !!h.leer(wert) : false; } catch (e) { return true; }
  }

  function melde(el, typ) {
    var d = el.ownerDocument;
    d.dispatchEvent(new d.defaultView.CustomEvent(typ, { detail: { id: el.getAttribute('data-fx-id'), el: el } }));
  }

  function nichtMehrAusstehend(el) {
    clearTimeout(el._fxTimer);
    var i = ausstehend.indexOf(el); if (i >= 0) ausstehend.splice(i, 1);
  }

  function speichere(el) {
    var h = arten[el.getAttribute('data-fx-art')];
    nichtMehrAusstehend(el);
    if (!h || !store) return Promise.resolve();
    var wert;
    try { wert = h.wert(el); } catch (e) { return Promise.resolve(); }
    return store.schreibe(el.getAttribute('data-fx-id'), wert).then(function () {
      melde(el, 'fx:geaendert');
    }, function (e) {
      melde(el, 'fx:speicherfehler');
      if (h.speicherfehler) h.speicherfehler(el, e);
    });
  }

  function spaeter(el) {
    clearTimeout(el._fxTimer);
    if (ausstehend.indexOf(el) < 0) ausstehend.push(el);
    el._fxTimer = setTimeout(function () { speichere(el); }, VERZOEGERUNG);
  }

  /* Alle noch nicht gespeicherten Eingaben sofort schreiben (vor Ergebnisansicht, beim Verlassen der Seite) */
  function speichereAlle() { return Promise.all(ausstehend.slice().map(speichere)); }

  /* Ausstehende Speicherungen verwerfen (vor „Neue Gruppe“) */
  function abbrechen() { ausstehend.slice().forEach(nichtMehrAusstehend); }

  function binde(el) {
    var h = arten[el.getAttribute('data-fx-art')];
    if (!h || el._fxGebunden) return;
    el._fxGebunden = true;
    if (h.init) h.init(el);
    ['input', 'change'].forEach(function (typ) {
      el.addEventListener(typ, function (e) {
        if (h.beiEingabe) h.beiEingabe(el, e);
        if (el.hasAttribute('data-fx-sperrt')) sperren(el.ownerDocument); else festhalten(el.ownerDocument);
        spaeter(el);
      });
    });
  }

  /* Lädt gespeicherte Werte in alle Felder. Werte zu unbekannten IDs bleiben unberührt. */
  function start(s, wurzel) {
    store = s;
    var d = wurzel || root.document;
    var els = Array.prototype.slice.call(d.querySelectorAll('.fx-feld'));
    return Promise.all(els.map(function (el) {
      var h = arten[el.getAttribute('data-fx-art')];
      if (!h) return null;
      binde(el);
      return s.lies(el.getAttribute('data-fx-id')).then(function (w) {
        if (w === undefined) return;
        try { h.laden(el, w); } catch (e) { /* alte oder kaputte Form: Feld bleibt leer, Wert bleibt gespeichert */ }
      }, function () { /* Lesefehler: Feld bleibt leer */ });
    })).then(function () { sperren(d); });
  }

  /* sperrt (bei {.frei}, {.vermutung}): folgende Felder derselben Karte und alle folgenden Karten desselben Kapitels sperren,
     bis das Feld nicht leer ist. Im Betreuungsmodus (alles frei) gibt es keine Sperren. */
  /* Hinweis unter dem sperrenden Feld: eine Feldart kann ihn mit sperrhinweis (Text oder function (el)) selbst liefern;
     Hypothesen-Felder (vermutung) bitten um die Vermutung, alle anderen neutral um die Aufgabe selbst. */
  var SPERRHINWEIS_HYPOTHESE = 'Tragt zuerst eure Vermutung ein.', SPERRHINWEIS = 'Erledigt zuerst diese Aufgabe, dann geht es weiter.';
  function sperrhinweis(h, el) {
    var t = h && h.sperrhinweis;
    if (typeof t === 'function') { try { t = t(el); } catch (e) { t = null; } }
    if (typeof t === 'string' && t) return t;
    return h && h.hypothese ? SPERRHINWEIS_HYPOTHESE : SPERRHINWEIS;
  }
  function allesFrei() { var f = root.FX && root.FX.freischaltung; return !!(f && f.istAllesFrei && f.istAllesFrei()); }
  function sperren(wurzel) {
    var d = wurzel || root.document, kartenSperre = [], alles = allesFrei();
    Array.prototype.forEach.call(d.querySelectorAll('.fx-feld[data-fx-sperrt]'), function (v) {
      var art = v.getAttribute('data-fx-art'), h = arten[art], w;
      try { w = h ? h.wert(v) : undefined; } catch (e) { w = undefined; }
      var frei = alles || !istLeer(art, w);
      var karte = v.closest('.act, .fx-karte') || d.body || d;
      Array.prototype.forEach.call(karte.querySelectorAll('.fx-feld, .fx-schritt'), function (f) {
        if (f === v || !(v.compareDocumentPosition(f) & 4)) return;
        if (f.hasAttribute('data-fx-optional')) { f.removeAttribute('data-fx-gesperrt'); return; }   // freiwillige Felder sperrt nichts
        if (frei) f.removeAttribute('data-fx-gesperrt'); else f.setAttribute('data-fx-gesperrt', '1');
      });
      var hh = v.querySelector('.fx-sperrhinweis');
      if (!frei && !hh) { hh = v.ownerDocument.createElement('p'); hh.className = 'fx-sperrhinweis'; v.appendChild(hh); }
      if (!frei) hh.textContent = sperrhinweis(h, v);
      if (frei && hh) hh.remove();
      var ab = karte.getAttribute && karte.getAttribute('data-abschnitt-id');
      if (!frei && ab) Array.prototype.forEach.call(d.querySelectorAll('.fx-karte[data-abschnitt-id="' + ab + '"]'), function (k) {
        if ((karte.compareDocumentPosition(k) & 4) && !kartenSperre.some(function (x) { return x.k === k; })) kartenSperre.push({ k: k, titel: v.getAttribute('data-fx-titel') || '', text: art === 'text' || art === 'vermutung' });
      });
    });
    Array.prototype.forEach.call(d.querySelectorAll('.fx-karte[data-abschnitt-id]'), function (k) {
      var s = kartenSperre.filter(function (x) { return x.k === k; })[0], h = k.querySelector('.fx-kartensperre-hinweis');
      if (s) {
        k.setAttribute('data-fx-kartensperre', s.titel);
        if (!h) { h = d.createElement('p'); h.className = 'fx-sperrhinweis fx-kartensperre-hinweis'; var t = k.querySelector('h2'); if (t && t.nextSibling) k.insertBefore(h, t.nextSibling); else k.appendChild(h); }
        var kt = s.titel.length > 70 ? s.titel.slice(0, 67) + '…' : s.titel;
        h.textContent = s.text ? 'Tragt zuerst etwas in ‚' + kt + '‘ ein.' : 'Erledigt zuerst ‚' + kt + '‘.';
      } else { k.removeAttribute('data-fx-kartensperre'); if (h) h.remove(); }
    });
    festhalten(d);
  }

  /* Hypothesen festhalten (Feldarten mit hypothese:true, z. B. vermutung): Sobald ein späteres Feld desselben Kapitels,
     das selbst keine Hypothese ist (nicht ohneProtokoll, optionale zählen mit), nicht leer ist, ist die Hypothese
     schreibgeschützt. Eine Feldart kann mit begonnen(wert) früher auslösen als „nicht leer“ (z. B. Messung nach dem ersten Photon). Im Betreuungsmodus nie. Hypothesen untereinander lösen nichts aus (Vorhersage + Begründung). */
  var FESTHINWEIS = 'Festgehalten – eure Hypothese vor der Messung.';
  function kapitelVon(el) { var k = el.closest('.fx-karte'); return { karte: k, ab: k && k.getAttribute('data-abschnitt-id') }; }
  function festhalten(wurzel) {
    var d = wurzel || root.document, alle = Array.prototype.slice.call(d.querySelectorAll('.fx-feld')), frei = allesFrei();
    alle.forEach(function (v) {
      var h = arten[v.getAttribute('data-fx-art')];
      if (!h || !h.hypothese) return;
      var kv = kapitelVon(v), fest = false;
      if (!frei) fest = alle.some(function (f) {
        if (f === v || !(v.compareDocumentPosition(f) & 4)) return false;
        var hf = arten[f.getAttribute('data-fx-art')];
        if (!hf || hf.hypothese || hf.ohneProtokoll) return false;
        var kf = kapitelVon(f);
        if (kv.ab ? kf.ab !== kv.ab : kf.karte !== kv.karte) return false;
        var w; try { w = hf.wert(f); } catch (e) { return false; }
        return hf.begonnen ? !!hf.begonnen(w) : !istLeer(f.getAttribute('data-fx-art'), w);
      });
      var hin = v.querySelector('.fx-festhinweis');
      if (fest === v.hasAttribute('data-fx-festgehalten')) return;
      if (fest) {
        v.setAttribute('data-fx-festgehalten', '1');
        if (!hin) { hin = d.createElement('p'); hin.className = 'fx-festhinweis'; hin.textContent = FESTHINWEIS; v.appendChild(hin); }
      } else {
        v.removeAttribute('data-fx-festgehalten');
        if (hin) hin.remove();
      }
      if (h.schreibschutz) h.schreibschutz(v, fest);
    });
  }

  /* Selbstkontrolle prüfen und Ergebnis sofort speichern */
  function pruefen(el) {
    var h = arten[el.getAttribute('data-fx-art')];
    if (h && h.pruefen) h.pruefen(el);
    if (el.hasAttribute('data-fx-sperrt')) sperren(el.ownerDocument); else festhalten(el.ownerDocument);   // Kontrollfragen öffnen erst nach dem Prüfen
    return speichere(el);
  }

  var textfeld = {
    laden: function (el, w) { el.querySelector('textarea').value = w.text || ''; },
    wert: function (el) { return { text: el.querySelector('textarea').value }; },
    leer: function (w) { return !(w && w.text && w.text.trim()); }
  };
  registriere('text', textfeld);
  registriere('vermutung', Object.assign({}, textfeld, {
    hypothese: true,
    schreibschutz: function (el, an) { el.querySelector('textarea').readOnly = an; }
  }));

  /* Rückfrage; ohne echtes confirm (Test) gilt sie als bestätigt */
  function frage(text) {
    try { return root.confirm(text) !== false; } catch (e) { return true; }
  }

  return { speicher: function () { return store; }, speichereAlle: speichereAlle, abbrechen: abbrechen, frage: frage, registriere: registriere, start: start, speichere: speichere, pruefen: pruefen, istLeer: istLeer, sperren: sperren, festhalten: festhalten, arten: arten };
});
