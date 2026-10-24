# Roadmap

The long-form scientific catalog is a multi-release research and validation project, not a promise that every listed theorem or numerical algorithm is already production-ready. Formula counts below mean implemented, tested client-side entries; catalog topics may remain planned.

## Phase 0 — MVP (baseline)
- [x] Client-first PWA, safe expression engine, dynamic 2D plots, bilingual RTL/LTR shell.
- [x] 46 implemented and tested formulas; FastAPI/SymPy prototype and database schema.

## Phase 1 — Publish and broaden the practical core (current)
**Target:** four-week iteration; 200+ validated formulas; 300+ automated tests; Pages HTTPS release; dependable mobile experience.

- [x] Establish static-export build, exact repository `basePath`, deploy workflow, manual deployment/rollback docs.
- [x] Make the client registry authoritative for common formulas; add explicit server-only API diagnostics and restrictive configurable CORS.
- [x] Add 54 more client-side formulas (100 total), schema validation, catalog index, and four or more declared cases per new formula.
- [x] Add five Playwright end-to-end scenarios, CI configuration, CodeQL, Scorecard, Dependabot, issue/PR templates, and repository policies.
- [x] Preserve mobile-first CSS, safe-area handling, seven responsive breakpoints, touch target sizing, and PWA install metadata.
- [ ] Enable Pages in repository Settings and confirm a successful deployment from `main`.
- [ ] Run Lighthouse in the GitHub Actions browser environment; review and publish the collected scores (no truthful before/after measurement exists in the source checkout yet).
- [ ] Grow from 100 to 200+ reviewed formulas, particularly core algebra/calculus/geometry, introductory physics/chemistry, and common engineering calculations.
- [ ] Add dimensional validation and authoritative references to formulas before calling the catalog release-grade.

## Phase 2 — Scientific coverage and tooling
- [ ] Reach 500+ validated formula entries across the full A–L topic map.
- [ ] Add 3D plot surfaces, richer graphing, coordinate conversions, broader units/dimensional analysis, Arabic translations, and searchable topic tree.
- [ ] Add a stable public API contract, generated JavaScript/Python SDKs, backend deployment guide, rate limiting backed by Redis, and integration tests.
- [ ] Add formula detail pages with citations, examples, version history, and richer export (LaTeX/SVG/CSV/Markdown).
- [ ] Package iOS/Android shells with Capacitor; validate in supported browser/device matrices.

## Phase 3 — Advanced solvers
- [ ] Move toward 1,000 formulas and dedicated SEO/static pages per formula.
- [ ] Add reviewed symbolic/numeric solver coverage, ODE/PDE numerical methods, 3D interaction, accessibility audit, and performance budgets.
- [ ] Add opt-in, privacy-reviewed telemetry and monitoring only after documented consent and data-retention policy.
- [ ] Add Tauri desktop distribution after signing and update mechanisms are reviewed.

## Phase 4 — Community and scale
- [ ] Aim for 2,000+ formula entries with maintainer review, provenance, versioning, reproducibility, and automated generated tests.
- [ ] Add user contributions/review workflows, training and practice features, and optional service plans only with a sustainable privacy/security model.
- [ ] Reassess architecture, load tests, backup/restore drills, abuse prevention, and cost before claiming 100k concurrent-user capacity.

## Acceptance policy

- A formula is not “implemented” merely because its topic appears in the catalog. It needs a trusted solver, explicit domain checks, unit semantics, explanatory steps, references where appropriate, and automated tests.
- Safety-critical, medical, financial, and structural-design formulas require independent domain review and prominent limitations.
- Do not represent planned numerical algorithms (e.g. AKS, FEM, full CAS, general PDE solving) as complete when only a basic approximation or formula is available.
