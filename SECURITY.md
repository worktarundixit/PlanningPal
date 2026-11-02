# Security

PlanningPal keeps tenant data, agency credentials, and provider names off client devices and out of other customers' workspaces.

## Controls

- **Identity.** Sign-in is Supabase Auth (email and password, magic link, Google). The API accepts a bearer access token and checks it with Supabase. Browser role flags are ignored.
- **Authorization.** Every `/api/v1` route is listed in a server permission map. Owner, Admin, Member, and Viewer are enforced there. Super Admin is a platform role for Hitcaliber staff. A missing route is denied.
- **Row Level Security.** Postgres enables RLS on every application table. Policies are deny-by-default. A signed-in database role can read and write only its organisation. Provider settings and engine links are Super Admin only. The API connects as the table owner, so the permission map remains the enforcement for Vercel Functions.
- **Campaign provider.** One agency key is encrypted with AES-256-GCM (`CAMPAIGN_KEY_ENCRYPTION_SECRET`) and stored in Postgres. Responses return a mask, never the key or ciphertext. Provider calls run only on the server. Client JSON, email, and the web bundle do not name the provider. Webhooks require `CAMPAIGN_WEBHOOK_SECRET` in the path or `x-campaign-webhook-token`.
- **Transport and browser.** `apps/web/vercel.json` sends HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, a referrer policy, a permissions policy, and a strict content security policy. Production builds do not publish source maps.
- **Input and output.** Request bodies and queries go through Zod. CSV cells that start with `=`, `+`, `-`, `@`, or a tab are prefixed so spreadsheets do not treat them as formulas. Download names are restricted to a safe character set. Search filters are parameterised.
- **Abuse.** Public and auth-adjacent routes are rate limited per IP. State-changing requests that send an `Origin` outside the allow-list are rejected. Auth redirects must stay on the PlanningPal origin.
- **Secrets.** Only `VITE_` values are available to the browser. The service-role key, database URL, Resend key, encryption secret, and webhook secret stay on the server. `.env` files are gitignored. CI fails the web build if it contains the provider name, `aecpipeline`, or those secret names. Dependabot opens update pull requests.
- **Errors.** Users see branded pages for a missing route, a crash, offline use, a 403, and an expired session. API 500s return a generic sentence. Logs redact email addresses and do not return stack traces.

## What you turn on in GitHub

In the repository settings, enable secret scanning and push protection. Dependabot is configured in `.github/dependabot.yml`. This file cannot switch those GitHub settings on by itself.
