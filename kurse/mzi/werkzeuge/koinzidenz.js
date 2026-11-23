/* Werkzeug „koinzidenz“ (Kapitel 5, Hilfe zur Vergleichstabelle): Koinzidenzmethode mit Einzelphotonenquelle oder abgeschwächtem Laser.
   Übernommen aus „MZI Kurs Test v3/Technik/simulation.js“ (.koinz): pro Messung beim Laser Poisson-verteilt (Mittelwert 1) viele Photonen,
   jedes Photon geht mit ½ zu Detektor 1 oder 2. Gezählt: nur D1, nur D2, beide gleichzeitig, kein Klick.
   Reine Hilfe: kein Wert, nie leer, nicht im Protokoll. Zufall über root.Math.random (im Test ersetzbar). */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h;

  function poisson(m, zufall) { let k = 0, p = Math.exp(-m), s = p; const u = zufall(); while (u > s) { k++; p *= m / k; s += p; } return k; }
  /* 1000 Messungen; quelle 'e' (Einzelphotonenquelle) oder 'l' (Laser, abgeschwächt) */
  function messe(quelle, n, zufall) {
    zufall = zufall || Math.random;
    const z = { 1: 0, 2: 0, b: 0, 0: 0 };
    for (let i = 0; i < (n || 1000); i++) {
      const k = quelle === 'e' ? 1 : poisson(1, zufall); let a = false, b = false;
      for (let j = 0; j < k; j++) { if (zufall() < 0.5) a = true; else b = true; }
      z[a && b ? 'b' : a ? 1 : b ? 2 : 0]++;
    }
    return z;
  }

  function init(el) {
    if (el._kzLaden) return;
    el._kzLaden = true;
    const flaeche = el.querySelector('.fx-werkzeug-flaeche');
    let quelle = 'e', z = { 1: 0, 2: 0, b: 0, 0: 0 };
    const zellen = {};
    const zeile = (k, t) => h('tr', {}, h('th', { scope: 'row' }, t), zellen[k] = h('td', { 'data-k': k }, '0'));
    const zeige = () => Object.keys(zellen).forEach((k) => { zellen[k].textContent = z[k]; });
    const knoepfe = [['e', 'Einzelphotonenquelle'], ['l', 'Laser (abgeschwächt)']].map((q) =>
      h('button', { type: 'button', 'class': 'fx-knopf', 'data-kq': q[0], 'aria-pressed': String(q[0] === quelle), onclick: () => {
        quelle = q[0]; knoepfe.forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-kq') === quelle)));
        z = { 1: 0, 2: 0, b: 0, 0: 0 }; zeige();
      } }, q[1]));
    const los = h('button', { type: 'button', 'class': 'fx-knopf fx-haupt', 'data-o': 'messen', onclick: () => { z = messe(quelle, 1000, root.Math.random); zeige(); } }, '1000 Messungen vornehmen');
    flaeche.appendChild(h('div', { 'class': 'mzi-koinz' },
      h('div', { 'class': 'fx-knoepfe', role: 'group', 'aria-label': 'Quelle' }, knoepfe), los,
      h('div', { 'class': 'mzi-log' }, h('table', {}, h('tbody', {},
        zeile(1, 'nur Detektor 1'), zeile(2, 'nur Detektor 2'), zeile('b', 'beide gleichzeitig (Koinzidenz)'), zeile(0, 'kein Klick'))))));
    zeige();
  }

  FX.felder.registriere('koinzidenz', {
    init: init, laden: (el) => { if (!el._kzLaden) init(el); }, wert: () => ({}), leer: () => false, ohneProtokoll: true
  });
  if (FX.mzi) FX.mzi.koinzidenz = messe;
})(typeof self !== 'undefined' ? self : this);
