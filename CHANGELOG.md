# Changelog

All notable changes to SolveEverything are documented here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
