/* Zahlen lesen und Formeln für berechnete Tabellenspalten auswerten (ohne eval). */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).formel = m;
})(typeof self !== 'undefined' ? self : this, function () {
  function zahl(s) {
    if (typeof s === 'number') return s;
    var t = String(s == null ? '' : s).replace(/\s+/g, '').replace(',', '.');
    if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t)) return NaN;
    return parseFloat(t);
  }

  var FUNK = { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, ln: Math.log, log: function (x) { return Math.log(x) / Math.LN10; } };
  var KONST = { pi: Math.PI };

  function tokens(s) {
    var re = /\s*(?:(\d+\.?\d*(?:[eE][-+]?\d+)?|\.\d+(?:[eE][-+]?\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|(.))/g, out = [], m;
    s = s.replace(/,/g, '.');
    while ((m = re.exec(s)) && m[0] !== '') {
      if (m[1]) out.push({ t: 'z', v: parseFloat(m[1]) });
      else if (m[2]) out.push({ t: 'n', v: m[2] });
      else if (m[3] && m[3].trim()) {
        if ('+-*/^()'.indexOf(m[3]) < 0) throw new Error('Formel: unerlaubtes Zeichen „' + m[3] + '“');
        out.push({ t: m[3] });
      }
    }
    return out;
  }

  /* Rekursiver Abstieg: summe := produkt (('+'|'-') produkt)*; produkt := unaer (('*'|'/') unaer)*;
     unaer := '-' unaer | potenz; potenz := atom ('^' unaer)? */
  function uebersetze(ausdruck) {
    var tk = tokens(String(ausdruck || '')), i = 0;
    function sieh() { return tk[i] && tk[i].t; }
    function nimm(t) { if (sieh() !== t) throw new Error('Formel: „' + t + '“ erwartet'); i++; }
    function summe() {
      var a = produkt();
      while (sieh() === '+' || sieh() === '-') { var op = tk[i++].t, b = produkt(); a = op === '+' ? ['+', a, b] : ['-', a, b]; }
      return a;
    }
    function produkt() {
      var a = unaer();
      while (sieh() === '*' || sieh() === '/') { var op = tk[i++].t; a = [op, a, unaer()]; }
      return a;
    }
    function unaer() {
      if (sieh() === '-') { i++; return ['neg', unaer()]; }
      if (sieh() === '+') { i++; return unaer(); }
      return potenz();
    }
    function potenz() {
      var a = atom();
      if (sieh() === '^') { i++; return ['^', a, unaer()]; }
      return a;
    }
    function atom() {
      var t = tk[i];
      if (!t) throw new Error('Formel: unvollständiger Ausdruck');
      if (t.t === 'z') { i++; return ['z', t.v]; }
      if (t.t === '(') { i++; var a = summe(); nimm(')'); return a; }
      if (t.t === 'n') {
        i++;
        if (sieh() === '(') {
          if (!FUNK[t.v]) throw new Error('Formel: unbekannte Funktion „' + t.v + '“');
          i++; var arg = summe(); nimm(')'); return ['f', t.v, arg];
        }
        return ['v', t.v];
      }
      throw new Error('Formel: unerwartetes „' + t.t + '“');
    }
    var baum = summe();
    if (i < tk.length) throw new Error('Formel: unerwartetes „' + (tk[i].v || tk[i].t) + '“');
    function rechne(n, vars) {
      switch (n[0]) {
        case 'z': return n[1];
        case 'v':
          if (Object.prototype.hasOwnProperty.call(vars, n[1])) return zahl(vars[n[1]]);
          if (KONST[n[1]] !== undefined) return KONST[n[1]];
          throw new Error('Formel: unbekannte Größe „' + n[1] + '“');
        case 'neg': return -rechne(n[1], vars);
        case 'f': return FUNK[n[1]](rechne(n[2], vars));
        case '+': return rechne(n[1], vars) + rechne(n[2], vars);
        case '-': return rechne(n[1], vars) - rechne(n[2], vars);
        case '*': return rechne(n[1], vars) * rechne(n[2], vars);
        case '/': return rechne(n[1], vars) / rechne(n[2], vars);
        case '^': return Math.pow(rechne(n[1], vars), rechne(n[2], vars));
      }
    }
    return function (vars) { return rechne(baum, vars || {}); };
  }

  return { zahl: zahl, uebersetze: uebersetze };
});
