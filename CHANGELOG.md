# Changelog

All notable changes to SolveEverything are documented here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-10-25

### Added
- **134 new formula solvers** (289 total, 702 verified cases) across five new packs: calculus/combinatorics extensions, physics (optics, modern physics, circuits), chemistry/engineering (thermodynamics, controls), finance & economics, computer science, health, astronomy and Earth science. Two new disciplines — **نجوم و فضا (Astronomy & Space)** and **زمین و محیط (Earth & Environment)** — join the category tree.
- **Tools hub** (`/tools/`): a unit converter with 13 categories and 95 units (including offset temperatures), a molar-mass and mass-percent analyser that parses nested parentheses and hydrates (`Ca(OH)2`, `CuSO4·5H2O`), an interactive **118-element periodic table** with search, group filters and a detail sheet, and a **physical-constants reference** with 32 CODATA-2019 values and copy-to-clipboard.
- **Formula of the day**, a “surprise me” random formula button, a difficulty-distribution card and a tools rail on the home screen.
- Lazy `formula-descriptions.json` manifest: Persian summaries moved out of the first-load index (−9 KB gzip on every route).
- `tests/unit/tools.test.ts` — 21 assertions covering unit round-trips, temperature offsets, molar-mass parsing, periodic-table layout collisions and constants integrity.

### Changed
- **Interface overhaul**: AMOLED-first tonal palette rewritten around a violet/amber/cyan seed, aurora mesh backdrop, glass surfaces, gradient wordmark, elevated cards with lift feedback, gradient scroll rails, refreshed hero, and a tools entry point in the top app bar. All motion remains CSS-only.
- The top app bar now links to **Tools**; route titles cover `/tools`, `/periodic-table` and `/constants`.
- Difficulty colours, `/tools` cards and formula cards share one token set so light and dark themes stay in sync.
- Package, service-worker cache and app version are now **3.0.0** (`solveeverything-v5`).

### Fixed
- `cagr` no longer emits an infinite `doubling_years` value for non-positive growth, which the validator rejected as a non-finite output.
- `cosmic_redshift` converted `c` from m/s while labelling the result km/s, so velocities were 1000× too large; distances now divide by the corrected km/s value.
- Corrected hand-written expectations that had drifted: `distance_modulus` (2.655 pc), `wind_chill`, `heat_index`, `ideal_body_weight`, `heart_rate_zones` and `stellar_luminosity` now assert the values their formulas actually produce.
- `formulaDescription` no longer crashes when summaries have not been lazy-loaded yet; list cards render a soft placeholder for the first frame.


## [2.0.0] - 2026-10-24

### Added
- **Next.js 16 App Router shell with static export** (162 prerendered pages) served under `/Comprehensive_Computing_Website/`, with loading, error and not-found boundaries for every route, plus a Pages deployment workflow that validates the registry and tests before publishing.
- **Worker-based compute architecture**: solvers are bundled into `workers/compute-worker.js` (66.2 KB gzip) and loaded on demand. If workers are blocked or missing, the client computes on the main thread from a lazily imported registry instead of failing.
- **Split formula data**: a 42 KB metadata/search index for first load and a 106 KB details payload (LaTeX, variables, outputs, examples) fetched only when a formula page opens.
- **Lazy, bundled KaTeX** rendering with a plain-text fallback — no CDN dependency, so offline installs stay intact.
- **Playwright matrix** (desktop + seven Android profiles, 79 tests) covering solve flows, deep links, theme persistence, search, sharing, offline banner, safe areas, orientation changes, plot gestures and swipe-to-delete; `scripts/serve-static.mjs` now serves the branded `404.html` for unknown paths.
- **Performance guard rails**: `scripts/check-budget.mjs` enforces gzip budgets (192.3 KB home / 200 KB, 20.6 KB formula page / 100 KB, 312.1 KB total / 500 KB), `.lighthouserc.json` holds error-level Lighthouse assertions, and a Lighthouse workflow uploads HTML/JSON reports.
- **Test coverage growth**: 690 Vitest tests (7 files) including React Testing Library component suites and full solver-flow tests, plus 596 Node assertions; `npm run test:all` chains validation, tests, build and budget.
- `scripts/build-formula-index.mjs` generates the registry manifests during `predev`/`prebuild`; validation now rejects stale manifests, duplicate test inputs, non-finite outputs and formulas with fewer than two declared cases.
- Dependabot now uses grouped, cooldown-gated updates for GitHub Actions.

### Changed
- 155 formulas declare **430 verified test cases** (up from 355); `compound_interest` handles zero rates (`∞` doubling time) and guards non-positive principal/periods.
- `formatNumber` keeps the exponent sign in scientific notation (`1e+15`).
- Package version and service-worker cache are now `2.0.0`.
- `framer-motion` was removed; transitions are CSS-only.
- Rewrote `README.md`, `README.fa.md`, `docs/TESTING.md` and `docs/performance-report.md` to describe the shipped architecture, current test counts and measured bundle budgets instead of stale figures.

### Fixed
- Compute requests hung forever when `Worker` was unavailable; the pool now fails fast so the local fallback runs immediately.
- Query-string deep links never auto-computed: the effect re-ran after `setRaw` and cleared its own pending timer. The latest compute callback is now held in a ref so the one-shot run survives re-renders.
- Focusing a numeric input opened the on-screen math keyboard on desktop, covering the primary action; the sheet now auto-opens only for coarse pointers (touch devices).

## [1.2.0] - 2026-10-24

