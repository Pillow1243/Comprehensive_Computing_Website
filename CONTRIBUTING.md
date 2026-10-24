# Contributing to SolveEverything

Thanks for helping make the project scientifically useful, accessible, and safe. Before opening a change, read the [Code of Conduct](CODE_OF_CONDUCT.md), [Formula template](docs/FORMULA_TEMPLATE.md), [architecture](docs/ARCHITECTURE.md), and [security policy](SECURITY.md).

## Ways to contribute

- Fix a formula, unit, explanation, accessibility issue, mobile layout, or documentation typo.
- Propose a practical new formula with trustworthy references and independently verifiable examples.
- Improve browser, API, registry-validation, or end-to-end tests.
- Review translations, RTL/LTR behavior, keyboard navigation, or PWA offline behavior.

## Local setup

```bash
nvm use
npm ci
npm run dev
```

The Next.js shell runs at `http://localhost:3000` and embeds the static PWA. The API is optional. To run it separately, use Python 3.12, install `backend/requirements.txt`, then run `uvicorn backend.main:app --reload --port 8000`. Local API CORS defaults include `http://localhost:3000` and `http://localhost:8080`.

## Before submitting

```bash
npm run validate-registry
npm test
npm run build
npm run test:e2e:ci       # after a build and Playwright browser install
```

For browser E2E tests, install Chromium once with `npx playwright install --with-deps chromium`. Lighthouse collection uses `.lighthouserc.cjs` and requires a Chromium-compatible browser. Do not commit `out/`, `public/app/`, reports, local secrets, or browser binaries.

## Formula contribution checklist

1. Confirm the topic is not already present in `packages/formula-registry/catalog.json` or the runtime registry.
2. Use a stable `snake_case` ID, bilingual name, category, LaTeX, clear Persian description, variables, units, and output definitions. See `docs/FORMULA_TEMPLATE.md` and `packages/formula-registry/schema.json`.
3. Put implementations in a trusted JS module. Do not use `eval`, `Function`, dynamic import from user input, or executable source stored in JSON.
4. Check valid domains and invalid inputs; use clear error messages. For dimensional values, document compatible units and base units.
5. Add at least four independent test cases per new formula. Include an edge case and a value that can be checked against a reputable reference.
6. Supply meaningful step-by-step output and a plot spec only if the visual is genuinely informative. Include sources in `references` when known.
7. Synchronize the JSON catalog with `node scripts/validate-registry.mjs` (the validator reports drift).
8. Label approximations, numerical tolerances, branches, assumptions, and scientific limitations. Do not claim an algorithm exists unless it is actually implemented.

## Backend/API contributions

- Keep static Pages behavior useful without an API.
- Configure CORS with exact allowed origins via `CORS_ORIGINS`; avoid wildcard credentials.
- Allow-list formula IDs and parser operations. Never execute arbitrary Python or JavaScript strings.
- Document deployment/environment changes and update API smoke tests.

## Pull requests

- Keep changes focused and explain the mathematical/technical rationale.
- Link related issues and include before/after screenshots for UI changes when available.
- Update tests, registry/cross-links, changelog, and docs when behavior or architecture changes.
- Ensure CI passes; a declared formula without tests is not ready to merge.
- Use the PR checklist in `.github/PULL_REQUEST_TEMPLATE.md`.

## Formula proposal template

```text
ID / bilingual name:
Category and tags:
Formula (LaTeX) and authoritative references:
Variables, units, valid domain and assumptions:
Inputs → expected outputs (at least four cases):
Implementation location and step-generation approach:
Plot/export behavior, if applicable:
Known limitations / numerical tolerance:
```
