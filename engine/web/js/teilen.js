/* Protokoll sichern: Teilen-Menü bzw. Download, Abholcode über den Pi, Gerät zurücksetzen. */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).teilen = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  var KEIN_SERVER = 'Server nicht erreichbar – seid ihr mit dem WLAN „foeXlab“ verbunden?';
  function zwei(n) { return (n < 10 ? '0' : '') + n; }

  function dateiname(kurs, datum) {
    var d = datum || new Date();
    return 'Protokoll-' + kurs.id + '-' + d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate()) + '.pdf';
  }

  function herunterladen(bytes, name) {
    var blob = new root.Blob([bytes], { type: 'application/pdf' }), url = root.URL.createObjectURL(blob);
    var a = root.document.createElement('a');
    a.href = url; a.download = name; root.document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { try { root.URL.revokeObjectURL(url); } catch (e) { /* egal */ } }, 60000);
    return 'heruntergeladen';
  }

  function sichern(bytes, name) {
    var nav = root.navigator, datei;
    try { datei = new root.File([bytes], name, { type: 'application/pdf' }); } catch (e) { datei = null; }
    if (datei && nav.canShare && nav.share && nav.canShare({ files: [datei] })) {
      return nav.share({ files: [datei], title: name }).then(function () { return 'geteilt'; }, function (e) {
        if (e && e.name === 'AbortError') return 'abgebrochen';
        return herunterladen(bytes, name);
      });
    }
    return Promise.resolve(herunterladen(bytes, name));
  }

  function abholcode(bytes, kursId) {
    return Promise.resolve().then(function () {
      return root.fetch('/api/ablegen', { method: 'POST', body: bytes, headers: { 'Content-Type': 'application/pdf', 'X-Experiment': kursId } });
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error(j.fehler || ('Fehler ' + r.status)); }, function () { throw new Error('Fehler ' + r.status); });
      return r.json();
    }, function () { throw new Error(KEIN_SERVER); });
  }

  function qrSvg(text) {
    if (!root.qrcode) return '';
    var q = root.qrcode(0, 'M'); q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
  }

  /* ---------------------------------------------------------------- Knöpfe in der Ergebnisansicht */
  function knoepfe(box, kurs) {
    var d = root.document;
    box.innerHTML = '';
    function knopf(text, klasse, fn) {
      var b = d.createElement('button'); b.type = 'button'; b.className = 'fx-knopf ' + (klasse || ''); b.textContent = text;
      b.addEventListener('click', fn); box.appendChild(b); return b;
    }
    var status = d.createElement('div'); status.className = 'fx-sichern-status'; status.setAttribute('role', 'status');
    function melde(html) { status.innerHTML = html; }
    function pdf() {
      melde('PDF wird erstellt …');
      var p = root.FX.protokoll.letztes();
      return root.FX.pdf.erzeuge(p, { logos: logos(), lizenz: kurs.lizenz });
    }
    var teilenKnopf = null;
    knopf('Protokoll als PDF sichern', 'fx-haupt', function () {
      pdf().then(function (b) {
        // Safari erlaubt das Teilen-Menü nur direkt nach einem Tippen: deshalb ein zweiter Knopf
        if (teilenKnopf) teilenKnopf.remove();
        teilenKnopf = knopf('PDF teilen oder sichern', 'fx-haupt', function () {
          sichern(b, dateiname(kurs)).then(function (r) {
            melde(r === 'abgebrochen' ? '' : 'Protokoll gesichert. Ihr könnt jederzeit einen neuen Stand sichern.');
          });
        });
        box.insertBefore(teilenKnopf, status);
        melde('PDF ist fertig. Tippt auf „PDF teilen oder sichern“.');
      }, function (e) { melde('<span class="fx-meldung">PDF konnte nicht erstellt werden: ' + (e && e.message) + '</span>'); });
    });
    if (kurs.abholdienst) knopf('Abholcode erzeugen', '', function () {
      pdf().then(function (b) { return abholcode(b, kurs.id); }).then(function (r) {
        var url = root.location.origin + r.url;
        melde('<div class="fx-abholcode"><p>Euer Abholcode</p><strong>' + r.code + '</strong>' + qrSvg(url) +
          '<p>Mit dem eigenen Handy im WLAN „foeXlab“ den QR-Code scannen oder <b>' + root.location.host + '/abholen</b> öffnen und den Code eingeben. Der Code gilt bis heute Abend.</p></div>');
      }, function (e) { melde('<span class="fx-meldung">' + (e && e.message) + '</span>'); });
    });
    knopf('Gerät für nächste Gruppe zurücksetzen', '', function () { root.FX.oberflaeche.neueGruppe(); });
    box.appendChild(status);
  }

  function logos() {
    return Array.prototype.slice.call(root.document.querySelectorAll('.fx-fusslogo')).filter(function (i) { return i.naturalWidth; })
      .map(function (i) { return { url: i.src, w: i.naturalWidth, h: i.naturalHeight }; });
  }

  if (root.document && root.document.addEventListener) root.document.addEventListener('fx:ergebnis', function (e) {
    var kurs = JSON.parse(root.document.getElementById('fx-kurs').textContent);
    var box = e.detail.box.querySelector('.fx-sichern');
    if (box) knoepfe(box, kurs);
  });

  return { dateiname: dateiname, sichern: sichern, abholcode: abholcode, knoepfe: knoepfe, qrSvg: qrSvg };
});
