# SolveEverything

[English](README.md) · [فارسی](README.fa.md)

[![CI](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/ci.yml/badge.svg)](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.0-informational.svg)](CHANGELOG.md)
[![CodeQL](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/codeql.yml/badge.svg)](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/Pillow1243/Comprehensive_Computing_Website/badge)](https://securityscorecards.dev/viewer/?uri=github.com/Pillow1243/Comprehensive_Computing_Website)
![PWA](https://img.shields.io/badge/PWA-installable%20%7C%20offline-ready-7c5cff)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](.github/PULL_REQUEST_TEMPLATE.md)

**Solve any equation, step by step.** A Persian/English client-first scientific calculator for mathematics, physics, chemistry, engineering, statistics, and finance—built to work offline and deploy as a static site.

**Live demo:** [Pillow1243.github.io/Comprehensive_Computing_Website](https://Pillow1243.github.io/Comprehensive_Computing_Website/) · **Status:** Phase 1 in progress · **Implemented:** 100 formula solvers, 266 declared formula test cases.

> The GitHub Pages workflow is ready, but the repository owner must select **Settings → Pages → GitHub Actions** and deploy from `main` before the live URL is available. See [Deployment](docs/DEPLOYMENT.md).

## Why this project?

- **Client-first:** common computations run in the browser; formula inputs stay local by default.
- **Offline-ready:** installable PWA with cached app assets, local history/bookmarks, and responsive 2D plots.
- **Safe by design:** expression parser without `eval`; formula implementations are trusted functions, not executable strings from JSON.
- **Bilingual:** Persian-first RTL interface with an English LTR switch.
- **Open and reviewable:** JSON Schema, declared test cases, registry validation, and an optional FastAPI/SymPy service for server-only symbolic operations.

## Quick start

```bash
nvm use && npm ci
npm run dev
# Open http://localhost:3000
```

No build step is needed to try only the original PWA: `python3 -m http.server 8080 --directory apps/web`.

## Features

| Area | Available now | Scope / limitations |
|---|---|---|
| Formula solvers | 100 client-side formulas across core math, geometry, calculus, statistics, physics, chemistry, engineering, and finance | The 500+ broad scientific catalog remains a roadmap target; see `ROADMAP.md`. |
| Steps and plots | Human-readable derivation steps, KaTeX rendering with text fallback, dynamic 2D Canvas plots | Advanced 3D, full symbolic CAS, and general-purpose plotting are future work. |
| Tools | Safe scientific expression calculator, numeric derivative/integral/root tools, unit converter, practice quiz | The unit table is useful but not yet a complete dimensional-analysis system. |
| Persistence | Local history, bookmarks, shareable formula links, print/PDF | No sign-in or server-side user history in the static Pages build. |
| Languages and devices | Persian/English toggle, RTL/LTR, seven mobile-first breakpoints, safe-area padding, touch targets | Arabic localization and exhaustive device/browser certification are planned. |
| Offline | Installable PWA; client calculations work without an API | Symbolic differentiation and future heavy solvers require the optional API. |
| API | FastAPI + SymPy prototype, CORS allow-list, health/solver endpoints | Deploy separately; Pages cannot run Python, PostgreSQL, Redis, or background workers. |

## Architecture

```text
GitHub Pages (static export)
  └── Next.js static shell at /Comprehensive_Computing_Website/
        └── client PWA in /app/ (registry + safe engine + Canvas + localStorage)
             └── optional HTTPS calls → separately hosted FastAPI/SymPy API
```

The static shell is a deployment bridge that preserves the proven zero-build PWA; it is not a claim of per-formula SSR. `NEXT_PUBLIC_API_URL` is a public API origin and must never contain a secret. If unset or unavailable, server-only actions show a clear explanation while local tools continue to work.

## Project structure

```text
app/                           Next.js static-export shell for Pages
apps/web/                      Bilingual PWA, safe parser, plots, units, UI
backend/                       Optional FastAPI + SymPy API
packages/formula-registry/
  schema.json                  Registry JSON Schema
  catalog.json                 29 topic sections + implemented formula index
scripts/                       Catalog sync/validation, static-copy, preview and Lighthouse
tests/                         Node unit tests and registry/API tests
e2e/                           Five Playwright user-flow scenarios
docs/                          Deployment, API, architecture, accessibility, testing
.github/workflows/              CI, Pages deploy, CodeQL, OpenSSF Scorecard
infra/native-apps.md            Capacitor / Tauri setup notes
db/schema.sql                   PostgreSQL schema for future hosted features
```

## Run checks and build the Pages export

```bash
npm run validate-registry
npm test                      # 372 passing unit/registry/API tests at this revision
npm run build                 # Next static export → out/
npx playwright install chromium
npm run test:e2e:ci
npm run lighthouse:ci
```

`npm run build` uses `output: 'export'`; it does not use deprecated `next export`. Lighthouse results are uploaded by CI when available; the checkout has no measured before/after Lighthouse score yet. See [the performance report](docs/performance-report.md).

## Formula contributions

Every formula must include its domain, units, bilingual metadata, outputs, useful steps, and at least four independently checkable test cases. After editing, run `npm run sync-registry`, then the validator and suite before submitting. See [CONTRIBUTING.md](CONTRIBUTING.md), the [formula template](docs/FORMULA_TEMPLATE.md), and [the schema](packages/formula-registry/schema.json).

## Deployment

Read [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for GitHub Pages setup, the static/API boundary, custom domains, manual deployment, and rollback. The FastAPI service is optional and must run on a separate host.

## Governance and citation

- [Contributing](CONTRIBUTING.md) · [Code of Conduct](CODE_OF_CONDUCT.md) · [Security](SECURITY.md)
- [Changelog](CHANGELOG.md) · [Roadmap](ROADMAP.md) · [Citation](CITATION.cff)
- UI wireframe: [docs/WIREFRAME.md](docs/WIREFRAME.md). A checked-in product screenshot will be added after browser capture is available; no synthetic Lighthouse or screenshot claim is made.

## Disclaimer

This open-source calculator is an educational aid, not a substitute for independent verification, professional engineering review, clinical advice, or financial advice. Validate critical calculations against authoritative sources and applicable standards.
