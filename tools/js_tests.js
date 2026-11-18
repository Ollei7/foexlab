// Führt alle JavaScript-Tests unter tests/js/ aus (auch in Unterordnern), auf allen Systemen und mit Node 20+.
// Aufruf: npm test
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const wurzel = path.join(__dirname, '..');
function sammle(ordner) {
  let out = [];
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) out = out.concat(sammle(p));
    else if (e.name.endsWith('.test.js')) out.push(p);
  }
  return out;
}
const dateien = sammle(path.join(wurzel, 'tests', 'js')).sort();
const r = spawnSync(process.execPath, ['--test'].concat(dateien), { cwd: wurzel, stdio: 'inherit' });
process.exit(r.status === null ? 1 : r.status);
