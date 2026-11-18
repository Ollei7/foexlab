/* Ausgleichsgerade nach der Methode der kleinsten Quadrate (mit Standardfehlern). */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).ausgleich = m;
})(typeof self !== 'undefined' ? self : this, function () {
  function gerade(punkte, modus) {
    var p = (punkte || []).filter(function (q) { return isFinite(q[0]) && isFinite(q[1]); });
    var n = p.length;
    if (n < 2) return null;
    var sx = 0, sy = 0, sxx = 0, sxy = 0, i, m, b, rss = 0, sm = NaN, sb = NaN;
    for (i = 0; i < n; i++) { sx += p[i][0]; sy += p[i][1]; sxx += p[i][0] * p[i][0]; sxy += p[i][0] * p[i][1]; }
    if (modus === 'ursprung') {
      if (sxx === 0) return null;
      m = sxy / sxx; b = 0;
      for (i = 0; i < n; i++) rss += Math.pow(p[i][1] - m * p[i][0], 2);
      if (n > 2) sm = Math.sqrt(rss / (n - 1) / sxx);
      return { m: m, b: 0, sm: sm, sb: 0, n: n };
    }
    var d = n * sxx - sx * sx;
    if (Math.abs(d) < 1e-300) return null;
    m = (n * sxy - sx * sy) / d;
    b = (sy - m * sx) / n;
    for (i = 0; i < n; i++) rss += Math.pow(p[i][1] - m * p[i][0] - b, 2);
    if (n > 2) {
      var s2 = rss / (n - 2);
      sm = Math.sqrt(n * s2 / d);
      sb = Math.sqrt(s2 * sxx / d);
    }
    return { m: m, b: b, sm: sm, sb: sb, n: n };
  }
  return { gerade: gerade };
});
