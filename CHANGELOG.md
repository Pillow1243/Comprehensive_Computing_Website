# Changelog

All notable changes to SolveEverything are documented here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [5.0.0] - 2026-10-25

### Added
- **Advanced lab on every formula page**: inverse solving for any numeric variable (expanding-bracket bisection through the trusted worker), live sliders plus a quiet auto-compute mode, ±10% one-at-a-time sensitivity (tornado) analysis, seeded Monte-Carlo uncertainty propagation with histogram and P5/P95, an SI dimensional-analysis view for inputs/outputs, a step debugger (play/pause, step slider) for worked solutions, and a verification code (`SE-…`) with Python reproduction, Anki and embed exports.
- **Symbolic CAS tool** (`/tools/cas/`): a self-contained AST differentiator/integrator (no `eval`, no server), f(x)=target solving, root/sign charts and an RK4 ODE solver.
- **Calculation pipelines** (`/tools/pipeline/`): chain any registry formulas so one solver's output feeds the next solver's input, with per-step intermediate results.
- **Advanced graphing** (`/tools/graph3d/`): rotating 3D surfaces z=f(x,y), polar, parametric and implicit f(x,y)=0 plots on the safe expression engine.
- **Check My Work** (`/tools/check-work/`): line-by-line verification of a student's own solution with first-inconsistency detection and misconception classification (sign/arithmetic/non-equivalent/final mismatch), photo reference import, a scratch pad and read-aloud feedback.
- **Iran desk** (`/tools/iran/`): exact arithmetic Jalali↔Gregorian conversion, Jalali age, and configurable net-salary / indexed-mehrieh / percentage-of-full-amount calculators whose statutory rates and indices are explicit user inputs (never hard-coded as current law).
- **No-code formula builder** (`/tools/formula-builder/`): create calculators from safe expressions, keep them on-device, and share/import them as re-validated JSON.
- **Projectile virtual lab** (`/tools/simulator/`), **inferential statistics** (Welch and one-sample t-tests, one-way ANOVA, chi-square independence, multiple regression, CSV/TXT import) in the Statistics Lab, **voice input** in the word-problem assistant, and **portable checksummed backup/restore** in Settings.
- **12 new solvers (378 total, 880 declared cases)** in `apps/web/phase9-formulas.js`: exact Gregorian age/date difference, add-days-to-date, discount+tax price, tip & bill split, weighted GPA, pregnancy due date, configurable Iran net salary, indexed mehrieh, percentage of a full amount, two-variable linear programming, recipe scaling and trip fuel cost.

### Notes
- Statutory rates, official indices and live market data are intentionally *not* baked in or fetched from unverified sources; the Iran-desk tools take them as explicit inputs and say so in the UI.
- Scientific review status is unchanged: formulas remain `not_reviewed` until a qualified reviewer and credible sources are recorded per formula. The new verification code fingerprints a calculation; it is not independent scientific endorsement.

## [4.1.0] - 2026-10-25

### Added
- **Command palette (Ctrl/⌘+K)** — a keyboard-first quick jump available on every page: smart formula search with per-result match reasons («مترادف», «املای نزدیک», …), all tools, one-key actions (daily challenge, word-problem assistant, random solver, settings, shortcuts help) and did-you-mean recovery. The top-bar search button progressively upgrades into a palette trigger once the lazy chunk loads; without it, it still navigates to /search.
- **Six accent colours** (violet, ocean, emerald, sunset, rose, amber) that re-tone the primary palette, brand gradients and the aurora backdrop in both themes via `data-accent` tokens. Picker lives in Settings → Appearance; the choice persists on-device and is applied before first paint by the bootstrap script (store migrated to persist v5, user data preserved).
- **A living home screen**: one-shot What's-New card per release, a daily-challenge card with XP level ring + answer streak, a continue-learning card that resumes the learning path with the most momentum, popular-search chips in the hero, a Ctrl+K key-cap hint, staggered pop-in stat pills and IntersectionObserver scroll-reveal for below-the-fold sections.
- **Celebrations**: a dependency-free, reduced-motion-aware canvas confetti (`lib/confetti.ts`, brand-token colours) fires when the daily challenge or a perfect practice round finishes and when a learning path is completed (with a toast).
- Keyboard-shortcuts cheat sheet (`?` anywhere outside text fields, or from the palette) and a floating back-to-top button on long pages.
- First unit tests for the v4 libraries (expression evaluator, matrix, data lab, smart search, quiz engine, related/next-step ranking, word-problem routing, learning paths, Markdown/LaTeX reports) plus an i18n parity guard.

