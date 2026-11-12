// Small static server for checking the built site locally (`npm start`) or running it on a Node host.
// It serves `dist` the way a static host does: /packs -> packs.html, unknown addresses -> 404.html.
import http from 'node:http';
import {createReadStream, existsSync, readFileSync, statSync} from 'node:fs';
import {resolve, extname, sep} from 'node:path';

const root = resolve('dist');
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8'};

// The same headers the static host sends, read from dist/_headers.
const security = {};
try {
  const block = readFileSync(resolve(root, '_headers'), 'utf8').split(/\n(?=\S)/).find(x => x.startsWith('/*\n')) ?? '';
  for (const line of block.split('\n').slice(1)) {
    const at = line.indexOf(':');
    if (at > 0) security[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
} catch {
  /* No header file: serve without the extra headers. */
}

const isFile = file => existsSync(file) && statSync(file).isFile();

const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); res.end('Invalid request'); return; }
  if (pathname === '/health') { res.writeHead(200, {'Content-Type': 'application/json'}); res.end('{"status":"ok"}'); return; }

  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const target = resolve(root, '.' + clean);
  if (target !== root && !target.startsWith(root + sep)) { res.writeHead(403); res.end('Forbidden'); return; }

  let file = clean === '/' ? resolve(root, 'index.html') : isFile(target) ? target : isFile(target + '.html') ? target + '.html' : null;
  let status = 200;
  if (!file || clean === '/_headers') {
    if (extname(clean) && extname(clean) !== '.html') { res.writeHead(404); res.end('File not found'); return; }
    file = resolve(root, '404.html');
    status = 404;
    if (!isFile(file)) { res.writeHead(503); res.end('Build unavailable. Run npm run build.'); return; }
  }
  res.writeHead(status, {'Content-Type': types[extname(file)] || 'application/octet-stream', 'Content-Length': statSync(file).size, 'Cache-Control': clean.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache', ...security});
  if (req.method === 'HEAD') { res.end(); return; }
  createReadStream(file).pipe(res);
});

const port = Number(process.env.SERVER_PORT || process.env.PORT || 3000);
// Local only unless HOST says otherwise.
server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Odin Avatar Library listening on ${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
