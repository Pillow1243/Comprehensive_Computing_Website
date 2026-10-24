# Lighthouse Performance Report

## Measurement status (2026-10-24)

No measured “before” Lighthouse report or browser trace exists in the repository at the baseline commit. This environment has no installed Chromium/Chrome binary, so reporting a numeric score here would be fabricated. Lighthouse CI is configured in `.lighthouserc.cjs` and `.github/workflows/ci.yml`; its HTML/JSON artifacts are uploaded by CI when a Chromium-enabled runner completes the job.

| Build | Performance | Accessibility | Best Practices | SEO | Evidence |
|---|---:|---:|---:|---:|---|
| Baseline (before) | Not measured | Not measured | Not measured | Not measured | No historical Lighthouse artifact in repository |
| Static Pages build (after) | Pending CI browser run | Pending CI browser run | Pending CI browser run | Pending CI browser run | `lighthouse-ci` workflow artifact, when available |

## Reproduce locally

```bash
npm ci
npm run build
npm run lighthouse:ci
```

Lighthouse CI starts the static export through `scripts/serve-static.mjs`, measures the Pages-prefixed route, writes artifacts to `artifacts/lighthouse/`, and checks a minimum performance/accessibility/best-practices/SEO budget. In CI, download the `lighthouse-report` artifact from the workflow run and attach the generated HTML report when updating this table. To make a defensible “before/after” comparison, run the same Lighthouse version, browser, network/CPU throttling, viewport, and route on the baseline commit and the new export; record the run URLs, environment, and median of three runs.

## Current performance design (not a score)

- Static export / CDN delivery; no server-rendered API call blocks the page shell.
- Formula computation is local and the app shell is PWA-cached; heavy API calls are opt-in.
- Responsive Canvas plots are redrawn on a 200 ms debounce; app source has no mandatory font download.
- KaTeX is currently loaded from jsDelivr; its text fallback remains available, but CDN availability affects rich typesetting.

These are implementation properties, not substitutes for measured FCP, LCP, TBT, CLS, or Lighthouse scores. The requested targets (for example FCP < 1.5s and TTI < 3s on 3G) remain unverified until the browser runs are collected.
