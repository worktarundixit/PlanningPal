# Workspace roles

A workspace is the tenant. The server resolves it from the signed-in membership. Ids in the URL or body never choose a tenant on their own. A record that belongs to another workspace is returned as **404**, so callers cannot tell whether the id exists. A member who lacks a permission receives **403**.

Every id is a UUID.

| Role | Can do |
| --- | --- |
| Owner | Everything an Admin can do, plus billing and `DELETE /api/v1/workspaces/:id` for the signed-in workspace. |
| Admin | Settings, campaigns, and members. An Admin cannot create, promote, or remove an Owner. |
| Member | Leads, saved schemes, CRM, inbox, and campaigns. Tasks and private notes belong to the member who wrote them unless they are shared. |
| Viewer | Read-only. Writes are rejected. |
| Super Admin | Hitcaliber staff. Cross-workspace access is a separate path: send `x-workspace-id` with the workspace UUID. Every such request is written to `audit_log`. A missing workspace is 404. Staff do not silently land in the first workspace. `GET /api/v1/onboarding/clients` lists each workspace's setup step and is audited. |

## Rules that cannot be bypassed

- A user cannot change their own role.
- An Admin cannot assign the Owner role.
- The last Owner cannot be removed or demoted.
- Row Level Security is deny-by-default. Policies allow a row only when `auth.uid()` is a member of that `workspace_id` in `workspace_members`, and writes require a non-viewer role.
- The browser hides actions the role cannot use. That is presentation only.

## Private records

Notes and tasks are visible to their author. Other members see them only when `shared` is true. Inbox messages follow the same rule. Shared campaign replies stay visible to the workspace.
