#!/usr/bin/env node
/* Serve the repository over loopback so the example pages can load the library
 * by relative path. Copied from the 28 September proposal's examples; 4322 by
 * default so both can run beside the preview on 4321. `file://` is not browser-verified for Crystal (adoption.md),
 * and the desktop app's preview renders a file outside the project as a static
 * snapshot with no stylesheet at all.
 *
 *   node proposals/2026-10-02-media-text-and-recipe-parity/examples/serve.cjs [port]
 *   → http://localhost:4322/proposals/2026-10-02-media-text-and-recipe-parity/examples/
 *
 * Static files, no directory listings, and one write: `POST /api/rulings`,
 * which the tasks page uses to record a ruling. It accepts JSON from a page this
 * server served (the Origin must be this loopback address, and a JSON body
 * forces a browser to ask first for any other origin, which is never granted),
 * at most 8 KB, validated field by field by `../rulings-lib.mjs`, and hands it
 * to `../apply-rulings.mjs`, which writes only under `proposals/`. Writes are
 * taken one at a time. Node only, like the rest of the repository's tooling.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../..');
const PORT = Number(process.argv[2]) || 4322;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.cjs': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.mp4': 'video/mp4', '.m4a': 'audio/mp4', '.vtt': 'text/vtt; charset=utf-8', '.woff2': 'font/woff2', '.md': 'text/plain; charset=utf-8',
};

const ALLOWED_ORIGINS = new Set([`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`]);
let queue = Promise.resolve();

function reply(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(body));
}

function recordRuling(request, response) {
  if (!ALLOWED_ORIGINS.has(request.headers.origin ?? '')) return reply(response, 403, { ok: false, problems: ['rulings are recorded only from a page this server served'] });
  if (!/^application\/json\b/.test(request.headers['content-type'] ?? '')) return reply(response, 415, { ok: false, problems: ['send JSON'] });
  let size = 0;
  const chunks = [];
  request.on('data', (chunk) => {
    size += chunk.length;
    if (size > 8192) { reply(response, 413, { ok: false, problems: ['a ruling is at most 8 KB'] }); request.destroy(); return; }
    chunks.push(chunk);
  });
  request.on('end', () => {
    if (response.writableEnded) return;
    let entry;
    try { entry = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return reply(response, 400, { ok: false, problems: ['the body is not JSON'] }); }
    queue = queue.then(async () => {
      const { record, apply } = await import('../apply-rulings.mjs');
      try {
        record([entry]);
        const { summary } = apply();
        console.log(`Ruling recorded: ${entry.decision} (${entry.option}) by ${entry.ruledBy}`);
        reply(response, 200, { ok: true, summary });
      } catch (error) {
        reply(response, error.problems ? 400 : 500, { ok: false, problems: error.problems ?? [error.message] });
      }
    });
  });
}

http.createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  if (url.pathname === '/api/rulings') {
    if (request.method === 'POST') return recordRuling(request, response);
    return reply(response, 405, { ok: false, problems: ['POST a ruling'] });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end(); return; }
  let file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT)) { response.writeHead(403); response.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(response);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Examples: http://localhost:${PORT}/proposals/2026-10-02-media-text-and-recipe-parity/examples/`);
});
