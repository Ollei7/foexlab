"""Medien aus kurse/<kurs>/media: einbetten (Einzeldatei) oder kopieren/verkleinern (Ordner)."""
import base64, hashlib, html, io, mimetypes, os, re, urllib.parse

from PIL import Image

esc = lambda s: html.escape(s or "", quote=True)


class Medien:
    def __init__(self, kurs_dir, ziel_dir=None, max_img=1200, max_video_mb=10, warnings=None):
        self.kurs_dir, self.ziel_dir = kurs_dir, ziel_dir
        self.max_img, self.max_video_mb = max_img, max_video_mb
        self.warnings = warnings if warnings is not None else []
        self.assets, self.skipped = {}, []   # id -> (mime, b64); [(id, name)]

    def _bild(self, data, mime):
        im = Image.open(io.BytesIO(data)); im.load()
        if max(im.size) > self.max_img:
            im.thumbnail((self.max_img, self.max_img), Image.LANCZOS)
        cands = []
        b = io.BytesIO(); im.save(b, "PNG", optimize=True); cands.append(("image/png", b.getvalue()))
        if im.mode in ("RGB", "L", "P") or (im.mode == "RGBA" and im.getchannel("A").getextrema()[0] == 255):
            b = io.BytesIO(); im.convert("RGB").save(b, "JPEG", quality=82, optimize=True); cands.append(("image/jpeg", b.getvalue()))
        if max(Image.open(io.BytesIO(data)).size) <= self.max_img: cands.append((mime, data))
        return min(cands, key=lambda c: len(c[1]))

    def asset(self, rel):
        path = os.path.join(self.kurs_dir, rel)
        if not os.path.isfile(path):
            self.warnings.append(f"Datei fehlt: {rel}"); return None
        data = open(path, "rb").read()
        aid = hashlib.sha1(data).hexdigest()[:20]
        if aid in self.assets or aid in dict(self.skipped): return aid
        mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
        if mime.startswith("image/") and mime != "image/svg+xml":
            mime, data = self._bild(data, mime)
        elif mime.startswith("video/") and len(data) > self.max_video_mb * 1e6:
            self.skipped.append((aid, f"{os.path.basename(rel)} ({len(data) / 1e6:.0f} MB)")); return aid
        self.assets[aid] = (mime, base64.b64encode(data).decode())
        return aid

    def ersetze(self, h):
        """media/…-Verweise im fertigen HTML -> data-asset (Einzeldatei)."""
        def sub(m):
            attr, rel = m.group(1), urllib.parse.unquote(m.group(2))
            aid = self.asset(rel)
            if not aid: return m.group(0)
            if attr == "src": return f'data-asset="{aid}"'
            return f'href="#" data-asset="{aid}" data-name="{esc(os.path.basename(rel))}"'
        h = re.sub(r'(src|href)="(media/[^"]+)"', sub, h)
        def pdf_sub(m):
            aid = self.asset(urllib.parse.unquote(m.group(1)))
            return f'data-pdf="{aid}"' if aid else m.group(0)
        return re.sub(r'data-pdf-src="(media/[^"]+)"', pdf_sub, h)

    # ---------------------------------------------------------- Ordner-Modus
    def _kopiere(self, rel):
        """Kopiert media/… nach ziel_dir (Bilder verkleinert, Format bleibt). False, wenn die Quelle fehlt."""
        src = os.path.join(self.kurs_dir, rel)
        dst = os.path.join(self.ziel_dir, rel)
        if not os.path.isfile(src):
            self.warnings.append(f"Datei fehlt: {rel}"); return False
        if os.path.isfile(dst): return True
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        mime = mimetypes.guess_type(src)[0] or ""
        if mime.startswith("image/") and mime != "image/svg+xml":
            im = Image.open(src); im.load()
            if max(im.size) > self.max_img:
                im.thumbnail((self.max_img, self.max_img), Image.LANCZOS)
                if mime == "image/jpeg": im.convert("RGB").save(dst, "JPEG", quality=82, optimize=True)
                else: im.save(dst, optimize=True)
                return True
        with open(src, "rb") as a, open(dst, "wb") as b:
            b.write(a.read())
        return True

    def verlinke(self, h):
        """Ordner-Modus: media/…-Verweise kopieren, Pfade bleiben relativ."""
        def sub(m):
            attr, raw = m.group(1), m.group(2)
            rel = urllib.parse.unquote(raw)
            if not self._kopiere(rel): return m.group(0)
            if attr == "data-pdf-src": return f'src="{raw}"'
            if attr == "href" and rel.lower().endswith((".html", ".htm")):
                return f'href="{raw}" data-html="1" data-name="{esc(os.path.basename(rel))}"'
            if attr == "href" and rel.lower().endswith(".pdf"):
                return f'href="{raw}" target="_blank" rel="noopener"'
            return m.group(0)
        return re.sub(r'(src|href|data-pdf-src)="(media/[^"]+)"', sub, h)
