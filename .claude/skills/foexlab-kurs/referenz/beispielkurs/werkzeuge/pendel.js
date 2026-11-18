/* Werkzeug „pendel“ (Beispielkurs, aus der Simulationsvorlage): Regler für die Fadenlänge L in cm, Skizze des Pendels,
   Knopf „Messwert übernehmen“ liefert die Periodendauer T = 2π·√(L/g) in s (2 Nachkommastellen). Gespeichert wird {werte: [{x, y}]}.
   Im Kurs: ### Titel {.werkzeug name="pendel" min="10" max="100" schritt="10" einheit="cm" groesse="Fadenlänge" sperrt}
   (sperrt: weiter geht es erst nach mindestens einem übernommenen Messwert; ohne sperrt ist das Feld nur ein Angebot.)
   Beim Kopieren ändert man nur die Stellen mit „HIER ANPASSEN“ (und den Namen der Feldart, siehe LIESMICH.md).
   NICHT ändern: Speicherung (nur über wert/laden), feste Farben in der Skizze, `change` nur nach „Übernehmen“,
   altes JavaScript (kein ?. und ?? , kein import/export). */
(function (root) {
  const FX = root.FX;
  // Text für HTML/SVG unschädlich machen (Konfigurationstexte stammen aus dem Kurstext)
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const ART = 'pendel';            // HIER ANPASSEN: neuer Name der Feldart (gleich wie name="…" im Kurstext)

  /* ---- 1. Die Rechenvorschrift: aus dem Reglerwert x wird der Messwert y ---- */
  function f(x, k) {                // HIER ANPASSEN: y = f(x); hier x = Fadenlänge in cm, y = Periodendauer in s
    const g = 9.81, laenge = x / 100;
    return Math.round(2 * Math.PI * Math.sqrt(laenge / g) * 100) / 100;
  }

  /* ---- 2. Die Skizze: ein SVG, das vom Reglerwert abhängt. Nur feste Farben (#RRGGBB), nie var(…) oder currentColor,
         sonst ist die Grafik im PDF leer oder schwarz. ---- */
  function skizze(x, k) {           // HIER ANPASSEN: Zeichnung (Pendel, Fadenlänge maßstäblich zum Regler)
    const anteil = k.max > k.min ? (x - k.min) / (k.max - k.min) : 0;
    const laenge = Math.round(30 + anteil * 120), kx = 150 + Math.round(laenge * 0.26), ky = 18 + Math.round(laenge * 0.97);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190" width="300" height="190" role="img" aria-label="Skizze des Pendels">' +
      '<rect x="0" y="0" width="300" height="190" fill="#FFFFFF"/>' +
      '<rect x="100" y="10" width="100" height="8" fill="#33416E"/>' +
      '<line x1="150" y1="18" x2="' + kx + '" y2="' + ky + '" stroke="#222222" stroke-width="2"/>' +
      '<circle cx="' + kx + '" cy="' + ky + '" r="10" fill="#F58411"/>' +
      '<text x="10" y="30" font-size="12" fill="#222222">' + esc(x + ' ' + k.einheit) + '</text></svg>';
  }

  /* ---- Ab hier nichts ändern ---- */
  const zahl = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
  // Gespeicherten Wert säubern: nur Einträge mit zwei echten Zahlen bleiben
  function fuelle(w) {
    const werte = [];
    ((w && w.werte) || []).forEach((r) => { if (r && zahl(r.x) !== null && zahl(r.y) !== null) werte.push({ x: r.x, y: r.y }); });
    return { werte };
  }
  // Einstellungen aus dem Kurstext (data-fx-konfig), mit Standardwerten; weitere Attribute (z. B. n="1.33") kommen
  // unter ihrem Namen dazu: als Zahl, wenn der Text eine Zahl ist (Komma oder Punkt), sonst als Text
  function konfig(el) {
    let c = {};
    try { c = JSON.parse(el.getAttribute('data-fx-konfig')) || {}; } catch (e) { c = {}; }
    if (typeof c !== 'object' || Array.isArray(c)) c = {};
    const n = (v, std) => { const z = parseFloat(v); return isFinite(z) ? z : std; };
    const k = {};
    Object.keys(c).forEach((a) => {
      const t = String(c[a]).trim().replace(',', '.');
      k[a] = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t) ? parseFloat(t) : c[a];
    });
    // min/max/schritt aus k: dort ist das Komma schon ein Punkt ("0,5" → 0.5)
    k.min = n(k.min, 0); k.max = n(k.max, 10); k.schritt = n(k.schritt, 1);
    k.einheit = c.einheit || ''; k.groesse = c.groesse || 'x';
    if (k.schritt <= 0) k.schritt = 1;
    // Nachkommastellen der Schrittweite: darauf werden Reglerwerte gerundet (0.1 + 0.2 soll nicht 0.30000000000000004 sein)
    const ks = String(k.schritt).split('.')[1];
    k.stellen = ks ? ks.length : 0;
    return k;
  }
  function el_(tag, attr, kinder) {
    const e = root.document.createElement(tag);
    Object.keys(attr || {}).forEach((a) => e.setAttribute(a, attr[a]));
    (kinder || []).forEach((c) => e.appendChild(typeof c === 'string' ? root.document.createTextNode(c) : c));
    return e;
  }
  const runde = (v, k) => parseFloat(v.toFixed(k.stellen));
  const kopfX = (k) => k.groesse + (k.einheit ? ' in ' + k.einheit : '');

  function init(el) {
    if (el._vlLaden) return;        // schon aufgebaut
    const flaeche = el.querySelector('.fx-werkzeug-flaeche'), k = konfig(el);
    let s = fuelle(null), x = k.min;
    const bild = el_('div', { 'data-o': 'skizze' });
    const regler = el_('input', { type: 'range', min: k.min, max: k.max, step: k.schritt, value: k.min, 'aria-label': kopfX(k), style: 'width:100%;min-height:44px;accent-color:#3F9AD6' });
    const anzeige = el_('output', {});
    const knopf = el_('button', { type: 'button', 'class': 'fx-knopf fx-haupt', 'data-o': 'uebernehmen' }, ['Messwert übernehmen']);
    const tbody = el_('tbody');
    const tabelle = el_('table', {}, [el_('thead', {}, [el_('tr', {}, [el_('th', {}, [kopfX(k)]), el_('th', {}, ['Messwert'])])]), tbody]);
    flaeche.appendChild(el_('div', { 'class': 'vl-box' }, [bild, el_('label', {}, [anzeige, regler]), el_('div', { 'class': 'fx-knoepfe' }, [knopf]),
      el_('div', { 'class': 'fx-tab-wrap' }, [tabelle])]));

    function zeichne() {
      bild.innerHTML = skizze(x, k);
      anzeige.textContent = kopfX(k) + ': ' + x + ' ';
    }
    function zeigeTabelle() {
      tbody.innerHTML = '';
      if (!s.werte.length) tbody.appendChild(el_('tr', {}, [el_('td', { colspan: 2 }, ['Noch kein Wert übernommen.'])]));
      s.werte.forEach((r) => tbody.appendChild(el_('tr', {}, [el_('td', {}, [String(r.x)]), el_('td', {}, [String(r.y)])])));
    }
    // Reglerbewegung ändert nur die Skizze, nie den gespeicherten Wert (kein `change` am Feld)
    regler.addEventListener('input', () => { x = runde(parseFloat(regler.value), k); zeichne(); });
    knopf.addEventListener('click', () => {
      s.werte.push({ x: x, y: f(x, k) });
      zeigeTabelle();
      // `change` genau hier: erst nach dem Klick. Läuft später eine Animation, kommt es an deren Ende (siehe FORMAT.md).
      el.dispatchEvent(new root.Event('change', { bubbles: true }));
    });

    el._vlWert = () => ({ werte: s.werte.map((r) => ({ x: r.x, y: r.y })) });
    el._vlLaden = (w) => {
      s = fuelle(w);
      const l = s.werte[s.werte.length - 1];
      if (l) { x = runde(l.x, k); regler.value = x; }
      zeichne(); zeigeTabelle();
    };
    zeichne(); zeigeTabelle();
  }

  FX.felder.registriere(ART, {
    init: init,
    laden: (el, w) => { if (!el._vlLaden) init(el); el._vlLaden(w); },
    wert: (el) => { if (!el._vlWert) init(el); return el._vlWert(); },
    leer: (w) => fuelle(w).werte.length < 1,      // HIER ANPASSEN: ab wie vielen Werten gilt das Feld als erledigt
    protokoll: (el, w) => {
      const k = konfig(el), s = fuelle(w);
      return [{ typ: 'tabelle', kopf: [kopfX(k), 'Messwert'], zeilen: s.werte.map((r) => [String(r.x), String(r.y)]) }];
    }
  });
})(typeof self !== 'undefined' ? self : this);
