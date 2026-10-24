# Testing strategy

## Unit / registry

- `npm test` runs Node's built-in test runner across `tests/*.test.mjs` (currently **377 passing tests**; backend: `python -m unittest discover -s backend -p "test_*.py"`).
- Every runtime formula must have metadata, a trusted compute function, at least one declared input/output case, and explanatory steps. Each of the 54 added Phase 1 formulas currently declares four or more numerical cases; the registry includes **266 formula cases** total.
- `npm run sync-registry` refreshes the complete JSON formula index after trusted runtime entries change; `npm run validate-registry` then applies the JSON Schema to all 100 entries and checks unique IDs, compute/step implementations, every expected output, and catalog synchronization.
- `python -m unittest discover -s backend -p 'test_*.py'` runs 11 Python parser, solver, API, and CORS security checks.
- Existing tests cover the safe expression parser, numerical derivative/integral/root tools, units, optional API failure behavior, and every formula's declared test cases.

## CI integration and E2E

The pinned GitHub Actions CI workflow:

1. Installs dependencies via `npm ci`.
2. Runs registry validation and unit tests.
3. Builds the Pages static export.
4. Installs Chromium and runs five Playwright flows: Pages root/PWA manifest, pH search and solve, quadratic roots and steps, calculator plus server-unavailable fallback, and mobile unit conversion/no horizontal overflow.
5. Runs the optional FastAPI smoke checks with a Python 3.12 environment.
6. Runs Lighthouse CI against the project-path export and uploads reports where the runner/browser supports collection.

Run E2E locally with:

```bash
npx playwright install chromium
npm run build
npm run test:e2e:ci
```

Run Lighthouse with `npm run lighthouse:ci`. See `docs/performance-report.md`: there is no historical baseline and no measured score in the local environment yet, so no before/after numbers are claimed.

## Planned validation

- Expand to 200+ reviewed formulas in Phase 1 and then 500+ across the longer-term topic map.
- Add property-based tests, dimensional consistency checks, API integration tests, and browser/device matrix testing.
- Add visual regression and accessibility audit runs; target WCAG 2.1 AA and responsive widths 320, 480, 768, 1024, 1280, 1536, and 1920 px.
- Perform load tests only after a separately hosted API and production shared rate limiter exist; the current MVP is not validated for 100k concurrent users.
