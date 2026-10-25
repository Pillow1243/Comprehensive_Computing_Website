# Roadmap — SolveEverything

This is a scientific calculator/workbench, not literally a solver for every possible problem. Counts describe the current local registry; they are not a measure of scientific completeness. Do not claim production readiness, expert review, or broad domain coverage unless the corresponding evidence exists.

## Current baseline (2026-10-25)

- 315 implemented client-side formula calculators, 754 declared computational cases, 29 catalog sections.
- 14 sections currently have at least one calculator; 15 have none. Implemented entries in a section do not mean the whole discipline is covered.
- Formula calculations run locally and work without an API. History and bookmarks use local storage.
- GitHub Pages static export; optional FastAPI prototype is a separate service and is not deployed by the static site workflow.
- Formula review metadata now separates computational test status from scientific review. Existing entries remain `not_reviewed`; sources must not be invented or bulk-filled without verification.
- Verified in this checkout: `npm run test:all` passes (registry, 1,378 Vitest tests, 1,082 Node tests, static build of 330 routes, JS budgets). `npm run audit` reports zero known npm advisories. Playwright browser tests are listed in CI but were not executed in this review environment.

## P0 — trust and safe release

- [x] Add a real Web Share Target route; safely route same-origin formula links and treat external links as search text.
- [x] Add JSON and CSV calculation downloads; protect exported text cells from spreadsheet formula injection.
- [x] Upgrade vulnerable npm dependencies and gate CI/Pages publishing on `npm audit`.
- [x] Add schema/registry support for citations, reviewer attribution, review date, and a separate scientific-review status.
- [x] Clearly distinguish computational test cases from independent scientific review in formula pages and metadata.
- [x] Regenerate catalog section status from actual implemented IDs and validate section counts.
- [ ] Curate and independently verify sources, assumptions, units, and examples for every formula. Do not mark any entry `domain_reviewed` until a qualified reviewer and credible HTTPS sources are recorded.
- [ ] Deploy the current Pages artifact from `main`, verify the live URL, and capture actual Lighthouse, accessibility, and browser-matrix results.
- [ ] Add an independent formula-oracle/property-test set and unit/dimensional consistency checks; declared examples alone are not independent evidence.

## P1 — dependable scientific workbench

- [ ] Define dimension vectors and canonical units for formula inputs/outputs; convert values consistently at the input boundary and reject incompatible dimensions.
- [ ] Expand edge-case, numerical-stability, precision, uncertainty, and invalid-domain handling across all formulas.
- [ ] Add end-to-end tests for exports, share handling, offline first/deep links, and supported browsers; run them in CI with reports retained.
- [ ] Add automated WCAG 2.2 AA checks plus manual screen-reader, keyboard-only, zoom/reflow, contrast, and reduced-motion review.
- [ ] Re-run Lighthouse after substantial changes; document the commit, environment, raw artifacts, and median results. The current historical performance report is not a measurement of this branch.
- [ ] Improve formula-detail learning content: derivations, assumptions, worked examples, limitations, links to related concepts, and locale-specific SEO metadata.
- [x] Add CSV/JSON calculation exports with quoted cells and spreadsheet-formula prefix protection.
- [ ] Add LaTeX/SVG/Markdown report exports and reproducible calculation records.

## P2 — breadth, APIs, and persistence

- [ ] Fill the 17 empty sections based on user demand, with reviewed algorithms rather than placeholder formula counts. High-priority candidates: optimization, special functions, discrete mathematics, signal processing, scientific computing, time-series, robotics/orbits, and numerical methods.
- [ ] Add 3D plotting, richer numerical root/ODE/PDE tools, coordinate transforms, and broader unit/constant coverage with independently tested methods.
- [ ] Publish a versioned API contract and SDKs only after a separately hosted API has integration tests, time/resource limits, shared Redis-backed rate limits, monitoring, backup/restore, and abuse controls.
- [ ] Add optional accounts/cloud sync, contribution review, and shared workspaces only with explicit consent, export/delete controls, documented retention, and a reviewed security model.
- [ ] Finish Arabic scientific translation and test the language/RTL experience with native readers.

## P3 — scale and governance

- [ ] Grow toward 500 / 1,000 / 2,000 reviewed entries as a result of transparent editorial coverage plans—not as a standalone KPI.
- [ ] Add formula provenance, semantic versioning, reviewer change history, reproducible test vectors, and community correction workflow.
- [ ] Reassess static-site and API architecture, load test representative workloads, and measure cost before making any concurrency or reliability claims.
- [ ] Consider native wrappers only after the mobile web experience and offline lifecycle are validated on real devices.

## Non-goals until independently delivered

Do not claim full CAS, general PDE/FEM solving, medical diagnosis/dosing, professional engineering certification, authenticated user sync, a deployed API, 100k concurrent capacity, or complete coverage of any named discipline when the implementation is only a prototype or a subset.
