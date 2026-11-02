# Security

PlanningPal keeps tenant data, agency credentials, and provider names off client devices and out of other customers' workspaces.

## Controls

- **Identity.** Sign-in is Supabase Auth (email and password, magic link, Google). The API accepts a bearer access token and checks it with Supabase. Browser role flags are ignored.
- **Authorization.** Every `/api/v1` route is listed in a server permission map. Owner, Admin, Member, and Viewer are enforced there. The role matrix is in `docs/ROLES.md`. A user cannot change their own role, an Admin cannot assign Owner, and the last Owner cannot be removed. A missing route is denied.
- **Tenancy.** The server resolves the workspace from the signed-in membership. Ids in the URL or body do not select a tenant. Another workspace's record is **404**. A member who lacks a permission receives **403**. Super Admin reaches another workspace only with `x-workspace-id`, and each of those requests is written to `audit_log`.
- **Row Level Security.** Postgres enables RLS on every application table. Policies are deny-by-default and key off `auth.uid()` in `workspace_members`. Viewers cannot write. Private notes, tasks, and unshared inbox messages are visible to their author. Staff do not bypass these policies. The API connects as the table owner, so the permission map remains the enforcement for Vercel Functions.
- **Campaign provider.** One agency key is encrypted with AES-256-GCM (`CAMPAIGN_KEY_ENCRYPTION_SECRET`) and stored in Postgres. Responses return a mask, never the key or ciphertext. Provider calls run only on the server. Client JSON, email, and the web bundle do not name the provider. Webhooks require `CAMPAIGN_WEBHOOK_SECRET` in the path or `x-campaign-webhook-token`.
- **Transport and browser.** `apps/web/vercel.json` sends HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, a referrer policy, a permissions policy, and a strict content security policy. Production builds do not publish source maps.
- **Input and output.** Request bodies and queries go through Zod. CSV cells that start with `=`, `+`, `-`, `@`, or a tab are prefixed so spreadsheets do not treat them as formulas. Download names are restricted to a safe character set. Search filters are parameterised.
- **Abuse.** Public and auth-adjacent routes are rate limited per IP. State-changing requests that send an `Origin` outside the allow-list are rejected. Auth redirects must stay on the PlanningPal origin.
- **Secrets.** Only `VITE_` values are available to the browser. The service-role key, database URL, Resend key, encryption secret, and webhook secret stay on the server. `.env` files are gitignored. CI fails the web build if it contains the provider name, `aecpipeline`, or those secret names. Dependabot opens update pull requests.
- **Errors.** Users see branded pages for a missing route, a crash, offline use, a 403, and an expired session. API 500s return a generic sentence. Logs redact email addresses and do not return stack traces.
- **Empty states.** Every screen distinguishes loading, error, no data yet, and no filter matches. The checklist is in `docs/QUALITY.md`. Sample figures are labelled and are not treated as live workspace data.

## What you turn on in GitHub

In the repository settings, enable secret scanning and push protection. Dependabot is configured in `.github/dependabot.yml`. This file cannot switch those GitHub settings on by itself.