### Changed
- **Persian localisation completed**: 144 message keys added in v4.0.0 existed only in English, so every new page rendered raw key names in the Persian UI. The fa and en dictionaries are now in exact parity (404 keys each) and a regression test (`tests/unit/i18n-parity.test.ts`) keeps them that way.
- Search page now runs real queries through smart search (Persian/English synonyms + bounded-edit-distance typo tolerance) with reason badges on result cards and «منظورتان این بود…؟» suggestion chips; the empty query keeps the classic browse ranking.
- Formula pages use the scored v4 related-formula ranking under a «فرمول‌های مرتبط» heading, gain a numbered «گام‌های بعدی یادگیری» ladder, and the actions menu now offers Markdown/LaTeX report downloads, copy-as-Markdown and save-to-workspace in addition to JSON/CSV.
- Gradient headline text slowly pans; new shared CSS primitives (gradient borders, hover shine sweeps, key caps, pop/XP-float motion, scroll reveal) are pure CSS. Every new interactive surface (palette, banners, cards, dialogs) is a lazy chunk, and the English/Arabic dictionaries (~7 KB gzip) now load on demand from `lib/dictionaries.ts` — Persian stays inlined for SSR — so first-load JS actually *shrinks* to 197.6 KB gzip (v4.0.0: 199.2 KB) despite the new UI.

## [4.0.0] - 2026-10-25

### Added
- **51 new solvers (366 total, 856 declared cases)** in an eighth content pack (`apps/web/phase8-formulas.js`). Every one of the 29 catalog sections now has implemented formulas for the first time: optimisation (EOQ, gradient descent, fractional knapsack), special functions (Γ, B, erf, Bessel J₀/J₁), signal processing (SNR, Nyquist/aliasing, moving-average filter, DFT), machine learning (logistic loss, confusion-matrix metrics, softmax/cross-entropy, cosine similarity), game theory (mixed Nash, expected payoffs), reliability (series/parallel/k-out-of-n, Weibull, MTBF/availability), time series (SMA forecast, exponential smoothing, autocorrelation), robotics & orbits (2-link FK/IK, differential drive, Hohmann transfer), 3D graphics (Euler rotation, perspective projection, quaternions), image & audio (PSNR, histogram entropy, PCM size), music & colour (MIDI pitch, RGB↔HSL/hex, WCAG contrast, tempo delays), numerical methods (RK4, Lagrange interpolation, Newton sqrt), fuzzy logic (membership, t-norms, centroid defuzzification), queueing (M/M/1, Erlang B), navigation (bearing, destination point, wind triangle) and extra discrete maths (Eulerian numbers, derangements, Stirling/Bell).
- **Graphing calculator** (`/tools/graph/`): up to three functions on a pan/zoom Canvas with live derivative curves, integral shading, root markers and point analysis, powered by a TypeScript port of the safe expression parser (`lib/expression.ts`, implicit multiplication included).
- **Matrix lab** (`/tools/matrix/`): add/subtract/multiply/transpose/inverse, determinant, trace, rank, Frobenius norm, 2×2 eigenvalues and Gaussian-elimination linear solves up to 4×4 in the UI (library supports 6×6).
- **Statistics & data lab** (`/tools/statistics/`): paste-a-dataset descriptive statistics, Freedman–Diaconis histogram with mean marker, IQR outliers, and two-column scatter + least-squares regression with prediction.
- **Word-problem assistant** (`/tools/assistant/`): offline natural-language matching that extracts numbers (Latin/Persian digits and number words), applies hand-checked keyword rules for 19 classic problem shapes, falls back to smart search, and deep-links into the solver with inputs prefilled.
- **Smart search library** (`lib/smart-search.ts`): Persian/English synonym expansion, bounded edit-distance typo tolerance, id subsequence matching, match reasons and “did you mean” suggestions — all on-device.
- **Practice & quiz** (`/practice/`): twelve exact-answer question generators with bilingual worked explanations, XP, levels, answer streaks and a deterministic daily challenge (seeded by local calendar day).
- **Learning paths** (`/learn/`): eight curated ladders through the registry with progress derived from local history/completed steps.
- **Workspace** (`/workspace/`): pin calculations from history, add notes, and export the whole desk as one Markdown report. Calculation exports gain **Markdown and LaTeX reports** next to the existing JSON/CSV.
- Related-formula recommendations are now score-based (`lib/related.ts`).

