"""Serve the editable preview locally without stale browser caches.

Serves `website/`, which is what Vercel deploys. The library is reached through
`website/vendor/@crystal-ui/core/`, assembled by `tools/assemble-site.mjs`, so a
local preview and a deployment resolve every path identically. Serving the
repository root instead would let a page reach `core/` directly and pass here
while 404ing in production.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent / 'website'
    handler = partial(PreviewHandler, directory=str(root))
    with ThreadingHTTPServer(("127.0.0.1", 4321), handler) as server:
        print("Crystal preview: http://127.0.0.1:4321/", flush=True)
        server.serve_forever()
