# Security

This branch is the portal foundation. Later pull requests add organisation sign-in, row level security, and the campaign provider. The controls below are already in force here.

## Controls

- Unknown routes show a branded 404. A render crash shows a generic error page. Losing the network shows an offline state.
- `apps/web/vercel.json` sends HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, a referrer policy, a permissions policy, and a content security policy.
- Production builds do not publish source maps.
- API 500s return a generic sentence. Logs redact email addresses and do not send stack traces to the browser.
- Health, demo requests, and telemetry are rate limited per IP.
- CSV cells that start with `=`, `+`, `-`, `@`, or a tab are prefixed so spreadsheets do not treat them as formulas.
- Request bodies used by the API are validated. Queries are parameterised.
- Only `VITE_` values are available to the browser. `.env` files are gitignored.
- CI fails the web build if it contains `instantly`, `aecpipeline`, or server secret names.
- Dependabot opens update pull requests. `pnpm audit` fails the build on high or critical advisories.

## What you turn on in GitHub

Enable secret scanning and push protection in the repository settings. Dependabot is configured in `.github/dependabot.yml`.
