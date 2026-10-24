# Changelog

All notable changes to SolveEverything are documented here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
