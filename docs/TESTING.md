# Testing strategy

## Test layers

| Layer | Command | What it covers | Current status |
|---|---|---|---|
| Registry validation | `npm run validate-registry` | JSON Schema, unique ids, compute + steps present, ≥2 declared cases per formula, duplicate test inputs, finite outputs, manifest/`formula-index.json`/`formula-details.json` sync | 289 formulas, 702 cases, 29 catalog sections, in sync |
| Component + unit (Vitest) | `npm run test:unit` | Formula registry, compute core, input validation, formatting utils, tools data (units, chemistry, periodic table, constants), React components (RTL) and a full solver flow | 1 253 tests / 9 files |
| Registry + engine (Node) | `node --test tests/*.test.mjs` | Safe expression parser, numerical derivative/integral/root tools, units, optional API failure behaviour, every declared formula case, security assertions | 1 002 assertions |
| Bundle budget | `npm run budget` | gzip First Load JS, page-specific bytes, total JS, worker size | all budgets met |
| E2E (Playwright) | `npm run test:e2e:ci` | Desktop flows + seven Android device profiles | 79 tests / 2 spec files |

`npm run test:all` chains validate → all tests → build → budget, which is the same ordering the Pages workflow uses before publishing.

## Vitest suites

`vitest.config.ts` runs jsdom with `tests/setup.ts`, so browser APIs (`matchMedia`, `IntersectionObserver`, `CanvasRenderingContext2D`) are stubbed.

- `tests/unit/registry.test.ts` — 625 checks over every formula: metadata shape, index/detail split, compute determinism, declared-case agreement, and the guarantee that no client bundle contains `eval` or `new Function` (the solver registry is trusted code, never a string evaluated at runtime).
- `tests/unit/compute-core.test.ts` — worker handler operations (`ping`, `compute`, `evaluate`, `sample`, `derivative`, `integrate`, `root`, `matrix`, `stats`, `regression`) plus `availableFormulaIds`.
- `tests/unit/validation.test.ts` — required/optional semantics, min/max domains, unit handling, bilingual error messages. Empty fields fall back to the declared default; only a required field without a default errors.
- `tests/unit/utils.test.ts` — number formatting (including scientific notation signs), LaTeX/text helpers, haptics guards.
- `tests/unit/components.test.tsx` — FormulaCard, ResultPanel/StepByStep, inputs, math keyboard tabs, dialogs, empty/error states, error boundary, KaTeX lazy rendering, offline banner, Button.
- `tests/unit/compute-client.test.ts` — worker-unavailable fallback: with no `Worker` in the environment the client must fail fast and compute locally rather than hang until the 30 s timeout.
- `tests/unit/solver-flow.test.tsx` — renders `FormulaSolver` as a user would: compute, results, history + recent bookmarks, invalid input rejection, domain rejection, steps tab, example loading, bookmark toggle. jsdom has no `Worker`, so this also exercises the graceful main-thread fallback path.

## E2E matrix

`playwright.config.ts` builds nothing itself (`test:e2e` runs `npm run build` first) and serves `out/` through `scripts/serve-static.mjs` at `http://127.0.0.1:4173/Comprehensive_Computing_Website/`, including the Page's `404.html` behaviour.

- `e2e/flows.spec.ts` — desktop: home → category → formula → keyboard → compute → steps → history, deep link auto-compute, theme switch/persistence, search + empty state without native dialogs, full-screen formula dialog, share link, inline validation errors, 404 page, manifest/service-worker delivery under the sub-path.
- `e2e/android.spec.ts` — Pixel 7/7 Pro/8a/9 Pro, Galaxy S24/A55, Galaxy Tab S9: thumb-sized bottom nav, active tab state, math keyboard above the safe area, `inputmode` suppression, orientation change, plot zoom/reset/drag, swipe-to-delete with a custom confirm dialog (never `window.confirm`), Android back navigation, offline banner, safe-area wiring.

Locally:

```bash
npx playwright install chromium
npm run test:e2e
```

The sandbox used for recent work cannot download Playwright browsers, so these specs are type-checked and enumerated (`npx playwright test --list` → 79 tests) but executed in GitHub Actions.

## CI integration

`.github/workflows/deploy-pages.yml` (npm ci → validate → unit tests → build → assert `out/` artifacts → upload/deploy Pages) and `.github/workflows/lighthouse.yml` (build → budget → `lighthouse:ci` → artifact upload) use pinned action SHAs. Dependabot keeps the actions and npm dependencies current with grouped, cooldown-gated updates.

## Performance guard rails

- `scripts/check-budget.mjs` fails the build when First Load JS, page-specific JS, or total JavaScript exceed the documented gzip budgets. It measures only modern bundles referenced by built HTML (legacy `noModule` chunks are ignored because supported browsers never fetch them).
- `.lighthouserc.json` holds error-level assertions (performance ≥ 0.9, accessibility ≥ 0.95, best practices/SEO ≥ 0.95, FCP ≤ 1500 ms, LCP ≤ 2500 ms, TBT ≤ 200 ms, CLS ≤ 0.1) with mobile emulation; `scripts/run-lighthouse-ci.mjs` starts the static server and writes reports to `artifacts/lighthouse`.
- No performance score is claimed without an actual browser run; see `docs/performance-report.md`.

## Planned validation

- Expand to 200+ reviewed formulas, then 500+ across the longer-term topic map.
- Property-based tests and dimensional-consistency checks for unit-bearing formulas.
- Visual regression and automated accessibility audits in CI, targeting WCAG 2.1 AA and widths 320, 480, 768, 1024, 1280, 1536, 1920 px.
- Load tests only after a separately hosted API and production shared rate limiter exist; the current MVP is not validated for 100k concurrent users.
