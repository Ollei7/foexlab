/* Werkzeug „dcaufbau“ (Kapitel 3, So funktioniert das Experiment): Aufbau des Delayed-Choice-Experiments mit Zeitleiste, ohne Messung.
   Zeigt nur die Bauteile (Strahlteiler 2 schaltbar, Zufallsgenerator) und die Zeitleiste eines Photons. Kein Wert, nicht im Protokoll. */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h;

  function init(el) {
    if (el._dcaLaden) return;   // schon aufgebaut
    const flaeche = el.querySelector('.fx-werkzeug-flaeche'), zl = M.zeitleiste(), zeichnung = h('div', { 'class': 'mzi-zeichnung' });
    zeichnung.innerHTML = M.aufbauSVG('dc', { choice: null, caption: 'wartet' });
    flaeche.appendChild(h('div', { 'class': 'fx-mzi-lab mzi-einspaltig' }, zeichnung, zl.el));
    el._dcaLaden = true;
  }

  FX.felder.registriere('dcaufbau', {
    init: init,
    laden: (el) => { if (!el._dcaLaden) init(el); },
    wert: () => ({}),
    leer: () => false,
    ohneProtokoll: true
  });
})(typeof self !== 'undefined' ? self : this);