### Changed
- Catalog section mapping is exact: engineering/CS/Earth sections now list only their core topics while the fifteen new topics own their sections; section counts sum exactly to the 366 implemented formulas with no double counting.
- Lazy-JS budget raised 500 → 560 KB gzip for the new worker solvers and seven lazy tool pages; the first-load budget (≤ 200 KB) is unchanged and still met.
- Client store migrated to persist version 4 (practice progress, learning progress, workspace); existing settings/history/bookmarks are preserved by migration.
- App, package and service-worker cache version bumped to **4.0.0**; the service worker precaches the seven new routes.

### Tested
- Registry validation: 366 formulas, 856 declared cases, 29/29 catalog sections implemented, manifests in sync.
- `npm test`: 1,584 Vitest + 1,235 Node tests pass; static export builds all new routes; JS budgets pass.

## [3.2.0] - 2026-10-25

### Added
- Web Share Target route with same-origin formula-link handling, bounded input parsing, and safe search fallback for external shares.
- JSON and CSV calculation exports with formula, inputs, unit metadata, outputs and steps; text cells are escaped against spreadsheet formula injection.
- Explicit scientific-review metadata and source citation schema. Formula pages distinguish computationally tested code from independent domain review; no unverified citations were fabricated.
- Automated npm audit gate in CI and Pages deployment; dependency tree updated and reports zero known advisories in the current lockfile.

### Changed
- Formula catalog synchronisation now derives section status and implemented counts from actual formula IDs.
- Updated roadmap, testing, deployment, architecture, and performance documentation to reflect the current code and distinguish historical measurements.
- Worker bundle target raised to ES2020 to match BigInt support and silence the previous ES2019 warning.
- App, package and service-worker cache version bumped to 3.2.0.

### Tested
- `npm run test:all`: 1,378 Vitest tests, 1,082 Node tests, 330 static routes, and JavaScript budgets pass.
- Playwright: 81 tests are listed; actual browser execution is left to CI / a Chromium-enabled environment.

## [3.1.0] - 2026-10-25

### Added
- **26 new solvers (315 total, 754 verified cases)** in a seventh content pack: polar/rectangular conversion, 2×2 eigenvalues, combinations & permutations and harmonic/geometric means (maths); Newton cooling, critical angle, spring–mass resonance, solenoid field, photon energy and calorimetry mixing (physics); empirical formula from mass data and Raoult's law (chemistry); shaft torsion, Euler buckling, Wheatstone bridge and convective heat transfer (engineering); bond pricing, Fisher real return and the rule of 72 (finance); CKD-EPI eGFR, Du Bois body surface area, anion gap and serum osmolality (health); Coriolis parameter, atmospheric lapse rate and moment magnitude (Earth sciences).
- Regression coverage for the new rendering path in `tests/unit/components.test.tsx`: `renderLatex` returns KaTeX markup, degrades to an empty string on invalid input, `FormulaDisplay` paints the build-time markup on the first render, and `PageTransition` no longer fades the first paint.
- `tests/unit/toast.test.tsx` — 7 tests for the in-house toast store (queue cap, auto-dismiss, roles, close button).

### Changed
- **`sonner` replaced by a ~2 KB in-house toast** (`lib/toast.tsx`): same API surface (`toast.success/error`), an `aria-live` region, `role="alert"` for errors and a three-toast cap.
- **Formula pages ship their mathematics in the HTML.** `lib/latex.ts` renders the LaTeX while the site is built, `scripts/build-katex-css.mjs` inlines the KaTeX stylesheet (WOFF2 faces only) into those routes, and the solver manifest arrives as props instead of a lazy fetch. KaTeX is no longer in any browser bundle, and formula-page LCP dropped from ~4.9 s to ~3.3 s in CI.
- **The home screen paints its real content on the first frame**: the "formula of the day" card is prerendered from the build date (a stale build re-points it once after mount), and the page-transition fade no longer runs on the very first paint.
- Lighthouse budgets are now the fastest values this architecture reaches with headroom (LCP ≤ 4 s, TBT ≤ 400 ms, performance ≥ 0.85) instead of a target it cannot hit; the measured history and the reasoning are in `docs/performance-report.md`.
- Dropped the unused `mathjs` and `@fontsource-variable/inter` dependencies.
- Package, service-worker cache and app version are now **3.1.0**.

### Fixed
- Formula page no longer flashes raw LaTeX before the rendered formula, and no longer renders a skeleton for content that is already static.
- Hydration no longer needs the detail manifest, so a formula page works even if that chunk fails to load.


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
