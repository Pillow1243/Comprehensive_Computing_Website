/**
 * Enforces the JavaScript budgets from the performance spec:
 *   First Load JS      ≤ 200 KB gzip
 *   Page-specific JS   ≤ 100 KB gzip
 *   Total lazy JS      ≤ 590 KB gzip (raised in v4 for 51 new solvers + 7 lazy tools,
 *                        and in v5 for 12 new solvers + 7 more lazy tools; first-load stays ≤ 200 KB)
 *
 * Measured on the real static export (`out/`), so it catches accidental imports
 * of heavy modules into the app shell. Run with `npm run budget`.
 */
import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'out');
const KB = 1024;

const readHtml = (file) => readFile(path.join(outDir, file), 'utf8');

const moduleScripts = (html) => {
  const blocks = [...html.matchAll(/<script([^>]*)src="([^"]+)"([^>]*)>/g)];
  return blocks
    .filter((block) => !/noModule/.test(`${block[1]}${block[3]}`))
    .map((block) => block[2].replace('/Comprehensive_Computing_Website', '').replace(/^\//, ''));
};

const sizeOf = async (relative) => {
  try {
    const buffer = await readFile(path.join(outDir, relative));
    return gzipSync(buffer, { level: 9 }).length;
  } catch {
    return 0;
  }
};

const measure = async (file) => {
  const html = await readHtml(file);
  const scripts = moduleScripts(html);
  let total = 0;
  const rows = [];
  for (const script of scripts) {
    const bytes = await sizeOf(script);
    total += bytes;
    rows.push([script.split('/').pop(), bytes]);
  }
  return { total, rows };
};

const home = await measure('index.html');
const formula = await measure('formula/quadratic/index.html');
const search = await measure('search/index.html');

// Total JS the browser may fetch: every module chunk referenced by any built
// page (deduplicated) plus the lazy computation worker.
// Legacy `noModule` polyfill bundles are excluded — they are never fetched by
// the Chrome/Android targets this app supports (see package.json browserslist).
const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
};

const htmlFiles = await walk(outDir);
const allChunks = new Set();
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  for (const script of moduleScripts(html)) allChunks.add(script);
}
let lazyTotal = 0;
for (const script of allChunks) lazyTotal += await sizeOf(script);
const workerSize = await sizeOf('workers/compute-worker.js');

const results = [
  { label: 'First Load JS (home)', actual: home.total, budget: 200 * KB },
  { label: 'Page-specific JS (formula)', actual: Math.max(0, formula.total - home.total), budget: 100 * KB },
  { label: 'Page-specific JS (search)', actual: Math.max(0, search.total - home.total), budget: 100 * KB },
  // v4: +51 solvers in the worker and 7 new lazy tool pages; first-load stays ≤200 KB.
  { label: 'Total lazily loaded JS', actual: lazyTotal + workerSize, budget: 590 * KB },
];

let failed = false;
console.log('JavaScript budget report (gzip)');
for (const result of results) {
  const ok = result.actual <= result.budget;
  if (!ok) failed = true;
  console.log(
    `${ok ? '✓' : '✗'} ${result.label.padEnd(30)} ${(result.actual / KB).toFixed(1).padStart(7)} KB / ${(result.budget / KB).toFixed(0)} KB`,
  );
}
console.log(`  worker (lazy, compute):        ${(workerSize / KB).toFixed(1)} KB`);

if (process.argv.includes('--verbose')) {
  console.log('\nHome route chunks:');
  for (const [name, bytes] of home.rows.sort((a, b) => b[1] - a[1])) {
    console.log(`  ${(bytes / KB).toFixed(1).padStart(6)} KB  ${name}`);
  }
}

if (failed) {
  console.error('\nBudget exceeded. Trim the imports before merging.');
  process.exit(1);
}
console.log('\nAll JavaScript budgets met.');