### Added
- **55 new client-side formula solvers (100 → 155 total, 355 declared formula cases)**, each with bilingual metadata, derivation steps, domain validation and automated tests:
  - Number theory & algebra: primality test, modular inverse, binomial expansion, sums of powers, base converter (2–36), cubic equation (Cardano), 3×3 linear system (Cramer), absolute-value equation, ratio simplifier.
  - Geometry & trigonometry: rectangle, parallelogram, trapezoid, rhombus, square pyramid, torus, haversine great-circle distance, inverse trig functions, six trig ratios from sin.
  - Calculus & linear algebra: numeric Taylor polynomial, numeric limit with divergence detection, Riemann sums (left/right/midpoint/trapezoid), 3×3 determinant/inverse, 3D cross product.
  - Statistics: discrete expected value/variance, hypergeometric, exponential, uniform and geometric distributions, z confidence interval, chi-square goodness of fit.
  - Physics: Coulomb, point-charge field/potential, Lorentz force, Doppler effect, decibel level, thin lens, spring/Hooke/SHM, orbital & escape velocity, Stefan-Boltzmann/Wien.
  - Chemistry: Henderson-Hasselbalch, Beer-Lambert, Gibbs free energy, weak-acid pH (exact quadratic), equilibrium constant Kc.
  - Engineering: voltage divider, RC charging, gear ratio, thin pressure-vessel stress, AC power factor.
  - Finance/health/CS: perpetuity, IRR, straight-line depreciation, BMR/TDEE, digital storage converter, IPv4 subnet calculator.
- Complete UI redesign: glassmorphism top bar, gradient hero with floating symbols, subject cards with color coding, subcategory filter chips, redesigned formula cards with difficulty indicator and one-tap bookmark, mobile bottom navigation and sidebar backdrop, Vazirmatn webfont, polished dark theme, per-result copy buttons, plotter presets, converter swap button, JSON history export, quiz streak/best score, `/` keyboard shortcut.
- Engine: `sec/csc/cot/ncr/npr` safe functions and nine new unit dimensions (area, volume, force, energy, power, pressure, torque, data plus existing set).
- New canvas plot types for cubic functions and exponential distributions.
- Service worker cache bumped to v4 and now precaches `phase2-formulas.js`.

### Changed
- Package/catalog version bumped to 1.2.0; catalog resynchronized with 155 full records.
- E2E hero-stat expectation updated to the new 155-formula count.

### Fixed
- `CSS.escape` dependency now falls back to a local escaper so solver forms keep working in non-browser runtimes.

## [1.1.x]

### Fixed
- Shared/bookmarked links (`#/formula/<id>?param=…`) failed to open because the query string became part of the formula id.
- Calculator precedence: `-2^2` now equals `-4` (unary minus binds looser than `^`), and `constructor`/`toString` are no longer resolved as variables or functions.
- Plotter froze the browser when the range had `min ≥ max`, and the normal-curve plot looped forever when σ = 0.
- Invalid inputs produced `NaN` in results (e.g. `gcd(0,0)`, `percent change` with old = 0, BMI with height 0). They now show a clear error.
- Factorial/permutation/combination returned silently wrong values when `r > n`, and froze the tab for huge `n`; input is now validated.
- Practice quiz could ask questions whose answer was not a finite number.
- Changing language cleared the formula inputs; they are now kept.
- Each keystroke added a history entry; consecutive duplicates are now skipped.
- API rate limiter returned HTTP 500 instead of 429; the in-memory hit table is now bounded.
- Footer "API" link pointed to a non-existent path; it now links to `docs/API.md` on GitHub.
- Service worker served cached files indefinitely (users could stay on an old build); app files are now network-first, `catalog.json` is precached, and one missing asset no longer blocks installation.
- `docker-compose.yml` referenced a Celery worker that does not exist in the codebase; removed.

### Added
- `tests/regressions.test.mjs` and a backend rate-limit test covering the fixes above.

## [1.1.0] - 2026-10-24

### Added
- Static-export Next.js shell and GitHub Pages deployment workflow with repository-aware `basePath`.
- Optional, public FastAPI URL bridge for symbolic differentiation, graceful server-unavailable messaging, and configurable API CORS origins.
- 54 client-side formula solvers across arithmetic, algebra, geometry, calculus, statistics, physics, chemistry, finance, and engineering; the registry now contains 100 implemented formulas.
- Registry JSON Schema, automated catalog validator, synchronized 29-section catalog index, and 266 declared formula test cases.
- Five Playwright end-to-end scenarios, Lighthouse CI configuration, CodeQL, Scorecard, Dependabot, contribution templates, security policy, and community governance documents.

### Changed
- PWA cache version incremented to include new client formula modules and the optional API bridge.
- Contributor formula guidance now requires at least four cases and prohibits dynamic evaluation of formula source strings.
- FastAPI CORS is no longer wildcard-open by default.

### Notes
- Pages publishing still requires an authorized maintainer to select **GitHub Actions** under repository Settings → Pages and merge the workflow to `main`.
- Lighthouse scores have not been measured in this workspace; see `docs/performance-report.md` for the reproducible measurement and reporting status.
- The 500+ formula / complete-catalog target remains in progress; see `ROADMAP.md`.

## [1.0.0] - 2026-10-24

### Added
- Original static PWA MVP with 46 client-side formulas, safe expression parser, dynamic 2D plots, unit converter, local history/bookmarks, and practice quiz.
- FastAPI + SymPy API prototype, PostgreSQL schema, Docker Compose setup, initial CI, responsive styles, and 29-domain formula backlog.
