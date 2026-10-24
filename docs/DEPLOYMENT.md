# Deployment: GitHub Pages and optional FastAPI API

## Architecture decision

GitHub Pages hosts static files only; it does **not** run the FastAPI process, Python, SymPy, PostgreSQL, Redis, or a worker. The Pages build exports a Next.js static shell, and `scripts/prepare-static-app.mjs` copies the existing client-first PWA and Formula Registry into `public/app/`. The shell embeds that app at the repository root so the public URL stays clean. Ordinary formula solving, safe expression evaluation, unit conversions, plots, and local history run in the browser and continue to work offline.

Operations that genuinely require a server use the optional FastAPI bridge. If its public base URL is absent or unreachable, the UI gives a clear “This operation requires a server” / «این عملیات نیاز به سرور دارد» message; it does not crash or silently send private inputs elsewhere.

## 1. GitHub Pages (recommended)

1. Merge the workflow to `main` (the deploy workflow intentionally only publishes `main`).
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source.
3. Optionally add the public API origin as a repository **variable** named `NEXT_PUBLIC_API_URL`. Do not put an API key or other secret in a `NEXT_PUBLIC_*` value.
4. Run **Actions → Deploy to Pages → Run workflow**, or push to `main`.
5. The project-site URL is `https://Pillow1243.github.io/Comprehensive_Computing_Website/` (GitHub usernames/organization names are case-insensitive; the repository path is case-sensitive).

The workflow runs `npm ci`, validates the Formula Registry, runs unit tests, performs `npm run build` with Next's `output: 'export'`, uploads `out/`, and deploys the artifact over HTTPS. No `next export` command is used. The exact repository base path is set in `next.config.mjs` only for production builds.

### Optional custom domain

Add a `CNAME` file under `public/` containing only the chosen hostname (for example `solve.example.org`) before building. Configure the corresponding DNS records at the domain provider, set the custom domain in **Settings → Pages**, and enable **Enforce HTTPS** after DNS validation. Do not check in a CNAME for a domain you do not control.

### Manual build / manual deployment

For a reproducible local export:

```bash
nvm use                 # .nvmrc is the supported Node major
npm ci
npm run validate-registry
npm test
NEXT_PUBLIC_API_URL=https://api.example.org npm run build
# inspect the static artifact in out/
```

Preview the production artifact locally with `node scripts/serve-static.mjs`; it emulates the case-sensitive project-site prefix at `http://localhost:4173/Comprehensive_Computing_Website/`. For a manual GitHub Pages deployment, use **Actions → Deploy to Pages → Run workflow** after setting Pages source to GitHub Actions; the workflow uploads the required Pages artifact. For another static host, upload the contents of `out/` and configure it to serve `index.html` for the project root. Do not deploy the FastAPI container into the Pages artifact.

## 2. Optional FastAPI deployment (Railway, Render, Fly.io, etc.)

Deploy `backend/` as a separate Python 3.12 web service and run:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Set the service health check to `/health`. Configure `CORS_ORIGINS` on the API service as a comma-separated list of **origins only**, e.g.:

```text
https://pillow1243.github.io,https://solve.example.org
```

The GitHub Pages project path is not part of an Origin. The API has a conservative localhost + Pages default; production custom domains must be added explicitly. The current API uses an in-process rate limiter for the MVP; replace it with shared Redis-backed limits before scaling. Use the platform's TLS, logs, health checks, and secret manager for server-only credentials.

At front-end build time, set `NEXT_PUBLIC_API_URL` to the API's HTTPS base URL. This value is public and is embedded in the generated client configuration. Never put secrets there. The client currently calls the API for symbolic differentiation; all supported local formula calculators remain functional if the API is absent.

## Rollback

- In **Actions**, redeploy the last known-good `Deploy to Pages` workflow run if its artifact is retained.
- Otherwise revert the release/deployment commit on `main`, let the workflow publish the reverted tree, and verify the Pages environment URL.
- For API-only regressions, roll back the API service independently; the offline client calculators do not depend on it.
- If a custom domain was involved, do not remove DNS or CNAME records until the previous site is serving successfully.

## Operational notes

- Pages deployment cannot be completed by a repository file alone: an authorized maintainer must set the Pages source to GitHub Actions once.
- Browser-side code and source maps are public. Treat all `NEXT_PUBLIC_*` values as disclosed.
- The export is static and does not provide SSR, dynamic API routes, authentication, server-side persistence, or server-side rendering of every formula page. Those are separate-host/API or future migration work.
