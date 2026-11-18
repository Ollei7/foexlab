// TeX -> Inline-SVG (MathJax 3). stdin: JSON [{tex,display}], stdout: JSON [svg|null]
const {mathjax} = require('mathjax-full/js/mathjax.js');
const {TeX} = require('mathjax-full/js/input/tex.js');
const {SVG} = require('mathjax-full/js/output/svg.js');
const {liteAdaptor} = require('mathjax-full/js/adaptors/liteAdaptor.js');
const {RegisterHTMLHandler} = require('mathjax-full/js/handlers/html.js');
const {AllPackages} = require('mathjax-full/js/input/tex/AllPackages.js');

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const html = mathjax.document('', {
  InputJax: new TeX({packages: AllPackages}),
  OutputJax: new SVG({fontCache: 'none'})
});

let buf = '';
process.stdin.on('data', d => buf += d);
process.stdin.on('end', () => {
  const out = JSON.parse(buf).map(({tex, display}) => {
    try {
      const node = html.convert(tex, {display: !!display});
      const svg = adaptor.innerHTML(node);
      return /merror/.test(svg) ? null : svg;
    } catch (e) { return null; }
  });
  process.stdout.write(JSON.stringify(out));
});
