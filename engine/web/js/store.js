/* Eingaben im Browser (IndexedDB "foexlab", Store "eingaben", Schlüssel "<kursId>/<feldId>"). */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).store = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  var DB = 'foexlab', OS = 'eingaben', dbPromise = null;

  function req(r) {
    return new Promise(function (ok, fehler) {
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { fehler(r.error); };
    });
  }

  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (ok, fehler) {
      if (!root.indexedDB) return fehler(new Error('IndexedDB nicht verfügbar'));
      var r;
      try { r = root.indexedDB.open(DB, 1); } catch (e) { return fehler(e); }
      r.onupgradeneeded = function () { r.result.createObjectStore(OS); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { fehler(r.error); };
    });
    dbPromise.catch(function () { dbPromise = null; });
    return dbPromise;
  }

  function os(modus) {
    return db().then(function (d) { return d.transaction(OS, modus).objectStore(OS); });
  }

  function oeffne(kursId) {
    var p = kursId + '/';
    try { if (root.navigator && root.navigator.storage && root.navigator.storage.persist) root.navigator.storage.persist(); } catch (e) { /* egal */ }
    return db().then(function () {
      return {
        lies: function (id) { return os('readonly').then(function (s) { return req(s.get(p + id)); }); },
        schreibe: function (id, wert) { return os('readwrite').then(function (s) { return req(s.put(wert, p + id)); }); },
        alle: function () {
          return os('readonly').then(function (s) {
            var r = root.IDBKeyRange.bound(p, p + '\uffff'), erg = {};
            return Promise.all([req(s.getAllKeys(r)), req(s.getAll(r))]).then(function (kw) {
              kw[0].forEach(function (k, i) { erg[k.slice(p.length)] = kw[1][i]; });
              return erg;
            });
          });
        },
        leeren: function () {
          return os('readwrite').then(function (s) { return req(s.delete(root.IDBKeyRange.bound(p, p + '\uffff'))); });
        },
        /* alle Kurse auf diesem Gerät (für „Neue Gruppe“) */
        leerenAlles: function () { return os('readwrite').then(function (s) { return req(s.clear()); }); }
      };
    });
  }

  /* 'ok' | 'fluechtig' (vermutlich privater Tab) | 'aus'
     Erkennung 1: Safari verweigert im privaten Modus das Browser-Dateisystem (getDirectory).
     Erkennung 2: kleiner, nicht dauerhafter Speicher. */
  function status() {
    return db().then(function () {
      var st = root.navigator && root.navigator.storage;
      if (!st) return 'ok';
      var dateisystem = st.getDirectory ? st.getDirectory().then(function () { return false; }, function () { return true; }) : Promise.resolve(false);
      var klein = (st.persisted && st.estimate) ? Promise.all([st.persisted(), st.estimate()]).then(function (r) {
        return !r[0] && r[1] && r[1].quota < 200e6;
      }, function () { return false; }) : Promise.resolve(false);
      return Promise.all([dateisystem, klein]).then(function (r) { return (r[0] || r[1]) ? 'fluechtig' : 'ok'; });
    }, function () { return 'aus'; });
  }

  return { oeffne: oeffne, status: status };
});
