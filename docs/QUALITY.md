# Quality checklist

Use this list on every pull request, together with `SECURITY.md`.

## Screens

- [ ] A missing route uses the branded 404. A crash uses the error boundary. Offline, forbidden, and expired-session screens stay branded.
- [ ] Loading uses a skeleton, not a blank page and not a spinner standing in for content.
- [ ] An error is a designed state with a retry action. It is not a stack trace, a raw provider message, or an empty table.
- [ ] No data yet is its own state: an on-brand icon, one sentence, and one primary action such as “Set up your ICP”, “Run your first planning search”, “Invite your team”, or “Create a campaign”.
- [ ] A filter or search that matches nothing is a different state from no data, with a way to clear the filter.
- [ ] Sample or demo figures are labelled “Sample preview” and are not shown as the workspace’s live numbers.
- [ ] Command centre widgets for a new workspace follow the same rules: KPI cards, charts, feeds, tables, pipeline, inbox, tasks, contacts, saved schemes, campaigns, reports, team, billing, and search.

## Security

- [ ] Zod on API inputs. Server-side authorization. RLS deny-by-default. Cross-tenant id swaps return 404.
- [ ] Security headers, rate limits, webhook secret checks, CSV formula escaping, and same-origin auth redirects.
- [ ] No secrets in the client bundle. CI scans the web build. `pnpm audit` has no high or critical findings.
