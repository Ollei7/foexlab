"""Markdown -> HTML mit Formel-Platzhaltern; Formeln am Ende per MathJax (node) zu SVG."""
import html, json, os, re, shutil, subprocess

import markdown

ENGINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MATH = re.compile(r"(\\\(.*?\\\)|\\\[.*?\\\])", re.S)


def md(ctx, text, inline=False):
    maths = []
    def keep(m):
        maths.append(m.group(1)); return f"MATHTOKEN{len(maths) - 1}X"
    t = re.sub(r"<!--.*?-->", "", text or "", flags=re.S)  # Autorennotizen erscheinen nirgends
    t = MATH.sub(keep, t)
    out = markdown.markdown(t, extensions=["extra", "sane_lists", "attr_list"])
    if inline:
        out = re.sub(r"^<p>(.*)</p>$", r"\1", out.strip(), flags=re.S)
    def ph(m):
        src = maths[int(m.group(1))]
        ctx.maths.append((src[2:-2].strip(), src.startswith("\\["), src))
        return f"MATHPH{len(ctx.maths) - 1}X"
    return re.sub(r"MATHTOKEN(\d+)X", ph, out)


def render_math(ctx, page):
    """Ersetzt Formel-Platzhalter durch Inline-SVG; ohne node/mathjax-full bleibt TeX stehen (KaTeX-Fallback im Browser)."""
    if not ctx.maths: return page, 0
    svgs = [None] * len(ctx.maths)
    node = shutil.which("node")
    if node:
        env = dict(os.environ)
        nm = os.path.join(os.path.dirname(ENGINE), "node_modules")
        if os.path.isdir(nm): env["NODE_PATH"] = nm
        try:
            r = subprocess.run([node, os.path.join(ENGINE, "tools", "tex2svg.js")],
                               input=json.dumps([{"tex": t, "display": d} for t, d, _ in ctx.maths]),
                               capture_output=True, text=True, timeout=300, env=env)
            if r.returncode == 0: svgs = json.loads(r.stdout)
            else: ctx.warnings.append("Formeln: node/mathjax-full nicht verfügbar – Fallback KaTeX online")
        except Exception as e:
            ctx.warnings.append(f"Formeln: {e}")
    left = 0
    def sub(m):
        nonlocal left
        i = int(m.group(1)); svg = svgs[i]
        if svg:
            return f'<span class="math{" disp" if ctx.maths[i][1] else ""}">{svg}</span>'
        left += 1
        return html.escape(ctx.maths[i][2], quote=False)
    return re.sub(r"MATHPH(\d+)X", sub, page), left
