# Security Policy

## Supported versions

Security fixes are applied to the current `main` branch. Published static builds may lag until the Pages workflow completes.

## Report a vulnerability privately

Please do **not** open a public issue for a suspected vulnerability. Use **GitHub → Security → Advisories → Report a vulnerability** on this repository (private vulnerability reporting / Security Advisories). Include the affected commit or version, reproduction steps, impact, and a suggested fix if known. The maintainers will coordinate acknowledgement and disclosure through the advisory.

If private reporting is not enabled, contact the repository maintainers through their GitHub profile and ask for a private disclosure channel. Do not send credentials or private user data in an issue.

## Security boundaries

- GitHub Pages serves public static files only. Every browser bundle, source map, and `NEXT_PUBLIC_*` variable is visible to visitors. Never put API keys, passwords, signing secrets, or private tokens in them.
- Client-side formula calculations do not require an account or transmit inputs. The optional API URL is a public origin, not a credential.
- Formula solvers are trusted JavaScript functions. The expression parser uses an allow-list and no `eval`; registry metadata must never be turned into executable source. The Python API allow-lists AST nodes and solver IDs; do not add `exec`/`eval` of user or registry content.
- The in-memory API rate limiter is an MVP safeguard only. Use shared Redis-backed limits, authentication, monitoring, and a reviewed deployment configuration before public high-volume use.
- API CORS is restricted by `CORS_ORIGINS`; set exact trusted origins on the API host. Do not use `*` for a credentialed production API.
- Report any discovery of unsafe HTML interpolation, prototype pollution, arbitrary code execution, dependency compromise, or exposed secrets promptly.

Security review does not replace independent scientific validation. Verify formulas and units against authoritative references before using results in safety-critical, medical, financial, or engineering decisions.
