/* Baustein Foto: Kamera oder Fotoauswahl, verkleinert (lange Kante 1600 px, JPEG 0,8) gespeichert. */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).foto = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  var MAX = 1600, QUALITAET = 0.8;
  var VOLL = 'Das Foto konnte nicht gespeichert werden – der Speicher des Geräts ist voll. Löscht ältere Fotos in diesem Feld.';

  function zielmass(w, h, max) {
    var f = Math.min(1, max / Math.max(w, h));
    return [Math.round(w * f), Math.round(h * f)];
  }

  /* Bild dekodieren: createImageBitmap mit Ausrichtung, ohne Optionen (ältere Safari lehnen sie ab), zuletzt <img>. */
  function perImg(blob) {
    return new Promise(function (ok, fehler) {
      var img = new root.Image(), u = root.URL.createObjectURL(blob);
      img.onload = function () { ok(img); }; img.onerror = function (e) { try { root.URL.revokeObjectURL(u); } catch (x) {} fehler(e); };
      img.src = u;
    });
  }
  function bitmap(blob) {
    var cib = root.createImageBitmap;
    if (!cib) return perImg(blob);
    return Promise.resolve().then(function () { return cib.call(root, blob, { imageOrientation: 'from-image' }); })
      .catch(function () { return cib.call(root, blob); })
      .catch(function () { return perImg(blob); });
  }

  /* toBlob liefert auf manchen iPads null (Speicher knapp): dann über toDataURL, notfalls kleiner noch einmal */
  function alsBlob(c, qualitaet) {
    return new Promise(function (ok) {
      try { c.toBlob(function (b) { ok(b || null); }, 'image/jpeg', qualitaet); } catch (e) { ok(null); }
    }).then(function (b) {
      if (b && b.size) return b;
      var url = c.toDataURL('image/jpeg', qualitaet), roh = root.atob(url.split(',')[1] || ''), n = roh.length, a = new Uint8Array(n);
      for (var i = 0; i < n; i++) a[i] = roh.charCodeAt(i);
      if (!n) throw new Error('leer');
      return new root.Blob([a], { type: 'image/jpeg' });
    });
  }

  function verkleinere(blob, maxKante, qualitaet) {
    return bitmap(blob).then(function (b) {
      var w = b.width || b.naturalWidth, h = b.height || b.naturalHeight;
      if (!w || !h) throw new Error('kein Bild');
      function versuch(max) {
        var m = zielmass(w, h, max), c = root.document.createElement('canvas');
        c.width = m[0]; c.height = m[1];
        c.getContext('2d').drawImage(b, 0, 0, m[0], m[1]);
        return alsBlob(c, qualitaet || QUALITAET);
      }
      return versuch(maxKante || MAX).catch(function () { return versuch(Math.round((maxKante || MAX) / 2)); });
    });
  }

  function bilder(el) { if (!el._fxB) el._fxB = []; return el._fxB; }
  var OHNE_TEXT = 'Kein Foto: Es ließ sich nicht hochladen.';
  /* Sperre und Freischaltung sofort neu prüfen (das Foto kommt asynchron, nicht über ein input-Ereignis des Feldes) */
  function neuPruefen(el) {
    var f = root.FX && root.FX.felder; if (!f) return;
    if (el.hasAttribute('data-fx-sperrt')) f.sperren(el.ownerDocument); else f.festhalten(el.ownerDocument);
  }
  /* „Ohne Foto weiter“: nur sichtbar, solange kein Foto da ist und ein Versuch gemacht wurde (oder schon übersprungen ist) */
  function notausgang(el) {
    var k = el.querySelector('.fx-foto-ohne'), h = el.querySelector('.fx-foto-ohne-hinweis');
    var leer = !bilder(el).length;
    if (k) k.hidden = !(leer && el._fxVersuch && !el._fxOhne);
    if (h) { h.hidden = !(leer && el._fxOhne); h.textContent = OHNE_TEXT; }
    if (!leer) el._fxOhne = false;
  }
  function url(el, b) { try { return el.ownerDocument.defaultView.URL.createObjectURL(b); } catch (e) { return ''; } }

  function meldung(el, text, info) {
    var m = el.querySelector('.fx-meldung'); if (!m) return;
    m.textContent = text || ''; m.hidden = !text; m.classList.toggle('fx-info', !!info);
  }

  function zeichne(el) {
    var ul = el.querySelector('.fx-fotos'), d = el.ownerDocument;
    ul.innerHTML = '';
    bilder(el).forEach(function (b, i) {
      var li = d.createElement('li'), img = d.createElement('img'), x = d.createElement('button');
      img.src = url(el, b); img.alt = 'Foto ' + (i + 1);
      x.type = 'button'; x.className = 'fx-knopf'; x.textContent = 'Foto löschen';
      x.addEventListener('click', function () {
        if (!root.FX.felder.frage('Dieses Foto löschen?')) return;
        bilder(el).splice(i, 1); zeichne(el); meldung(el, ''); root.FX.felder.speichere(el); neuPruefen(el);
      });
      li.appendChild(img); li.appendChild(x); ul.appendChild(li);
    });
    notausgang(el);
  }

  /* Fügt ein (bereits verkleinertes) Bild hinzu und speichert sofort; bei vollem Speicher wird es wieder entfernt. */
  function hinzufuegen(el, blob) {
    bilder(el).push(blob); el._fxOhne = false; zeichne(el); meldung(el, '');
    el._fxNeu = blob;
    neuPruefen(el);
    return root.FX.felder.speichere(el).then(function () { el._fxNeu = null; neuPruefen(el); });
  }

  var FEHLER = 'Das Bild konnte nicht gelesen werden. Versucht es noch einmal oder wählt ein anderes Foto.';
  function init(el) {
    Array.prototype.forEach.call(el.querySelectorAll('.fx-foto-eingabe'), function (inp) {
      /* Schon das Antippen zählt als Versuch: Kommt danach kein Foto an (Abbruch, stiller Fehler), bleibt der Notausgang erreichbar. */
      var knopf = inp.closest('label') || inp;
      knopf.addEventListener('click', function () { el._fxVersuch = true; setTimeout(function () { notausgang(el); }, 1500); });
      inp.addEventListener('change', function (e) {
        e.stopPropagation();
        var f = inp.files && inp.files[0]; inp.value = '';
        el._fxVersuch = true;
        if (!f) { notausgang(el); return; }
        meldung(el, 'Foto wird verarbeitet …', true);
        verkleinere(f).then(function (b) { return hinzufuegen(el, b); }, function () {
          meldung(el, FEHLER); notausgang(el);
        });
      });
    });
    var ohne = el.querySelector('.fx-foto-ohne');
    if (ohne) ohne.addEventListener('click', function () {
      el._fxOhne = true; meldung(el, ''); notausgang(el);
      root.FX.felder.speichere(el).then(function () { neuPruefen(el); });
      neuPruefen(el);
    });
  }

  if (root.FX && root.FX.felder) root.FX.felder.registriere('foto', {
    init: init,
    laden: function (el, w) { el._fxB = (w.bilder || []).slice(); el._fxOhne = !!w.ohne && !el._fxB.length; el._fxVersuch = false; zeichne(el); },
    wert: function (el) { var w = { bilder: bilder(el).slice() }; if (el._fxOhne && !w.bilder.length) w.ohne = true; return w; },
    leer: function (w) { return !(w && ((w.bilder && w.bilder.length) || w.ohne)); },
    sperrhinweis: 'Fügt zuerst ein Foto hinzu, dann geht es weiter.',
    speicherfehler: function (el) {
      if (el._fxNeu) { var i = bilder(el).indexOf(el._fxNeu); if (i >= 0) bilder(el).splice(i, 1); el._fxNeu = null; el._fxVersuch = true; zeichne(el); neuPruefen(el); }
      meldung(el, VOLL);
    }
  });
  return { zielmass: zielmass, verkleinere: verkleinere, hinzufuegen: hinzufuegen, OHNE_TEXT: OHNE_TEXT };
});
