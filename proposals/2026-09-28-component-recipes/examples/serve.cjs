#!/usr/bin/env node
/* Serve the repository over loopback so the specimen sheet can load the library
 * by relative path. `file://` is not browser-verified for Crystal (adoption.md),
 * and the desktop app's preview renders a file outside the project as a static
 * snapshot with no stylesheet at all — which is how this file came to exist.
 *
 *   node proposals/2026-09-28-component-recipes/examples/serve.cjs [port]
 *   → http://localhost:4321/proposals/2026-09-28-component-recipes/examples/
 *
 * Static files only, no directory listings, no writes. Node only, like the rest
 * of the repository's tooling.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../..');
const PORT = Number(process.argv[2]) || 4321;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.cjs': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.md': 'text/plain; charset=utf-8',
};

http.createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  let file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT)) { response.writeHead(403); response.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(response);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Specimens: http://localhost:${PORT}/proposals/2026-09-28-component-recipes/examples/`);
});
