# SolveEverything

[English](README.md) · [فارسی](README.fa.md)

[![CI](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/ci.yml/badge.svg)](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-informational.svg)](CHANGELOG.md)
[![CodeQL](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/codeql.yml/badge.svg)](https://github.com/Pillow1243/Comprehensive_Computing_Website/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/Pillow1243/Comprehensive_Computing_Website/badge)](https://securityscorecards.dev/viewer/?uri=github.com/Pillow1243/Comprehensive_Computing_Website)
![PWA](https://img.shields.io/badge/PWA-installable%20%7C%20offline-ready-7c5cff)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](.github/PULL_REQUEST_TEMPLATE.md)

**Solve any equation, step by step.** A Persian/English client-first scientific calculator for mathematics, physics, chemistry, engineering, statistics, and finance—built to work offline and deploy as a static site.

**Live demo:** [Pillow1243.github.io/Comprehensive_Computing_Website](https://Pillow1243.github.io/Comprehensive_Computing_Website/) · **Status:** v2.0.0 · **Implemented:** 155 formula solvers with 430 declared, automatically verified test cases.

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
| Formula solvers | 155 client-side formulas across core math, geometry, calculus, statistics, physics, chemistry, engineering, finance, health and computer science | The 500+ broad scientific catalog remains a roadmap target; see `ROADMAP.md`. |
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
scripts/                       Catalog sync/validation, bundle budget, static preview and Lighthouse
tests/                         Vitest component/unit suites plus Node registry and API tests
e2e/                           Playwright flows for desktop and seven Android device profiles
docs/                          Deployment, API, architecture, accessibility, testing
.github/workflows/              CI, Pages deploy, CodeQL, OpenSSF Scorecard
infra/native-apps.md            Capacitor / Tauri setup notes
db/schema.sql                   PostgreSQL schema for future hosted features
```

## Run checks and build the Pages export

```bash
npm run validate-registry     # 155 formulas, 430 cases, 29 catalog sections, manifests in sync
npm run test:unit             # 690 Vitest tests (7 files: registry, engine, validation, utils, components, solver flow, compute client)
npm test                      # test:unit + 596 Node registry/API/security assertions
npm run build                 # Next static export → out/ (162 pages)
npm run budget                # gzip JavaScript budgets: 192.3 KB home / 200, 20.6 KB formula page / 100
npm run test:all              # validate → all tests → build → budget
npx playwright install chromium
npm run test:e2e:ci           # 79 flows across desktop + 7 Android profiles
npm run lighthouse:ci         # budgets in .lighthouserc.json (perf ≥ 0.9, a11y ≥ 0.95)
```

`npm run build` uses `output: 'export'`; it does not use deprecated `next export`. Playwright browsers are not installed in every sandbox, so browser suites run in CI; Lighthouse scores are only quoted from an actual browser run (see [the performance report](docs/performance-report.md)).

## Formula contributions

Every formula must include its domain, units, bilingual metadata, outputs, useful steps, and at least two independently checkable test cases (the generator targets four wherever the domain allows). After editing, run `npm run sync-registry`, then the validator and suite before submitting. See [CONTRIBUTING.md](CONTRIBUTING.md), the [formula template](docs/FORMULA_TEMPLATE.md), and [the schema](packages/formula-registry/schema.json).

## Deployment

Read [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for GitHub Pages setup, the static/API boundary, custom domains, manual deployment, and rollback. The FastAPI service is optional and must run on a separate host.

## Governance and citation

- [Contributing](CONTRIBUTING.md) · [Code of Conduct](CODE_OF_CONDUCT.md) · [Security](SECURITY.md)
- [Changelog](CHANGELOG.md) · [Roadmap](ROADMAP.md) · [Citation](CITATION.cff)
- UI wireframe: [docs/WIREFRAME.md](docs/WIREFRAME.md). The manifest intentionally ships without `screenshots` until a real browser capture exists; no synthetic screenshot or Lighthouse score is claimed.

## Disclaimer

This open-source calculator is an educational aid, not a substitute for independent verification, professional engineering review, clinical advice, or financial advice. Validate critical calculations against authoritative sources and applicable standards.
