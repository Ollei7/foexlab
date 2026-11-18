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

  function bitmap(blob) {
    if (root.createImageBitmap) return root.createImageBitmap(blob, { imageOrientation: 'from-image' });
    return new Promise(function (ok, fehler) {
      var img = new root.Image(); img.onload = function () { ok(img); }; img.onerror = fehler;
      img.src = root.URL.createObjectURL(blob);
    });
  }

  function verkleinere(blob, maxKante, qualitaet) {
    return bitmap(blob).then(function (b) {
      var m = zielmass(b.width, b.height, maxKante || MAX), c = root.document.createElement('canvas');
      c.width = m[0]; c.height = m[1];
      c.getContext('2d').drawImage(b, 0, 0, m[0], m[1]);
      return new Promise(function (ok) { c.toBlob(ok, 'image/jpeg', qualitaet || QUALITAET); });
    });
  }

  function bilder(el) { if (!el._fxB) el._fxB = []; return el._fxB; }
  function url(el, b) { try { return el.ownerDocument.defaultView.URL.createObjectURL(b); } catch (e) { return ''; } }

  function meldung(el, text) {
    var m = el.querySelector('.fx-meldung'); if (!m) return;
    m.textContent = text || ''; m.hidden = !text;
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
        bilder(el).splice(i, 1); zeichne(el); meldung(el, ''); root.FX.felder.speichere(el);
      });
      li.appendChild(img); li.appendChild(x); ul.appendChild(li);
    });
  }

  /* Fügt ein (bereits verkleinertes) Bild hinzu und speichert sofort; bei vollem Speicher wird es wieder entfernt. */
  function hinzufuegen(el, blob) {
    bilder(el).push(blob); zeichne(el); meldung(el, '');
    el._fxNeu = blob;
    return root.FX.felder.speichere(el).then(function () { el._fxNeu = null; });
  }

  function init(el) {
    Array.prototype.forEach.call(el.querySelectorAll('.fx-foto-eingabe'), function (inp) {
      inp.addEventListener('change', function (e) {
        e.stopPropagation();
        var f = inp.files && inp.files[0]; inp.value = '';
        if (!f) return;
        verkleinere(f).then(function (b) { return hinzufuegen(el, b); }, function () {
          meldung(el, 'Das Bild konnte nicht gelesen werden. Versucht es noch einmal.');
        });
      });
    });
  }

  if (root.FX && root.FX.felder) root.FX.felder.registriere('foto', {
    init: init,
    laden: function (el, w) { el._fxB = (w.bilder || []).slice(); zeichne(el); },
    wert: function (el) { return { bilder: bilder(el).slice() }; },
    leer: function (w) { return !(w && w.bilder && w.bilder.length); },
    speicherfehler: function (el) {
      if (el._fxNeu) { var i = bilder(el).indexOf(el._fxNeu); if (i >= 0) bilder(el).splice(i, 1); el._fxNeu = null; zeichne(el); }
      meldung(el, VOLL);
    }
  });
  return { zielmass: zielmass, verkleinere: verkleinere, hinzufuegen: hinzufuegen };
});
