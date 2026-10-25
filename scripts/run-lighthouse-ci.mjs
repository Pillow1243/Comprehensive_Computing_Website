/**
 * Lighthouse runner that works both locally and in CI without a paid
 * temporary-public-storage upload.
 *
 * It starts the static export server (Brotli/gzip enabled, like GitHub Pages),
 * audits every configured URL on a mobile profile, evaluates the assertions in
 * .lighthouserc.json against the **median** of the configured runs, and writes
 * HTML + JSON reports to artifacts/lighthouse.
 */
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const escapeCommand = (value) =>
  String(value).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

/** GitHub workflow command → visible as a check annotation. */
const annotate = (level, title, message) => {
  if (!process.env.GITHUB_ACTIONS) return;
  process.stdout.write(`::${level} title=${escapeCommand(title)}::${escapeCommand(message)}\n`);
};

const median = (values) => {
  const sorted = [...values].filter((value) => typeof value === 'number').sort((a, b) => a - b);
  if (!sorted.length) return undefined;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, '.lighthouserc.json'), 'utf8'));
const { collect, assert } = config.ci;
const urls = collect.url ?? [];
if (!urls.length) throw new Error('Lighthouse config must include at least one collect.url.');
const assertions = assert?.assertions ?? {};
const outDir = path.resolve(root, config.ci.upload?.outputDir ?? 'artifacts/lighthouse');
await mkdir(outDir, { recursive: true });

const server = spawn(process.execPath, ['scripts/serve-static.mjs'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
const waitForServer = new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`Static preview server did not start. ${serverLog}`)), 30_000);
  server.stdout.on('data', (chunk) => {
    serverLog += chunk.toString();
    if (serverLog.includes('Static export at')) {
      clearTimeout(timer);
      resolve();
    }
  });
  server.stderr.on('data', (chunk) => {
    serverLog += chunk.toString();
  });
  server.once('error', (error) => {
    clearTimeout(timer);
    reject(error);
  });
  server.once('exit', (code) => {
    if (code && code !== 0) {
      clearTimeout(timer);
      reject(new Error(`Static preview server exited with code ${code}: ${serverLog}`));
    }
  });
});

const failures = [];
const warnings = [];
const samples = new Map();

const record = (key, rule, { score, numericValue }, label) => {
  const [level, options = {}] = Array.isArray(rule) ? rule : [rule, {}];
  if (options.minScore !== undefined && typeof score === 'number' && score < options.minScore) {
    const message = `${label}: score ${score.toFixed(2)} < ${options.minScore}`;
    (level === 'error' ? failures : warnings).push(message);
  }
  if (options.maxNumericValue !== undefined && typeof numericValue === 'number' && numericValue > options.maxNumericValue) {
    const message = `${label}: ${Math.round(numericValue)} > ${options.maxNumericValue}`;
    (level === 'error' ? failures : warnings).push(message);
  }
};

