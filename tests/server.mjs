// Local/CI static preview only. Missing paths serve the real 404 with a 404 status.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
const root = resolve('site');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    let data;
    try { data = await readFile(path); }
    catch { res.writeHead(404, { 'Content-Type': types['.html'] }).end(await readFile(resolve(root, '404.html'))); return; }
    res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' }).end(data);
  } catch { res.writeHead(400).end(); }
}).listen(4173, '127.0.0.1', () => console.log('Static preview: http://127.0.0.1:4173'));
