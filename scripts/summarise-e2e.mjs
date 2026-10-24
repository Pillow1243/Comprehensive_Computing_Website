/**
 * Turns the Playwright JSON report into a compact GitHub job summary.
 *
 * CI logs are not always reachable from automation, but the job summary is
 * exposed on the check run, so a failing shard can be diagnosed from the API.
 */
import { readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';

const file = process.argv[2] ?? 'e2e-results.json';

const flatten = (suites, out = []) => {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        out.push({ spec, test });
      }
    }
    flatten(suite.suites, out);
  }
  return out;
};

let report;
try {
  report = JSON.parse(await readFile(file, 'utf8'));
} catch (error) {
  console.error(`Could not read ${file}: ${error.message}`);
  process.exit(0);
}

const tests = flatten(report.suites);
const failed = tests.filter(({ test }) => test.status !== 'expected' && test.status !== 'skipped');
const lines = [
  `### Playwright: ${tests.length - failed.length}/${tests.length} passing`,
  '',
];

if (failed.length) {
  lines.push('| Project | Test | Error |', '|---|---|---|');
  for (const { spec, test } of failed.slice(0, 40)) {
    const project = test.projectName ?? spec.projectName ?? 'unknown';
    const errors = (test.results ?? [])
      .flatMap((result) => result.errors ?? [])
      .map((error) => (error.message ?? '').split('\n')[0])
      .filter(Boolean);
    const title = `${spec.title}`.replace(/\|/g, '\\|');
    const firstError = (errors[0] ?? test.status ?? 'failed').replace(/\|/g, '\\|').slice(0, 300);
    lines.push(`| ${project} | ${title} | \`${firstError}\` |`);
  }
  if (failed.length > 40) lines.push('', `…and ${failed.length - 40} more.`);
}

const summary = lines.join('\n');
console.log(summary);

// Workflow commands become check-run annotations, which stay readable even when
// the raw job log is not accessible.
const escape = (value) =>
  String(value).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
if (process.env.GITHUB_ACTIONS) {
  for (const { spec, test } of failed.slice(0, 20)) {
    const errors = (test.results ?? [])
      .flatMap((result) => result.errors ?? [])
      .map((error) => error.message ?? '')
      .filter(Boolean);
    const detail = (errors[0] ?? test.status ?? 'failed').split('\n').slice(0, 6).join(' ');
    const project = test.projectName ?? spec.projectName ?? 'unknown';
    console.log(
      `::error title=Playwright ${escape(project)} ${escape(spec.id ?? '')}::${escape(`${spec.title} — ${detail}`)}`,
    );
  }
}

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  const reportDir = process.env.PLAYWRIGHT_HTML_REPORT;
  if (reportDir) {
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `\nHTML report: \`${path.relative(process.cwd(), reportDir)}\` (uploaded as an artifact).\n`,
    );
  }
}
