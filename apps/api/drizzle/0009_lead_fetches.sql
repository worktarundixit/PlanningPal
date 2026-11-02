-- Workspace-scoped first fetch of recent applications. The shared catalogue stays global; membership decides who sees a row.
CREATE TABLE IF NOT EXISTS workspace_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES planning_applications(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, application_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS workspace_leads_workspace_idx ON workspace_leads (workspace_id, created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS lead_fetches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  days integer NOT NULL,
  status text NOT NULL,
  councils text[] NOT NULL DEFAULT ARRAY[]::text[],
  cursor integer NOT NULL DEFAULT 0,
  found integer NOT NULL DEFAULT 0,
  failed_councils text[] NOT NULL DEFAULT ARRAY[]::text[],
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
--> statement-breakpoint
ALTER TABLE lead_fetches DROP CONSTRAINT IF EXISTS lead_fetches_status_check;
--> statement-breakpoint
ALTER TABLE lead_fetches ADD CONSTRAINT lead_fetches_status_check CHECK (status IN ('running', 'succeeded', 'empty', 'partial'));
--> statement-breakpoint
ALTER TABLE workspace_leads ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE lead_fetches ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_read ON workspace_leads;
--> statement-breakpoint
CREATE POLICY tenant_read ON workspace_leads FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT public.member_workspace_ids()));
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_write ON workspace_leads;
--> statement-breakpoint
CREATE POLICY tenant_write ON workspace_leads FOR ALL TO authenticated
  USING (public.member_role(workspace_id) IN ('owner', 'admin', 'member'))
  WITH CHECK (public.member_role(workspace_id) IN ('owner', 'admin', 'member'));
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_read ON lead_fetches;
--> statement-breakpoint
CREATE POLICY tenant_read ON lead_fetches FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT public.member_workspace_ids()));
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_write ON lead_fetches;
--> statement-breakpoint
CREATE POLICY tenant_write ON lead_fetches FOR ALL TO authenticated
  USING (public.member_role(workspace_id) IN ('owner', 'admin', 'member'))
  WITH CHECK (public.member_role(workspace_id) IN ('owner', 'admin', 'member'));
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON workspace_leads, lead_fetches TO authenticated;
