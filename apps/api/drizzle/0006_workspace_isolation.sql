-- Tenant key on every table. organisation_id stays for existing queries and is copied into workspace_id.
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS slug text;
--> statement-breakpoint
UPDATE organisations SET slug = id::text WHERE slug IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS organisations_slug_idx ON organisations (slug);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  auth_user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, auth_user_id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  workspace_id uuid,
  action text NOT NULL,
  method text NOT NULL DEFAULT '',
  path text NOT NULL DEFAULT '',
  record_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
INSERT INTO workspace_members (workspace_id, user_id, auth_user_id, role)
SELECT organisation_id, id, auth_user_id, org_role
FROM users
WHERE organisation_id IS NOT NULL
  AND auth_user_id IS NOT NULL
  AND org_role IN ('owner', 'admin', 'member', 'viewer')
ON CONFLICT (workspace_id, auth_user_id) DO NOTHING;
--> statement-breakpoint
DO $$
DECLARE
  tenant text;
BEGIN
  FOREACH tenant IN ARRAY ARRAY[
    'users', 'team_members', 'custom_roles', 'saved_schemes', 'crm_leads', 'activities',
    'campaigns', 'sending_domains', 'inbox_conversations', 'intent_events',
    'persona_templates', 'meetings', 'invoices', 'invitations',
    'campaign_provider_mappings', 'campaign_engine_links'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS workspace_id uuid', tenant);
    EXECUTE format('UPDATE %I SET workspace_id = organisation_id WHERE workspace_id IS NULL', tenant);
  END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE inbox_messages ADD COLUMN IF NOT EXISTS workspace_id uuid;
--> statement-breakpoint
ALTER TABLE inbox_messages ADD COLUMN IF NOT EXISTS owner_user_id uuid;
--> statement-breakpoint
ALTER TABLE inbox_messages ADD COLUMN IF NOT EXISTS shared boolean NOT NULL DEFAULT true;
--> statement-breakpoint
UPDATE inbox_messages AS message
SET workspace_id = conversation.organisation_id
FROM inbox_conversations AS conversation
WHERE message.conversation_id = conversation.id
  AND message.workspace_id IS NULL;
--> statement-breakpoint
ALTER TABLE activities ADD COLUMN IF NOT EXISTS shared boolean NOT NULL DEFAULT false;
--> statement-breakpoint
UPDATE activities SET shared = true WHERE type NOT IN ('note', 'task');
--> statement-breakpoint
ALTER TABLE councils ADD COLUMN IF NOT EXISTS workspace_id uuid;
--> statement-breakpoint
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS workspace_id uuid;
--> statement-breakpoint
ALTER TABLE decision_makers ADD COLUMN IF NOT EXISTS workspace_id uuid;
--> statement-breakpoint
ALTER TABLE mail_log ADD COLUMN IF NOT EXISTS workspace_id uuid;
--> statement-breakpoint
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS workspace_id uuid;
--> statement-breakpoint
ALTER TABLE telemetry_events ADD COLUMN IF NOT EXISTS workspace_id uuid;
--> statement-breakpoint
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS workspace_id uuid;
--> statement-breakpoint
ALTER TABLE raw_payloads ADD COLUMN IF NOT EXISTS workspace_id uuid;
--> statement-breakpoint
ALTER TABLE ingest_cursors ADD COLUMN IF NOT EXISTS workspace_id uuid;
--> statement-breakpoint
ALTER TABLE campaign_provider_settings ADD COLUMN IF NOT EXISTS workspace_id uuid;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.sync_tenant_workspace()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.organisation_id IS NOT NULL THEN
    NEW.workspace_id := NEW.organisation_id;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
DO $$
DECLARE
  tenant text;
BEGIN
  FOREACH tenant IN ARRAY ARRAY[
    'users', 'team_members', 'custom_roles', 'saved_schemes', 'crm_leads', 'activities',
    'campaigns', 'sending_domains', 'inbox_conversations', 'intent_events',
    'persona_templates', 'meetings', 'invoices', 'invitations',
    'campaign_provider_mappings', 'campaign_engine_links'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS sync_workspace_id ON %I', tenant);
    EXECUTE format('CREATE TRIGGER sync_workspace_id BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.sync_tenant_workspace()', tenant);
  END LOOP;
END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.sync_workspace_member()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.organisation_id IS NOT NULL AND NEW.auth_user_id IS NOT NULL AND NEW.org_role IN ('owner', 'admin', 'member', 'viewer') THEN
    INSERT INTO workspace_members (workspace_id, user_id, auth_user_id, role)
    VALUES (NEW.organisation_id, NEW.id, NEW.auth_user_id, NEW.org_role)
    ON CONFLICT (workspace_id, auth_user_id) DO UPDATE
      SET role = EXCLUDED.role, user_id = EXCLUDED.user_id;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_member_on_user ON users;
--> statement-breakpoint
CREATE TRIGGER sync_member_on_user AFTER INSERT OR UPDATE OF organisation_id, org_role, auth_user_id ON users
FOR EACH ROW EXECUTE FUNCTION public.sync_workspace_member();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.member_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM workspace_members
  WHERE auth_user_id = auth.uid()::text;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.member_role(ws uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM workspace_members
  WHERE auth_user_id = auth.uid()::text AND workspace_id = ws
  LIMIT 1;
$$;
--> statement-breakpoint
DO $$
DECLARE
  tenant text;
BEGIN
  FOREACH tenant IN ARRAY ARRAY[
    'team_members', 'custom_roles', 'saved_schemes', 'crm_leads', 'activities',
    'sending_domains', 'inbox_conversations', 'inbox_messages', 'intent_events',
    'persona_templates', 'meetings', 'invitations'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tenant);
    EXECUTE format('DROP POLICY IF EXISTS tenant_all ON %I', tenant);
    EXECUTE format('DROP POLICY IF EXISTS tenant_read ON %I', tenant);
    EXECUTE format('DROP POLICY IF EXISTS tenant_write ON %I', tenant);
    EXECUTE format(
      'CREATE POLICY tenant_read ON %I FOR SELECT TO authenticated USING (workspace_id IN (SELECT public.member_workspace_ids()))',
      tenant
    );
    EXECUTE format(
      'CREATE POLICY tenant_write ON %I FOR ALL TO authenticated USING (public.member_role(workspace_id) IN (''owner'', ''admin'', ''member'')) WITH CHECK (public.member_role(workspace_id) IN (''owner'', ''admin'', ''member''))',
      tenant
    );
  END LOOP;
END $$;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_all ON campaigns;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_read ON campaigns;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_write ON campaigns;
--> statement-breakpoint
CREATE POLICY tenant_read ON campaigns FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT public.member_workspace_ids()));
--> statement-breakpoint
CREATE POLICY tenant_write ON campaigns FOR ALL TO authenticated
  USING (public.member_role(workspace_id) IN ('owner', 'admin', 'member'))
  WITH CHECK (public.member_role(workspace_id) IN ('owner', 'admin', 'member'));
--> statement-breakpoint
DROP POLICY IF EXISTS organisations_tenant ON organisations;
--> statement-breakpoint
CREATE POLICY organisations_tenant ON organisations FOR SELECT TO authenticated
  USING (id IN (SELECT public.member_workspace_ids()));
--> statement-breakpoint
CREATE POLICY organisations_owner_write ON organisations FOR UPDATE TO authenticated
  USING (public.member_role(id) = 'owner')
  WITH CHECK (public.member_role(id) = 'owner');
--> statement-breakpoint
DROP POLICY IF EXISTS users_tenant ON users;
--> statement-breakpoint
CREATE POLICY users_read ON users FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT public.member_workspace_ids()) OR auth_user_id = auth.uid()::text);
--> statement-breakpoint
CREATE POLICY users_write ON users FOR UPDATE TO authenticated
  USING (public.member_role(workspace_id) IN ('owner', 'admin') OR auth_user_id = auth.uid()::text)
  WITH CHECK (public.member_role(workspace_id) IN ('owner', 'admin', 'member', 'viewer') OR auth_user_id = auth.uid()::text);
--> statement-breakpoint
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS members_read ON workspace_members;
--> statement-breakpoint
CREATE POLICY members_read ON workspace_members FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT public.member_workspace_ids()));
--> statement-breakpoint
DROP POLICY IF EXISTS members_write ON workspace_members;
--> statement-breakpoint
CREATE POLICY members_write ON workspace_members FOR ALL TO authenticated
  USING (public.member_role(workspace_id) IN ('owner', 'admin'))
  WITH CHECK (public.member_role(workspace_id) IN ('owner', 'admin'));
--> statement-breakpoint
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE campaign_provider_settings ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE campaign_provider_mappings ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE campaign_engine_links ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS campaign_provider_settings_admin ON campaign_provider_settings;
--> statement-breakpoint
DROP POLICY IF EXISTS campaign_provider_mappings_admin ON campaign_provider_mappings;
--> statement-breakpoint
DROP POLICY IF EXISTS campaign_engine_links_admin ON campaign_engine_links;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON workspace_members, audit_log TO authenticated;
