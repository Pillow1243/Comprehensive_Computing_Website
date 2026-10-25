# Performance report

## Measurement status (2026-10-24)

Two different kinds of evidence exist here, and they must not be confused:

1. **Measured build sizes** — reproducible on any machine from a clean checkout (numbers below).
2. **Lighthouse scores** — not measured yet. This environment has no installable Chromium download, so any score quoted here would be fabricated. `.lighthouserc.json` and `.github/workflows/lighthouse.yml` run the audit on a browser-enabled runner and upload `artifacts/lighthouse` (HTML + JSON).

| Build | Performance | Accessibility | Best Practices | SEO | Evidence |
|---|---:|---:|---:|---:|---|
| Baseline (before) | Not measured | Not measured | Not measured | Not measured | No historical Lighthouse artifact in repository |
| Static Pages build (after) | Pending CI browser run | Pending CI browser run | Pending CI browser run | Pending CI browser run | `lighthouse.yml` artifact |

## Measured bundle budget (gzip, clean `npm run build`)

`npm run budget` inspects the built HTML and JavaScript in `out/`:

| Metric | Value | Budget |
|---|---:|---:|
| First Load JS (home) | 192.3 KB | 200 KB |
| Page-specific JS (formula detail) | 20.6 KB | 100 KB |
| Page-specific JS (search) | 1.2 KB | 100 KB |
| Total JavaScript reachable from any page | 312.1 KB | 500 KB |
| Compute worker (lazy, only when calculating) | 66.2 KB | — |

Budget enforcement is part of `npm run test:all` and the Lighthouse workflow, so a regression fails CI rather than drifting silently.

## How that budget is achieved

- **Route-level static export** — 162 prerendered pages; no server render blocks the shell, and each route ships only its own additions (formula detail adds 20.6 KB, search 1.2 KB).
- **Registry split** — the first load imports `packages/formula-registry/formula-index.json` (42 KB raw, metadata + search text only). LaTeX, variables, outputs and examples live in `formula-details.json` (106 KB raw), fetched only when a formula page opens.
- **Solvers are never in the page bundle** — `apps/web/registry.js` is compiled into `workers/compute-worker.js` (66.2 KB gzip) and loaded on demand; the main thread fallback dynamic-imports it only if workers are unavailable.
- **KaTeX is lazy** — bundled locally (no CDN request, so offline stays intact) and rendered after the formula shell paints, with a plain-text fallback.
- **No animation framework** — `framer-motion` was removed; transitions are CSS-only.
- **PWA caching** — `public/sw.js` precaches the app shell and falls back to `offline.html`; repeat visits avoid network entirely.
- **Legacy chunk excluded from measurement** — the 38.5 KB `noModule` core-js bundle is served only to pre-ES2017 browsers; `check-budget.mjs` ignores it because supported targets never fetch it.

These are implementation properties, not measured FCP/LCP/TBT/CLS. Target figures (for example FCP < 1.5 s on 3G) remain unverified until a browser run is attached.

## Reproduce locally

```bash
npm ci
npm run build
npm run budget          # prints the table above
npm run lighthouse:ci   # requires a local Chrome/Chromium
```

`scripts/run-lighthouse-ci.mjs` starts `scripts/serve-static.mjs`, audits the Pages-prefixed route three times with mobile emulation (412×915, DPR 1.75), enforces the assertions in `.lighthouserc.json`, and writes HTML/JSON reports to `artifacts/lighthouse/`. To make a defensible before/after comparison, run the same Lighthouse version, browser, throttling and route on both commits and record the median of three runs.
