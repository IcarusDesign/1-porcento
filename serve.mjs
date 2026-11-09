// Pré-visualização local: node serve.mjs  →  http://localhost:4321
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(import.meta.dirname, '_site');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4' };

http.createServer((req, res) => {
  let p = path.join(DIR, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(DIR)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) { res.writeHead(404, { 'Content-Type': TIPOS['.html'] }); fs.createReadStream(path.join(DIR, '404.html')).pipe(res); return; }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(p).pipe(res);
}).listen(process.env.PORT || 4321, function () { console.log(`Pré-visualização em http://localhost:${this.address().port}`); });
