#!/usr/bin/env python3
"""Testserver am Mac: liefert dist/ aus und enthält den Abholdienst (wie Caddy + Dienst auf dem Pi).

Aufruf:  python3 tools/devserver.py [--port 8000]
iPad im selben WLAN: http://<IP-des-Mac>:8000/mzi/
"""
import argparse, functools, os, re, sys, tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "server"))
import abholdienst  # noqa: E402


class Handler(abholdienst.Handler, SimpleHTTPRequestHandler):
    def _abholung(self):
        return self.path.startswith("/api/") or self.path.startswith("/abholen")

    def do_GET(self):
        if self._abholung(): return abholdienst.Handler.do_GET(self)
        m = re.match(r"bytes=(\d*)-(\d*)$", self.headers.get("Range", ""))
        pfad = self.translate_path(self.path)
        if m and os.path.isfile(pfad):
            return self._teilabruf(pfad, m)
        return SimpleHTTPRequestHandler.do_GET(self)

    def _teilabruf(self, pfad, m):
        """HTTP-Range (Safari spielt Videos nur damit ab)."""
        groesse = os.path.getsize(pfad)
        if m.group(1):
            start, ende = int(m.group(1)), int(m.group(2)) if m.group(2) else groesse - 1
        else:
            start, ende = max(0, groesse - int(m.group(2) or 0)), groesse - 1
        ende = min(ende, groesse - 1)
        if start > ende:
            self.send_response(416); self.send_header("Content-Range", f"bytes */{groesse}"); self.end_headers(); return
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(pfad))
        self.send_header("Content-Range", f"bytes {start}-{ende}/{groesse}")
        self.send_header("Content-Length", str(ende - start + 1))
        self.end_headers()
        with open(pfad, "rb") as f:
            f.seek(start)
            rest = ende - start + 1
            while rest > 0:
                stueck = f.read(min(rest, 1 << 16))
                if not stueck: break
                self.wfile.write(stueck); rest -= len(stueck)

    def do_POST(self):
        return abholdienst.Handler.do_POST(self)

    def end_headers(self):
        if not self._abholung():
            self.send_header("Accept-Ranges", "bytes")
        if not self._abholung() and (self.path.endswith("/") or ".html" in self.path):
            self.send_header("Cache-Control", "no-cache")
        SimpleHTTPRequestHandler.end_headers(self)


class LeiserServer(ThreadingHTTPServer):
    """Abgebrochene Verbindungen (Browser stoppt Video/Download) nicht als Fehler ausgeben."""
    daemon_threads = True

    def handle_error(self, request, client_address):
        if isinstance(sys.exc_info()[1], (BrokenPipeError, ConnectionResetError)):
            return
        super().handle_error(request, client_address)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--dist", default="dist")
    a = ap.parse_args()
    Handler.ablage = abholdienst.Ablage(tempfile.mkdtemp(prefix="foexlab-abholung-"))
    h = functools.partial(Handler, directory=os.path.abspath(a.dist))
    print(f"foeXlab-Testserver: http://localhost:{a.port}/  (Abholdienst eingebaut)", flush=True)
    LeiserServer(("0.0.0.0", a.port), h).serve_forever()
