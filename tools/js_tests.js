// Führt alle JavaScript-Tests unter tests/js/ und .claude/skills/ aus (auch in Unterordnern), auf allen Systemen und mit Node 20+.
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
// Auch die Tests der Skill-Vorlagen unter .claude/skills/ (falls der Ordner existiert)
const skills = path.join(wurzel, '.claude', 'skills');
const dateien = sammle(path.join(wurzel, 'tests', 'js')).concat(fs.existsSync(skills) ? sammle(skills) : []).sort();
if (!dateien.length) { console.error('Keine Testdateien gefunden (erwartet: tests/js/**/*.test.js).'); process.exit(1); }
const r = spawnSync(process.execPath, ['--test'].concat(dateien), { cwd: wurzel, stdio: 'inherit' });
process.exit(r.status === null ? 1 : r.status);
