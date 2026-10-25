/**
 * Minimal static server for the exported Pages build.
 *
 * It mirrors the parts of GitHub Pages that affect measurements and tests:
 *  - the `/Comprehensive_Computing_Website/` project prefix,
 *  - `404.html` for unknown paths,
 *  - immutable caching for fingerprinted `_next/static` assets,
 *  - **Brotli/gzip compression**, so Lighthouse and local profiling see the same
 *    transfer sizes the Pages CDN serves instead of raw bytes.
 */
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync, constants as zlibConstants } from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');
const basePath = '/Comprehensive_Computing_Website';
const port = Number(process.env.PORT || 4173);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.txt', '.webmanifest', '.svg']);
const MIN_COMPRESS_BYTES = 1024;
const compressed = new Map();

const acceptEncoding = (req) => String(req.headers['accept-encoding'] ?? '');

async function send(req, res, file, status = 200) {
  const ext = path.extname(file).toLowerCase();
  const info = await stat(file);
  const headers = {
    'content-type': mime[ext] || 'application/octet-stream',
    'cache-control': file.includes(`${path.sep}_next${path.sep}static${path.sep}`)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
    vary: 'Accept-Encoding',
    'x-content-type-options': 'nosniff',
  };

  let body;
  const encoding = COMPRESSIBLE.has(ext) && info.size >= MIN_COMPRESS_BYTES
    ? (acceptEncoding(req).includes('br') ? 'br' : acceptEncoding(req).includes('gzip') ? 'gzip' : null)
    : null;

  if (encoding) {
    const key = `${file}:${info.mtimeMs}:${encoding}`;
    const cached = compressed.get(key);
    if (cached) {
      body = cached;
    } else {
      const raw = await readFile(file);
      body = encoding === 'br'
        ? brotliCompressSync(raw, {
            params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 5, [zlibConstants.BROTLI_PARAM_SIZE_HINT]: raw.length },
          })
        : gzipSync(raw, { level: 6 });
      if (compressed.size > 400) compressed.clear();
      compressed.set(key, body);
    }
    headers['content-encoding'] = encoding;
  } else {
    body = await readFile(file);
  }

  headers['content-length'] = String(body.length);
  res.writeHead(status, headers);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(body);
}

createServer(async (req, res) => {
  try {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400).end('Bad Request');
      return;
    }
    if (pathname === basePath) pathname = '/';
    else if (pathname.startsWith(`${basePath}/`)) pathname = pathname.slice(basePath.length);
    else {
      res.writeHead(404).end('Project Pages base path not found');
      return;
    }

    let file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep) && file !== root) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      if (!(await stat(file)).isFile()) throw new Error('not a file');
    } catch {
      // GitHub Pages serves 404.html for unknown paths — mirror that locally so
      // the branded not-found page is what developers and tests actually see.
      const notFound = path.join(root, '404.html');
      try {
        if ((await stat(notFound)).isFile()) {
          await send(req, res, notFound, 404);
          return;
        }
      } catch {
        /* fall through */
      }
      res.writeHead(404).end('Not Found');
      return;
    }

    await send(req, res, file);
  } catch (error) {
    res.writeHead(500).end(`Server error: ${error.message}`);
  }
}).listen(port, '0.0.0.0', () =>
  console.log(`Static export at http://0.0.0.0:${port}${basePath}/ (brotli + gzip enabled)`),
);
