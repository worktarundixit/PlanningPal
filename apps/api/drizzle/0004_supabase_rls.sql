-- Supabase Auth owns identity. These Better Auth tables are unused.
DROP TABLE IF EXISTS auth_account CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS auth_session CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS auth_verification CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS auth_user CASCADE;
--> statement-breakpoint
-- Local Postgres has no Supabase auth schema. Do not replace auth.uid() when it already exists.
-- The `anon` and `authenticated` roles are created in the migrator before this file runs.
-- CREATE ROLE cannot run inside the migration transaction.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    CREATE SCHEMA auth;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$ SELECT NULL::uuid $fn$;
  END IF;
END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()::text
      AND platform_role = 'super_admin'
  );
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.current_organisation_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id FROM public.users
  WHERE auth_user_id = auth.uid()::text
    AND organisation_id IS NOT NULL;
$$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO anon, authenticated;
--> statement-breakpoint
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE saved_schemes ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE sending_domains ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE inbox_conversations ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE intent_events ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE persona_templates ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE planning_applications ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE councils ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE decision_makers ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE raw_payloads ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE ingest_cursors ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE mail_log ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS organisations_tenant ON organisations;
--> statement-breakpoint
CREATE POLICY organisations_tenant ON organisations
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR id IN (SELECT public.current_organisation_ids()))
  WITH CHECK (public.is_super_admin() OR id IN (SELECT public.current_organisation_ids()));
--> statement-breakpoint
DROP POLICY IF EXISTS users_tenant ON users;
--> statement-breakpoint
CREATE POLICY users_tenant ON users
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR auth_user_id = auth.uid()::text
    OR organisation_id IN (SELECT public.current_organisation_ids())
  )
  WITH CHECK (
    public.is_super_admin()
    OR organisation_id IN (SELECT public.current_organisation_ids())
  );
--> statement-breakpoint
DO $$
DECLARE
  tenant text;
BEGIN
  FOREACH tenant IN ARRAY ARRAY[
    'team_members', 'custom_roles', 'saved_schemes', 'crm_leads', 'activities',
    'campaigns', 'sending_domains', 'inbox_conversations', 'intent_events',
    'persona_templates', 'meetings', 'invoices', 'invitations'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_all ON %I', tenant);
    EXECUTE format(
      'CREATE POLICY tenant_all ON %I FOR ALL TO authenticated USING (public.is_super_admin() OR organisation_id IN (SELECT public.current_organisation_ids())) WITH CHECK (public.is_super_admin() OR organisation_id IN (SELECT public.current_organisation_ids()))',
      tenant
    );
  END LOOP;
END $$;
--> statement-breakpoint
DROP POLICY IF EXISTS planning_read ON planning_applications;
--> statement-breakpoint
CREATE POLICY planning_read ON planning_applications FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
DROP POLICY IF EXISTS councils_read ON councils;
--> statement-breakpoint
CREATE POLICY councils_read ON councils FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
DROP POLICY IF EXISTS contacts_read ON decision_makers;
--> statement-breakpoint
CREATE POLICY contacts_read ON decision_makers FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
DROP POLICY IF EXISTS ingest_read ON pipeline_runs;
--> statement-breakpoint
CREATE POLICY ingest_read ON pipeline_runs FOR SELECT TO authenticated USING (public.is_super_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS raw_read ON raw_payloads;
--> statement-breakpoint
CREATE POLICY raw_read ON raw_payloads FOR SELECT TO authenticated USING (public.is_super_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS cursor_read ON ingest_cursors;
--> statement-breakpoint
CREATE POLICY cursor_read ON ingest_cursors FOR SELECT TO authenticated USING (public.is_super_admin());
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