let chrome;
let fatal = null;
try {
  await waitForServer;
  const flags = (collect.settings?.chromeFlags ?? '--no-sandbox --headless=new').split(/\s+/).filter(Boolean);
  const runs = Math.max(1, Number(collect.numberOfRuns) || 1);

  for (const url of urls) {
    const slug = new URL(url).pathname.replace(/\//g, '_').replace(/^_|_$/g, '') || 'root';
    for (let run = 1; run <= runs; run += 1) {
      chrome = await launch({ chromePath: process.env.CHROME_PATH, chromeFlags: flags });
      const result = await lighthouse(
        url,
        { port: chrome.port, output: ['html', 'json'], logLevel: 'error' },
        {
          extends: 'lighthouse:default',
          settings: {
            formFactor: 'mobile',
            screenEmulation: collect.settings?.screenEmulation ?? {
              mobile: true,
              width: 412,
              height: 915,
              deviceScaleFactor: 1.75,
            },
            throttlingMethod: collect.settings?.throttlingMethod ?? 'simulate',
            throttling: collect.settings?.throttling,
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          },
        },
      );
      const lhr = result.lhr;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reports = Array.isArray(result.report) ? result.report : [result.report];
      await writeFile(path.join(outDir, `${slug}-run${run}-${timestamp}.html`), reports[0]);
      await writeFile(path.join(outDir, `${slug}-run${run}-${timestamp}.json`), reports[1] ?? JSON.stringify(lhr, null, 2));

      const categories = Object.fromEntries(
        Object.entries(lhr.categories).map(([key, value]) => [key, value.score]),
      );
      const audits = Object.fromEntries(
        Object.keys(assertions)
          .filter((key) => !key.startsWith('categories:'))
          .map((key) => [key, lhr.audits[key] ?? lhr.audits[key === 'tap-targets' ? 'target-size' : key]]),
      );
      samples.set(slug, [
        ...(samples.get(slug) ?? []),
        {
          categories,
          audits,
        },
      ]);
      console.log(
        `[${slug}] run ${run}/${runs} ` +
          Object.entries(categories)
            .map(([key, value]) => `${key}=${Math.round((value ?? 0) * 100)}`)
            .join(' '),
      );

      if (process.env.GITHUB_ACTIONS && (categories.performance ?? 1) < 0.9) {
        const ms = (key) => Math.round(lhr.audits[key]?.numericValue ?? 0);
        const lcpElement = lhr.audits['largest-contentful-paint-element']?.details?.items?.[0];
        const lcpNode = lcpElement?.items?.[0]?.node ?? lcpElement?.node;
        const slowest = [...(lhr.audits['network-requests']?.details?.items ?? [])]
          .sort((a, b) => (b.transferSize ?? 0) - (a.transferSize ?? 0))
          .slice(0, 4)
          .map((item) => `${item.resourceType ?? 'other'} ${Math.round((item.transferSize ?? 0) / 1024)}KB ${item.url?.split('/').pop() ?? ''}`);
        const blocking = (lhr.audits['render-blocking-resources']?.details?.items ?? [])
          .slice(0, 3)
          .map((item) => `${Math.round(item.wastedMs ?? 0)}ms ${item.url?.split('/').pop() ?? ''}`);
        const mainThread = (lhr.audits['mainthread-work-breakdown']?.details?.items ?? [])
          .sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0))
          .slice(0, 3)
          .map((item) => `${item.groupLabel ?? item.group} ${Math.round(item.duration ?? 0)}ms`);
        const details = [
          `FCP ${ms('first-contentful-paint')} ms`,
          `LCP ${ms('largest-contentful-paint')} ms`,
          `TBT ${ms('total-blocking-time')} ms`,
          `CLS ${(lhr.audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)}`,
          lcpNode ? `LCP element ${String(lcpNode.snippet ?? lcpNode.selector ?? '').slice(0, 160)}` : '',
          (() => {
            const requests = lhr.audits['network-requests']?.details?.items ?? [];
            const font = requests.find((item) => /vazirmatn/.test(item.url ?? ''));
            return font
              ? `font ${Math.round((font.networkEndTime ?? 0) - (font.networkRequestTime ?? 0))} ms, ends at ${Math.round(font.networkEndTime ?? 0)} ms`
              : 'font request not found';
          })(),
          (() => {
            const items = lhr.audits['lcp-breakdown-insight']?.details?.items ?? [];
            const phases = (items[0]?.items ?? []).map((row) => `${row.subpart}=${Math.round(row.duration ?? 0)}`).join(' ');
            return phases ? `LCP phases ${phases}` : 'LCP phases n/a';
          })(),
          (() => {
            const items = lhr.audits['lcp-breakdown-insight']?.details?.items ?? [];
            const node = items[1]?.node ?? items[0]?.node;
            return node ? `LCP element ${String(node.snippet ?? node.selector ?? '').slice(0, 200)}` : 'LCP element n/a';
          })(),
          blocking.length ? `render-blocking ${blocking.join(' | ')}` : '',
          mainThread.length ? `main thread ${mainThread.join(' | ')}` : '',
          slowest.length ? `largest responses ${slowest.join(' | ')}` : '',
        ]
          .filter(Boolean)
          .join(' — ');
        annotate('error', `Lighthouse diagnostics (${slug} run ${run})`, details);
      }

      await chrome.kill();
      chrome = undefined;
    }
  }
} catch (error) {
  fatal = error;
  console.error(error);
  annotate('error', 'Lighthouse runner', String(error?.stack ?? error));
} finally {
  if (chrome) await chrome.kill().catch(() => {});
  server.kill('SIGTERM');
}

// Evaluate assertions on the median run so a single noisy audit does not fail CI.
const summaryRows = [];
for (const [slug, runs] of samples) {
  const categories = {};
  for (const key of ['performance', 'accessibility', 'best-practices', 'seo']) {
    categories[key] = median(runs.map((run) => run.categories[key]));
  }
  summaryRows.push(
    `| ${slug} | ${runs.length} | ${['performance', 'accessibility', 'best-practices', 'seo']
      .map((key) => Math.round((categories[key] ?? 0) * 100))
      .join(' | ')} |`,
  );

  for (const [key, rule] of Object.entries(assertions)) {
    if (key.startsWith('categories:')) {
      const category = key.slice('categories:'.length);
      record(key, rule, { score: categories[category] }, `${category} (${slug}, median)`);
      continue;
    }
    for (const run of runs) {
      run.audits[key] ??= undefined;
    }
    const auditValues = runs
      .map((run) => run.audits[key])
      .filter(Boolean);
    if (!auditValues.length) continue;
    record(
      key,
      rule,
      {
        score: median(auditValues.map((audit) => audit.score)),
        numericValue: median(auditValues.map((audit) => audit.numericValue)),
      },
      `${key} (${slug}, median)`,
    );
  }
}

const summary = [
  '### Lighthouse (mobile, simulated slow 4G, median of runs)',
  '',
  '| Page | Runs | Perf | A11y | Best practices | SEO |',
  '|---|---:|---:|---:|---:|---:|',
  ...summaryRows,
  '',
  ...(failures.length ? failures.map((failure) => `- ❌ ${failure}`) : []),
  ...(warnings.length ? warnings.map((warning) => `- ⚠️ ${warning}`) : []),
  ...(fatal
    ? ['', `**Runner error:** \`${String(fatal.message ?? fatal)}\``, '```', String(fatal.stack ?? '').slice(0, 2000), '```']
    : []),
  '',
].join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
for (const failure of failures.slice(0, 20)) annotate('error', 'Lighthouse budget', failure);

if (fatal) {
  console.error(`Lighthouse could not run: ${fatal.message ?? fatal}`);
  process.exitCode = 1;
}
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  console.error(`Lighthouse budgets violated (${failures.length}). Reports in artifacts/lighthouse/.`);
  process.exitCode = 1;
}
if (!fatal && !failures.length) {
  console.log(`Lighthouse budgets met. Reports saved in ${path.relative(root, outDir)}/.`);
}
