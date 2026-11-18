import functools, os, sys, threading, urllib.request

ROOT = os.getcwd()
sys.path.insert(0, os.path.join(ROOT, "tools"))
import devserver  # noqa: E402


def test_range_fuer_safari_videos(tmp_path):
    (tmp_path / "v.mp4").write_bytes(bytes(range(256)) * 4)
    devserver.Handler.ablage = devserver.abholdienst.Ablage(str(tmp_path / "ab"))
    h = functools.partial(devserver.Handler, directory=str(tmp_path))
    srv = devserver.LeiserServer(("127.0.0.1", 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        req = urllib.request.Request(f"http://127.0.0.1:{srv.server_address[1]}/v.mp4", headers={"Range": "bytes=0-1"})
        with urllib.request.urlopen(req) as r:
            assert r.status == 206
            assert r.headers["Content-Range"] == "bytes 0-1/1024"
            assert r.read() == b"\x00\x01"
        with urllib.request.urlopen(f"http://127.0.0.1:{srv.server_address[1]}/v.mp4") as r:
            assert r.status == 200 and r.headers["Accept-Ranges"] == "bytes" and len(r.read()) == 1024
    finally:
        srv.shutdown()
