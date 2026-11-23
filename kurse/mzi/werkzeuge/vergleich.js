/* Werkzeug „vergleich“ (Kapitel 5, Klassisch und quantenphysikalisch): Vergleichstabelle mit fünf Zeilen und je einem Feld
   „klassisch“ und „quantenphysikalisch“. Zeilen und Spaltenköpfe aus „MZI Kurs Test v3/Technik/vorlage.html“ (k1-vgl).
   Wert: { zellen: { '<zeile>-k': Text, '<zeile>-q': Text } }. Erledigt, wenn jedes Feld mindestens 2 Zeichen hat.
   Protokoll: Tabelle Zeile (Kurzname) | klassisch | quantenphysikalisch; kurze Zeilennamen, damit die Antwortspalten im PDF Platz haben. Die Hilfen „Wo findet ihr das?“ stehen im Fragetext (Markdown). */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h;
  const ZEILEN = [
    ['nachweis', 'Was wird gemessen? Was zeigt der Schirm, was zeigen die Detektoren an?', 'Was wird gemessen?'],
    ['koinz', 'Koinzidenzmethode (Aufbau 1): Wie verteilt sich das Messergebnis auf die beiden Ausgänge, und tritt Koinzidenz auf?', 'Koinzidenzmethode (Aufbau 1)'],
    ['mzi', 'Mach-Zehnder-Interferometer (Aufbau 3), gleich lange Arme: Was beobachtet ihr an Ausgang 1 und an Ausgang 2?', 'MZI (Aufbau 3), gleich lange Arme'],
    ['gang', 'Gangunterschied verändern: Wie ändert sich die Beobachtung an den beiden Ausgängen?', 'Gangunterschied verändern'],
    ['beschr', 'Beschreibung: Mit welchen physikalischen Größen erklärt ihr die Beobachtungen?', 'Beschreibung']
  ];
  const SPALTEN = [['k', 'klassisch (Laser, Schirme)'], ['q', 'quantenphysikalisch (Einzelphotonenquelle, Detektoren)']];
  const SCHLUESSEL = [];
  ZEILEN.forEach((z) => SPALTEN.forEach((s) => SCHLUESSEL.push(z[0] + '-' + s[0])));
  const text = (w, k) => String((w && w.zellen && w.zellen[k]) || '');

  function init(el) {
    if (el._vglLaden) return;
    el._vglLaden = true;
    const flaeche = el.querySelector('.fx-werkzeug-flaeche'), tbody = h('tbody');
    el._vglFelder = {};
    ZEILEN.forEach((z) => {
      tbody.appendChild(h('tr', { 'class': 'mzi-vgl-frage' }, h('th', { colspan: 2, scope: 'colgroup' }, z[1])));
      tbody.appendChild(h('tr', {}, SPALTEN.map((s) => {
        const ta = h('textarea', { rows: 3, 'data-zelle': z[0] + '-' + s[0], 'aria-label': z[1] + ': ' + s[1] });
        el._vglFelder[z[0] + '-' + s[0]] = ta;
        return h('td', {}, h('span', { 'class': 'mzi-vgl-spalte' }, s[1]), ta);
      })));
    });
    flaeche.appendChild(h('div', { 'class': 'mzi-vgl' }, h('table', {},
      h('thead', {}, h('tr', {}, SPALTEN.map((s) => h('th', { scope: 'col' }, s[1])))), tbody)));
  }
  function wert(el) {
    const zellen = {};
    SCHLUESSEL.forEach((k) => { const t = el._vglFelder && el._vglFelder[k]; zellen[k] = t ? t.value : ''; });
    return { zellen };
  }
  const leer = (w) => SCHLUESSEL.some((k) => text(w, k).trim().length < 2);

  FX.felder.registriere('vergleich', {
    init: init,
    laden: (el, w) => { if (!el._vglLaden) init(el); SCHLUESSEL.forEach((k) => { el._vglFelder[k].value = text(w, k); }); },
    wert: wert,
    leer: leer,
    begonnen: (w) => SCHLUESSEL.some((k) => text(w, k).trim()),
    sperrhinweis: 'Füllt zuerst alle Felder der Tabelle aus, dann geht es weiter.',
    protokoll: (el, w) => [{ typ: 'tabelle', kopf: ['', 'klassisch', 'quantenphysikalisch'],
      zeilen: ZEILEN.map((z) => [z[2], text(w, z[0] + '-k').trim(), text(w, z[0] + '-q').trim()]) }]
  });
  if (FX.mzi) FX.mzi.VERGLEICH = { ZEILEN, SPALTEN, SCHLUESSEL };
})(typeof self !== 'undefined' ? self : this);
