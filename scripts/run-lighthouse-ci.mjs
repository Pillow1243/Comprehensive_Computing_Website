/**
 * Lighthouse runner that works both locally and in CI without the paid
 * temporary-public-storage upload.
 *
 * It starts the static export server, audits every configured URL on a mobile
 * profile, enforces the assertions in .lighthouserc.json (failures exit non-zero)
 * and writes HTML + JSON reports to artifacts/lighthouse.
 */
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

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
});

const auditIdFor = (key) => {
  const map = {
    'first-contentful-paint': 'first-contentful-paint',
    'largest-contentful-paint': 'largest-contentful-paint',
    'total-blocking-time': 'total-blocking-time',
    'cumulative-layout-shift': 'cumulative-layout-shift',
    'server-response-time': 'server-response-time',
    'cumulative-layout-shift-max': 'cumulative-layout-shift',
  };
  return map[key] ?? key;
};

const failures = [];
const warnings = [];
const summaryRows = [];

const check = (key, rule, { score, numericValue }) => {
  const [level, options = {}] = Array.isArray(rule) ? rule : [rule, {}];
  if (options.minScore !== undefined && typeof score === 'number' && score < options.minScore) {
    const message = `${key}: score ${score.toFixed(2)} < ${options.minScore}`;
    (level === 'error' ? failures : warnings).push(message);
  }
  if (options.maxNumericValue !== undefined && typeof numericValue === 'number' && numericValue > options.maxNumericValue) {
    const message = `${key}: ${Math.round(numericValue)} > ${options.maxNumericValue}`;
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
    for (let run = 1; run <= runs; run += 1) {
      chrome = await launch({ chromePath: process.env.CHROME_PATH, chromeFlags: flags });
      const result = await lighthouse(
        url,
        { port: chrome.port, output: ['html', 'json'], logLevel: 'error' },
        {
          extends: 'lighthouse:default',
          settings: {
            formFactor: 'mobile',
            screenEmulation: collect.settings?.screenEmulation ?? { mobile: true, width: 412, height: 915, deviceScaleFactor: 1.75 },
            throttlingMethod: collect.settings?.throttlingMethod ?? 'simulate',
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          },
        },
      );
      const lhr = result.lhr;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const slug = new URL(url).pathname.replace(/\//g, '_').replace(/^_|_$/g, '') || 'root';
      const reports = Array.isArray(result.report) ? result.report : [result.report];
      await writeFile(path.join(outDir, `${slug}-run${run}-${timestamp}.html`), reports[0]);
      await writeFile(path.join(outDir, `${slug}-run${run}-${timestamp}.json`), reports[1] ?? JSON.stringify(lhr, null, 2));

      const categories = Object.fromEntries(
        Object.entries(lhr.categories).map(([key, value]) => [key, value.score]),
      );
      console.log(
        `[${slug}] run ${run}/${runs} ` +
          Object.entries(categories)
            .map(([key, value]) => `${key}=${Math.round((value ?? 0) * 100)}`)
            .join(' '),
      );
      summaryRows.push(
        `| ${slug} | ${run} | ${['performance', 'accessibility', 'best-practices', 'seo']
          .map((key) => Math.round((categories[key] ?? 0) * 100))
          .join(' | ')} |`,
      );

      // Surface enough detail to act on a failing performance budget without
      // downloading the report artifact.
      const lcpAudit = lhr.audits['largest-contentful-paint-element'];
      const lcpNode = lcpAudit?.details?.items?.[0]?.items?.[0]?.node;
      const breakdown = lhr.audits['lcp-breakdown']?.details?.items ?? lhr.audits.diagnostics?.details?.items ?? [];
      const slowest = [...(lhr.audits['network-requests']?.details?.items ?? [])]
        .sort((a, b) => (b.transferSize ?? 0) - (a.transferSize ?? 0))
        .slice(0, 5)
        .map((item) => `${item.resourceType ?? 'other'} ${Math.round((item.transferSize ?? 0) / 1024)}KB ${item.url?.split('/').pop() ?? ''}`);
      if (process.env.GITHUB_ACTIONS && (categories.performance ?? 1) < 0.9) {
        const details = [
          `LCP ${Math.round(lhr.audits['largest-contentful-paint']?.numericValue ?? 0)} ms`,
          lcpNode ? `element ${lcpNode.snippet ?? lcpNode.selector ?? ''}` : '',
          breakdown.length
            ? `phases ${breakdown.map((item) => `${item.phase ?? item.key}: ${Math.round(item.timing ?? item.value ?? 0)} ms`).join(', ')}`
            : '',
          slowest.length ? `largest responses ${slowest.join(' | ')}` : '',
        ]
          .filter(Boolean)
          .join(' — ');
        console.log(`::error title=Lighthouse diagnostics (${slug})::${escape(details)}`);
      }

      for (const [key, rule] of Object.entries(assertions)) {
        if (key.startsWith('categories:')) {
          const category = key.slice('categories:'.length);
          check(`${category} (${slug})`, rule, { score: categories[category] ?? 0 });
          continue;
        }
        const audit = lhr.audits[auditIdFor(key)];
        if (!audit) continue;
        const score = typeof audit.score === 'number' ? audit.score : undefined;
        check(`${key} (${slug})`, rule, { score, numericValue: audit.numericValue });
      }

      await chrome.kill();
      chrome = undefined;
    }
  }
} catch (error) {
  fatal = error;
  console.error(error);
} finally {
  if (chrome) await chrome.kill().catch(() => {});
  server.kill('SIGTERM');
}

const summary = [
  '### Lighthouse (mobile, simulated slow 4G)',
  '',
  '| Page | Run | Perf | A11y | Best practices | SEO |',
  '|---|---|---:|---:|---:|---:|',
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

const escape = (value) => String(value).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
if (process.env.GITHUB_ACTIONS) {
  for (const failure of failures.slice(0, 20)) {
    console.log(`::error title=Lighthouse budget::${escape(failure)}`);
  }
  if (fatal) console.log(`::error title=Lighthouse runner::${escape(String(fatal.stack ?? fatal).slice(0, 1500))}`);
}

if (fatal) {
  console.error(`Lighthouse could not run: ${fatal.message ?? fatal}`);
  process.exit(1);
}

for (const warning of warnings) console.warn(`WARNING: ${warning}`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  console.error(`Lighthouse budgets violated (${failures.length}). Reports in artifacts/lighthouse/.`);
  process.exit(1);
}
console.log(`Lighthouse budgets met. Reports saved in ${path.relative(root, outDir)}/.`);
