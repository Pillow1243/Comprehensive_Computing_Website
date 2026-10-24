# Phase 0 — MVP baseline (historical)

This document records the original delivered baseline; current work is tracked in [`ROADMAP.md`](../ROADMAP.md).

- [x] Safe client expression parser, unit-conversion engine, formula registry, and responsive PWA foundation.
- [x] Original 46 common formulas, with 99 baseline Node tests.
- [x] Step-by-step results, KaTeX/text fallback, Canvas plots, history/bookmarks, share links, print, quiz, and offline service worker.
- [x] FastAPI + SymPy prototype, PostgreSQL schema, Docker Compose, and initial CI.

## Since Phase 0

Phase 1 added a Next.js static-export shell for GitHub Pages, an optional server bridge with restricted CORS, 54 additional client-side formulas (100 total), registry/catalog validation, 266 declared formula test cases, 372 passing Node tests, five Playwright scenarios, Lighthouse CI configuration, security/governance workflows, and deployment docs. Pages itself still needs a maintainer to select **Settings → Pages → GitHub Actions** and publish from `main`.

See [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) for the static/backend boundary and [`ROADMAP.md`](../ROADMAP.md) for remaining work.
