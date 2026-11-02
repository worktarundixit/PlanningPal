-- PlanningPal release schema for an empty Supabase database (eu-west-2).
-- Paste this whole file into the Supabase SQL editor on the postgres database.
-- It is ordered: Drizzle migrations 0000–0010 (including RLS), the UK LPA seed, then the pg_cron schedule.
-- Supabase already has the anon and authenticated roles. Do not run this on a database that already has these tables.
-- After it succeeds, store the same value as Vercel CRON_SECRET:
--   select vault.create_secret('<paste CRON_SECRET>', 'cron_secret', 'Bearer token for the Vercel ingest route');
-- The local Drizzle runner does not apply the pg_cron section.


-- 0000_init.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  tier text NOT NULL DEFAULT 'CATEGORY_3',
  plan_name text NOT NULL DEFAULT 'Team Plan',
  monthly_price text NOT NULL DEFAULT '£2,950',
  trade_specialisms text[] NOT NULL DEFAULT ARRAY[]::text[],
  target_territories text[] NOT NULL DEFAULT ARRAY[]::text[],
  operating_radius_miles integer NOT NULL DEFAULT 25,
  signal_alerts boolean NOT NULL DEFAULT true,
  daily_send_limit integer NOT NULL DEFAULT 30,
  warmup_enabled boolean NOT NULL DEFAULT true,
  tracking_domain text NOT NULL DEFAULT 'click.micraft-pipeline.co.uk',
  portal_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  job_title text NOT NULL DEFAULT 'Account owner',
  api_token text NOT NULL UNIQUE,
  password_hash text,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  email_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'Member',
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  permissions text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS councils (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  portal_type text NOT NULL DEFAULT 'UNKNOWN',
  base_url text NOT NULL DEFAULT '',
  county text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS planning_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  council_id uuid REFERENCES councils(id) ON DELETE SET NULL,
  application_ref text NOT NULL,
  composite_hash text NOT NULL,
  project_id text NOT NULL DEFAULT '',
  heading text NOT NULL DEFAULT '',
  proposal text NOT NULL DEFAULT '',
  value_from_m numeric(10, 3) NOT NULL DEFAULT 0,
  value_to_m numeric(10, 3) NOT NULL DEFAULT 0,
  est_value_from_m numeric(10, 3) NOT NULL DEFAULT 0,
  est_value_to_m numeric(10, 3) NOT NULL DEFAULT 0,
  site_raw_address text NOT NULL DEFAULT '',
  site_address text NOT NULL DEFAULT '',
  site_address_line1 text NOT NULL DEFAULT '',
  site_town text NOT NULL DEFAULT '',
  site_county text NOT NULL DEFAULT '',
  postcode text NOT NULL DEFAULT '',
  outcode text NOT NULL DEFAULT '',
  local_authority text NOT NULL DEFAULT '',
  county text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  project_stage text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Approved',
  primary_category text NOT NULL DEFAULT '',
  prop_type text NOT NULL DEFAULT '',
  publication_date text NOT NULL DEFAULT '',
  validation_date date,
  decision_date date,
  portal_url text NOT NULL DEFAULT '',
  client_applicant_contact text NOT NULL DEFAULT '',
  client_applicant text NOT NULL DEFAULT '',
  client_applicant_raw_address text NOT NULL DEFAULT '',
  client_applicant_phone text NOT NULL DEFAULT '',
  architect_agent_contact text NOT NULL DEFAULT '',
  architect_agent text NOT NULL DEFAULT '',
  architect_agent_raw_address text NOT NULL DEFAULT '',
  architect_agent_phone text NOT NULL DEFAULT '',
  architect_agent_email text NOT NULL DEFAULT '',
  source_index integer NOT NULL DEFAULT 0,
  source_record jsonb NOT NULL,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  geom geometry(Point, 4326),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS planning_applications_ref_idx ON planning_applications (application_ref);
CREATE UNIQUE INDEX IF NOT EXISTS planning_applications_hash_idx ON planning_applications (composite_hash);
CREATE INDEX IF NOT EXISTS planning_applications_outcode_idx ON planning_applications (outcode);
CREATE INDEX IF NOT EXISTS planning_applications_region_idx ON planning_applications (region);
CREATE INDEX IF NOT EXISTS planning_applications_value_idx ON planning_applications (value_to_m);
CREATE INDEX IF NOT EXISTS planning_applications_geom_idx ON planning_applications USING gist (geom);
CREATE TABLE IF NOT EXISTS decision_makers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES planning_applications(id) ON DELETE CASCADE,
  role text NOT NULL,
  firm_name text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  raw_address text NOT NULL DEFAULT '',
  postcode text NOT NULL DEFAULT '',
  company_number text,
  confidence_level text NOT NULL DEFAULT 'STUDIO_MATCH',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS saved_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES planning_applications(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS saved_schemes_user_app_idx ON saved_schemes (user_id, application_id);
CREATE TABLE IF NOT EXISTS crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES planning_applications(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'STAGE_1_COLD',
  intent_score integer NOT NULL DEFAULT 0,
  open_count integer NOT NULL DEFAULT 0,
  deck_downloaded boolean NOT NULL DEFAULT false,
  assignee_name text NOT NULL DEFAULT 'Unassigned',
  archived boolean NOT NULL DEFAULT false,
  last_opened_at timestamptz,
  sdr_notes text NOT NULL DEFAULT '',
  meeting_booked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_leads_client_stage_idx ON crm_leads (client_id, stage);
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  crm_lead_id uuid REFERENCES crm_leads(id) ON DELETE CASCADE,
  application_id uuid REFERENCES planning_applications(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  outcome text NOT NULL DEFAULT '',
  due_on date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  region text NOT NULL DEFAULT 'London',
  contacts integer NOT NULL DEFAULT 0,
  sent integer NOT NULL DEFAULT 0,
  open_rate text NOT NULL DEFAULT '—',
  reply_rate text NOT NULL DEFAULT '—',
  meetings integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sending_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  inboxes integer NOT NULL DEFAULT 0,
  health text NOT NULL DEFAULT 'Setup',
  status text NOT NULL DEFAULT 'Verifying',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS inbox_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  crm_lead_id uuid REFERENCES crm_leads(id) ON DELETE SET NULL,
  subject text NOT NULL DEFAULT '',
  preview text NOT NULL DEFAULT '',
  unread boolean NOT NULL DEFAULT true,
  time_label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES inbox_conversations(id) ON DELETE CASCADE,
  direction text NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  delivery_status text NOT NULL DEFAULT 'delivered',
  time_label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS intent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  crm_lead_id uuid REFERENCES crm_leads(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  actor_initials text NOT NULL DEFAULT '',
  action text NOT NULL,
  detail text NOT NULL DEFAULT '',
  hot boolean NOT NULL DEFAULT false,
  time_label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS persona_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stakeholder text NOT NULL DEFAULT 'Lead architect',
  angle text NOT NULL DEFAULT '',
  proof_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  when_label text NOT NULL,
  firm text NOT NULL,
  scheme text NOT NULL,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  issued_on text NOT NULL,
  number text NOT NULL,
  amount text NOT NULL,
  status text NOT NULL DEFAULT 'Paid'
);
CREATE TABLE IF NOT EXISTS telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 0001_demo_requests.sql
CREATE TABLE IF NOT EXISTS demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  trade text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 0002_ingest.sql
DROP INDEX IF EXISTS planning_applications_ref_idx;
CREATE UNIQUE INDEX IF NOT EXISTS planning_applications_authority_ref_idx ON planning_applications (local_authority, application_ref);
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  fetched integer NOT NULL DEFAULT 0,
  filtered_out integer NOT NULL DEFAULT 0,
  inserted integer NOT NULL DEFAULT 0,
  updated integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  csv_path text NOT NULL DEFAULT '',
  cursor_before text NOT NULL DEFAULT '',
  cursor_after text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  options jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS raw_payloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  source text NOT NULL,
  request_url text NOT NULL DEFAULT '',
  body jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ingest_cursors (
  source text PRIMARY KEY,
  last_different text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 0003_auth.sql
ALTER TABLE clients RENAME TO organisations;
ALTER TABLE users RENAME COLUMN client_id TO organisation_id;
ALTER TABLE team_members RENAME COLUMN client_id TO organisation_id;
ALTER TABLE custom_roles RENAME COLUMN client_id TO organisation_id;
ALTER TABLE crm_leads RENAME COLUMN client_id TO organisation_id;
ALTER TABLE activities RENAME COLUMN client_id TO organisation_id;
ALTER TABLE campaigns RENAME COLUMN client_id TO organisation_id;
ALTER TABLE sending_domains RENAME COLUMN client_id TO organisation_id;
ALTER TABLE inbox_conversations RENAME COLUMN client_id TO organisation_id;
ALTER TABLE intent_events RENAME COLUMN client_id TO organisation_id;
ALTER TABLE persona_templates RENAME COLUMN client_id TO organisation_id;
ALTER TABLE meetings RENAME COLUMN client_id TO organisation_id;
ALTER TABLE invoices RENAME COLUMN client_id TO organisation_id;
ALTER TABLE users ALTER COLUMN organisation_id DROP NOT NULL;
ALTER TABLE users ADD COLUMN org_role text;
UPDATE users SET org_role = 'owner' WHERE org_role IS NULL;
ALTER TABLE users ALTER COLUMN org_role SET NOT NULL;
ALTER TABLE users ALTER COLUMN org_role SET DEFAULT 'member';
ALTER TABLE users ADD COLUMN platform_role text;
UPDATE team_members SET role = lower(role) WHERE lower(role) IN ('owner', 'admin', 'member', 'viewer');
ALTER TABLE team_members ALTER COLUMN role SET DEFAULT 'member';
CREATE TABLE IF NOT EXISTS auth_user (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS auth_session (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_session_user_idx ON auth_session (user_id);
CREATE TABLE IF NOT EXISTS auth_account (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS auth_account_provider_idx ON auth_account (provider_id, account_id);
CREATE INDEX IF NOT EXISTS auth_account_user_idx ON auth_account (user_id);
CREATE TABLE IF NOT EXISTS auth_verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_verification_identifier_idx ON auth_verification (identifier);
ALTER TABLE users ADD COLUMN auth_user_id text UNIQUE REFERENCES auth_user(id) ON DELETE SET NULL;
ALTER TABLE saved_schemes ADD COLUMN organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE;
UPDATE saved_schemes AS saved
SET organisation_id = users.organisation_id
FROM users
WHERE saved.user_id = users.id AND saved.organisation_id IS NULL;
DELETE FROM saved_schemes WHERE organisation_id IS NULL;
ALTER TABLE saved_schemes ALTER COLUMN organisation_id SET NOT NULL;
DROP INDEX IF EXISTS saved_schemes_user_app_idx;
CREATE UNIQUE INDEX IF NOT EXISTS saved_schemes_org_app_idx ON saved_schemes (organisation_id, application_id);
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mail_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 0004_supabase_rls.sql
-- Supabase Auth owns identity. These Better Auth tables are unused.
DROP TABLE IF EXISTS auth_account CASCADE;
DROP TABLE IF EXISTS auth_session CASCADE;
DROP TABLE IF EXISTS auth_verification CASCADE;
DROP TABLE IF EXISTS auth_user CASCADE;
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
GRANT USAGE ON SCHEMA public TO anon, authenticated;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sending_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE councils ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS organisations_tenant ON organisations;
CREATE POLICY organisations_tenant ON organisations
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR id IN (SELECT public.current_organisation_ids()))
  WITH CHECK (public.is_super_admin() OR id IN (SELECT public.current_organisation_ids()));
DROP POLICY IF EXISTS users_tenant ON users;
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
DROP POLICY IF EXISTS planning_read ON planning_applications;
CREATE POLICY planning_read ON planning_applications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS councils_read ON councils;
CREATE POLICY councils_read ON councils FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS contacts_read ON decision_makers;
CREATE POLICY contacts_read ON decision_makers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS ingest_read ON pipeline_runs;
CREATE POLICY ingest_read ON pipeline_runs FOR SELECT TO authenticated USING (public.is_super_admin());
DROP POLICY IF EXISTS raw_read ON raw_payloads;
CREATE POLICY raw_read ON raw_payloads FOR SELECT TO authenticated USING (public.is_super_admin());
DROP POLICY IF EXISTS cursor_read ON ingest_cursors;
CREATE POLICY cursor_read ON ingest_cursors FOR SELECT TO authenticated USING (public.is_super_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 0005_campaign_provider.sql
CREATE TABLE IF NOT EXISTS campaign_provider_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciphertext text NOT NULL,
  hint text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS campaign_provider_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL UNIQUE REFERENCES organisations(id) ON DELETE CASCADE,
  provider_workspace_id text NOT NULL,
  status text NOT NULL DEFAULT 'mapped',
  tracking_domain text NOT NULL DEFAULT '',
  webhook_status text NOT NULL DEFAULT 'unknown',
  health text NOT NULL DEFAULT 'unknown',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS campaign_provider_workspace_idx ON campaign_provider_mappings (provider_workspace_id);
CREATE TABLE IF NOT EXISTS campaign_engine_links (
  campaign_id uuid PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  provider_campaign_id text NOT NULL
);
ALTER TABLE campaign_provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_provider_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_engine_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS campaign_provider_settings_admin ON campaign_provider_settings;
CREATE POLICY campaign_provider_settings_admin ON campaign_provider_settings
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS campaign_provider_mappings_admin ON campaign_provider_mappings;
CREATE POLICY campaign_provider_mappings_admin ON campaign_provider_mappings
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS campaign_engine_links_admin ON campaign_engine_links;
CREATE POLICY campaign_engine_links_admin ON campaign_engine_links
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_provider_settings, campaign_provider_mappings, campaign_engine_links TO authenticated;

-- 0006_workspace_isolation.sql
-- Tenant key on every table. organisation_id stays for existing queries and is copied into workspace_id.
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS slug text;
UPDATE organisations SET slug = id::text WHERE slug IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS organisations_slug_idx ON organisations (slug);
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  auth_user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, auth_user_id)
);
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
INSERT INTO workspace_members (workspace_id, user_id, auth_user_id, role)
SELECT organisation_id, id, auth_user_id, org_role
FROM users
WHERE organisation_id IS NOT NULL
  AND auth_user_id IS NOT NULL
  AND org_role IN ('owner', 'admin', 'member', 'viewer')
ON CONFLICT (workspace_id, auth_user_id) DO NOTHING;
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
ALTER TABLE inbox_messages ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE inbox_messages ADD COLUMN IF NOT EXISTS owner_user_id uuid;
ALTER TABLE inbox_messages ADD COLUMN IF NOT EXISTS shared boolean NOT NULL DEFAULT true;
UPDATE inbox_messages AS message
SET workspace_id = conversation.organisation_id
FROM inbox_conversations AS conversation
WHERE message.conversation_id = conversation.id
  AND message.workspace_id IS NULL;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS shared boolean NOT NULL DEFAULT false;
UPDATE activities SET shared = true WHERE type NOT IN ('note', 'task');
ALTER TABLE councils ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE decision_makers ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE mail_log ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE telemetry_events ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE raw_payloads ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE ingest_cursors ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE campaign_provider_settings ADD COLUMN IF NOT EXISTS workspace_id uuid;
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
DROP TRIGGER IF EXISTS sync_member_on_user ON users;
CREATE TRIGGER sync_member_on_user AFTER INSERT OR UPDATE OF organisation_id, org_role, auth_user_id ON users
FOR EACH ROW EXECUTE FUNCTION public.sync_workspace_member();
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
DROP POLICY IF EXISTS tenant_all ON campaigns;
DROP POLICY IF EXISTS tenant_read ON campaigns;
DROP POLICY IF EXISTS tenant_write ON campaigns;
CREATE POLICY tenant_read ON campaigns FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT public.member_workspace_ids()));
CREATE POLICY tenant_write ON campaigns FOR ALL TO authenticated
  USING (public.member_role(workspace_id) IN ('owner', 'admin', 'member'))
  WITH CHECK (public.member_role(workspace_id) IN ('owner', 'admin', 'member'));
DROP POLICY IF EXISTS organisations_tenant ON organisations;
CREATE POLICY organisations_tenant ON organisations FOR SELECT TO authenticated
  USING (id IN (SELECT public.member_workspace_ids()));
CREATE POLICY organisations_owner_write ON organisations FOR UPDATE TO authenticated
  USING (public.member_role(id) = 'owner')
  WITH CHECK (public.member_role(id) = 'owner');
DROP POLICY IF EXISTS users_tenant ON users;
CREATE POLICY users_read ON users FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT public.member_workspace_ids()) OR auth_user_id = auth.uid()::text);
CREATE POLICY users_write ON users FOR UPDATE TO authenticated
  USING (public.member_role(workspace_id) IN ('owner', 'admin') OR auth_user_id = auth.uid()::text)
  WITH CHECK (public.member_role(workspace_id) IN ('owner', 'admin', 'member', 'viewer') OR auth_user_id = auth.uid()::text);
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS members_read ON workspace_members;
CREATE POLICY members_read ON workspace_members FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT public.member_workspace_ids()));
DROP POLICY IF EXISTS members_write ON workspace_members;
CREATE POLICY members_write ON workspace_members FOR ALL TO authenticated
  USING (public.member_role(workspace_id) IN ('owner', 'admin'))
  WITH CHECK (public.member_role(workspace_id) IN ('owner', 'admin'));
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_provider_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_engine_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS campaign_provider_settings_admin ON campaign_provider_settings;
DROP POLICY IF EXISTS campaign_provider_mappings_admin ON campaign_provider_mappings;
DROP POLICY IF EXISTS campaign_engine_links_admin ON campaign_engine_links;
GRANT SELECT, INSERT, UPDATE, DELETE ON workspace_members, audit_log TO authenticated;

-- 0007_private_records.sql
-- Private notes, tasks, and inbox messages stay with their author unless shared.
-- Platform ingest tables are not readable through the Data API, including for staff.
DROP POLICY IF EXISTS ingest_read ON pipeline_runs;
DROP POLICY IF EXISTS raw_read ON raw_payloads;
DROP POLICY IF EXISTS cursor_read ON ingest_cursors;
DROP POLICY IF EXISTS tenant_read ON activities;
CREATE POLICY tenant_read ON activities FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT public.member_workspace_ids())
    AND (
      shared
      OR type = 'system'
      OR user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
    )
  );
DROP POLICY IF EXISTS tenant_write ON activities;
CREATE POLICY tenant_write ON activities FOR ALL TO authenticated
  USING (
    public.member_role(workspace_id) IN ('owner', 'admin', 'member')
    AND (
      shared
      OR type = 'system'
      OR user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
    )
  )
  WITH CHECK (
    public.member_role(workspace_id) IN ('owner', 'admin', 'member')
    AND user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
  );
DROP POLICY IF EXISTS tenant_read ON inbox_messages;
CREATE POLICY tenant_read ON inbox_messages FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT public.member_workspace_ids())
    AND (
      shared
      OR owner_user_id IS NULL
      OR owner_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
    )
  );
DROP POLICY IF EXISTS tenant_write ON inbox_messages;
CREATE POLICY tenant_write ON inbox_messages FOR ALL TO authenticated
  USING (
    public.member_role(workspace_id) IN ('owner', 'admin', 'member')
    AND (
      shared
      OR owner_user_id IS NULL
      OR owner_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
    )
  )
  WITH CHECK (
    public.member_role(workspace_id) IN ('owner', 'admin', 'member')
    AND (
      shared
      OR owner_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
    )
  );

-- 0008_onboarding.sql
-- Resumable onboarding lives on the user. Existing accounts stay finished so the command centre does not send them back through setup.
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step text NOT NULL DEFAULT 'done';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_skipped text[] NOT NULL DEFAULT ARRAY[]::text[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS checklist_dismissed boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS alerts_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS alert_frequency text NOT NULL DEFAULT 'immediate';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_onboarding_step_check;
ALTER TABLE users ADD CONSTRAINT users_onboarding_step_check CHECK (onboarding_step IN ('workspace', 'profile', 'icp', 'team', 'alerts', 'done'));
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_alert_frequency_check;
ALTER TABLE users ADD CONSTRAINT users_alert_frequency_check CHECK (alert_frequency IN ('immediate', 'daily', 'weekly', 'off'));
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS logo_url text NOT NULL DEFAULT '';
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS coverage text NOT NULL DEFAULT '';
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS project_types text[] NOT NULL DEFAULT ARRAY[]::text[];
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS value_ranges text[] NOT NULL DEFAULT ARRAY[]::text[];
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS riba_stages text[] NOT NULL DEFAULT ARRAY[]::text[];
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS council_targets text[] NOT NULL DEFAULT ARRAY[]::text[];

-- 0009_lead_fetches.sql
-- Workspace-scoped first fetch of recent applications. The shared catalogue stays global; membership decides who sees a row.
CREATE TABLE IF NOT EXISTS workspace_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES planning_applications(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, application_id)
);
CREATE INDEX IF NOT EXISTS workspace_leads_workspace_idx ON workspace_leads (workspace_id, created_at);
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
ALTER TABLE lead_fetches DROP CONSTRAINT IF EXISTS lead_fetches_status_check;
ALTER TABLE lead_fetches ADD CONSTRAINT lead_fetches_status_check CHECK (status IN ('running', 'succeeded', 'empty', 'partial'));
ALTER TABLE workspace_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_fetches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_read ON workspace_leads;
CREATE POLICY tenant_read ON workspace_leads FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT public.member_workspace_ids()));
DROP POLICY IF EXISTS tenant_write ON workspace_leads;
CREATE POLICY tenant_write ON workspace_leads FOR ALL TO authenticated
  USING (public.member_role(workspace_id) IN ('owner', 'admin', 'member'))
  WITH CHECK (public.member_role(workspace_id) IN ('owner', 'admin', 'member'));
DROP POLICY IF EXISTS tenant_read ON lead_fetches;
CREATE POLICY tenant_read ON lead_fetches FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT public.member_workspace_ids()));
DROP POLICY IF EXISTS tenant_write ON lead_fetches;
CREATE POLICY tenant_write ON lead_fetches FOR ALL TO authenticated
  USING (public.member_role(workspace_id) IN ('owner', 'admin', 'member'))
  WITH CHECK (public.member_role(workspace_id) IN ('owner', 'admin', 'member'));
GRANT SELECT, INSERT, UPDATE, DELETE ON workspace_leads, lead_fetches TO authenticated;

-- 0010_local_planning_authorities.sql
-- Authoritative UK local planning authorities. Global catalogue: workspace_id stays null.
CREATE TABLE IF NOT EXISTS local_planning_authorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid,
  name text NOT NULL,
  nation text NOT NULL,
  region text NOT NULL DEFAULT '',
  county text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  gss_code text NOT NULL,
  lpa_gss_code text NOT NULL DEFAULT '',
  planit_area_name text NOT NULL DEFAULT '',
  planit_area_id integer,
  planit_covered text NOT NULL DEFAULT '',
  planit_scraper_type text NOT NULL DEFAULT '',
  planit_latest_app_date date,
  planit_total_apps integer,
  planning_portal_url text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  status text NOT NULL,
  end_date date,
  successor text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  coverage text NOT NULL DEFAULT '',
  planit_query_areas text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS local_planning_authorities_gss_idx ON local_planning_authorities (gss_code);
ALTER TABLE local_planning_authorities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lpa_read ON local_planning_authorities;
CREATE POLICY lpa_read ON local_planning_authorities FOR SELECT TO authenticated USING (true);
GRANT SELECT ON local_planning_authorities TO authenticated;

-- UK LPA master seed (423 authorities)
INSERT INTO local_planning_authorities (name, nation, region, county, type, gss_code, lpa_gss_code, planit_area_name, planit_area_id, planit_covered, planit_scraper_type, planit_latest_app_date, planit_total_apps, planning_portal_url, website, status, end_date, successor, notes, coverage, planit_query_areas)
VALUES
('Adur District Council', 'England', 'South East', 'West Sussex', 'district', 'E07000223', 'E60000281', 'Adur', 245, 'yes (via shared service)', '', null, null, 'https://planning.adur-worthing.gov.uk/online-applications/search.do?action=advanced', 'https://www.adur-worthing.gov.uk', 'active', null, '', 'applications under PlanIt area ''Adur and Worthing'' (id 449, Idox)', 'shared', ARRAY['Adur and Worthing']::text[]),
('Amber Valley Borough Council', 'England', 'East Midlands', 'Derbyshire', 'district', 'E07000032', 'E60000077', 'Amber Valley', 72, 'yes', 'Custom', '2026-10-29', 37720, 'https://www.ambervalley.gov.uk/planning/development-management/view-a-planning-application/', 'https://www.ambervalley.gov.uk', 'active', null, '', '', 'available', ARRAY['Amber Valley']::text[]),
('Arun District Council', 'England', 'South East', 'West Sussex', 'district', 'E07000224', 'E60000282', 'Arun', 246, 'yes', 'Ocella', '2026-10-24', 53601, 'https://www1.arun.gov.uk/aplanning/OcellaWeb/planningSearch', 'https://www.arun.gov.uk', 'active', null, '', '', 'available', ARRAY['Arun']::text[]),
('Ashfield District Council', 'England', 'East Midlands', 'Nottinghamshire', 'district', 'E07000170', 'E60000106', 'Ashfield', 197, 'yes', 'CivicaJson', '2026-10-30', 24462, 'https://planning.ashfield.gov.uk/planning-applications/search-applications/', 'https://www.ashfield.gov.uk', 'active', null, '', '', 'available', ARRAY['Ashfield']::text[]),
('Ashford Borough Council', 'England', 'South East', 'Kent', 'district', 'E07000105', 'E60000253', 'Ashford', 138, 'yes', 'Arcus', '2026-10-27', 59935, 'https://ashfordboroughcouncil.my.site.com/pr/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.ashford.gov.uk', 'active', null, '', '', 'available', ARRAY['Ashford']::text[]),
('Babergh District Council', 'England', 'East of England', 'Suffolk', 'district', 'E07000200', 'E60000183', 'Babergh', 222, 'yes (via shared service)', '', null, null, 'https://planning.baberghmidsuffolk.gov.uk/online-applications/search.do?action=advanced', 'https://www.babergh.gov.uk', 'active', null, '', 'applications under PlanIt area ''Babergh Mid Suffolk'' (id 511, Idox)', 'shared', ARRAY['Babergh Mid Suffolk']::text[]),
('Barnsley Metropolitan Borough Council', 'England', 'Yorkshire and the Humber', '', 'metropolitan borough', 'E08000016', 'E60000064', 'Barnsley', 273, 'yes', 'PlanningExplorer', '2026-10-28', 35151, 'https://planningexplorer.barnsley.gov.uk/Home/AdvanceSearch', 'https://www.barnsley.gov.uk', 'active', null, '', '', 'available', ARRAY['Barnsley']::text[]),
('Basildon Borough Council', 'England', 'East of England', 'Essex', 'district', 'E07000066', 'E60000154', 'Basildon', 99, 'yes', 'Idox', '2026-10-30', 29526, 'https://planning.basildon.gov.uk/online-applications/search.do?action=advanced', 'https://www.basildon.gov.uk', 'active', null, '', '', 'available', ARRAY['Basildon']::text[]),
('Basingstoke and Deane Borough Council', 'England', 'South East', 'Hampshire', 'district', 'E07000084', 'E60000242', 'Basingstoke', 117, 'yes', 'Idox', '2026-10-29', 62336, 'https://planning.basingstoke.gov.uk/online-applications/search.do?action=advanced', 'https://www.basingstoke.gov.uk', 'active', null, '', '', 'available', ARRAY['Basingstoke']::text[]),
('Bassetlaw District Council', 'England', 'East Midlands', 'Nottinghamshire', 'district', 'E07000171', 'E60000107', 'Bassetlaw', 198, 'yes', 'Idox', '2026-10-28', 31510, 'https://publicaccess.bassetlaw.gov.uk/online-applications/search.do?action=advanced', 'https://www.bassetlaw.gov.uk', 'active', null, '', '', 'available', ARRAY['Bassetlaw']::text[]),
('Bath and North East Somerset Council', 'England', 'South West', '', 'unitary', 'E06000022', 'E60000288', 'Bath', 22, 'yes', 'Custom', '2026-10-01', 97655, 'https://www.bathnes.gov.uk/webforms/planning/search.html#advancedSearch', 'https://www.bathnes.gov.uk', 'active', null, '', '', 'available', ARRAY['Bath']::text[]),
('Bedford Borough Council', 'England', 'East of England', '', 'unitary', 'E06000055', 'E60000143', 'Bedford', 55, 'yes', 'Idox', '2026-10-08', 69482, 'https://publicaccess.bedford.gov.uk/online-applications/search.do?action=advanced', 'https://www.bedford.gov.uk', 'active', null, '', '', 'available', ARRAY['Bedford']::text[]),
('Birmingham City Council', 'England', 'West Midlands', '', 'metropolitan borough', 'E08000025', 'E60000130', 'Birmingham', 282, 'yes', 'EnterpriseStore', '2026-10-28', 191571, 'https://planning.birmingham.gov.uk/NECSWS/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch', 'https://www.birmingham.gov.uk', 'active', null, '', '', 'available', ARRAY['Birmingham']::text[]),
('Blaby District Council', 'England', 'East Midlands', 'Leicestershire', 'district', 'E07000129', 'E60000085', 'Blaby', 162, 'yes', 'Idox', '2026-10-28', 25398, 'https://pa.blaby.gov.uk/online-applications/search.do?action=advanced', 'https://www.blaby.gov.uk', 'active', null, '', '', 'available', ARRAY['Blaby']::text[]),
('Blackburn with Darwen Borough Council', 'England', 'North West', '', 'unitary', 'E06000008', 'E60000013', 'Blackburn', 8, 'yes', 'Tascomi', '2026-06-08', 32072, 'https://planning.blackburn.gov.uk/Northgate/PlanningExplorer/GeneralSearch.aspx', 'https://www.blackburn.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-06-08)', 'available', ARRAY['Blackburn']::text[]),
('Blackpool Borough Council', 'England', 'North West', '', 'unitary', 'E06000009', 'E60000014', 'Blackpool', 9, 'yes', 'Idox', '2026-09-22', 18160, 'https://idoxpa.blackpool.gov.uk/online-applications/search.do?action=advanced', 'https://www.blackpool.gov.uk', 'active', null, '', '', 'available', ARRAY['Blackpool']::text[]),
('Bolsover District Council', 'England', 'East Midlands', 'Derbyshire', 'district', 'E07000033', 'E60000078', 'Bolsover', 73, 'yes', 'Idox', '2026-10-01', 17143, 'https://publicaccess.bolsover.gov.uk/online-applications/search.do?action=advanced', 'https://www.bolsover.gov.uk', 'active', null, '', '', 'available', ARRAY['Bolsover']::text[]),
('Bolton Metropolitan Borough Council', 'England', 'North West', '', 'metropolitan borough', 'E08000001', 'E60000025', 'Bolton', 258, 'yes', 'Idox', '2026-10-27', 61504, 'https://paplanning.bolton.gov.uk/online-applications/search.do?action=advanced&searchType=Application', 'https://www.bolton.gov.uk', 'active', null, '', '', 'available', ARRAY['Bolton']::text[]),
('Borough Council of King''s Lynn and West Norfolk', 'England', 'East of England', 'Norfolk', 'district', 'E07000146', 'E60000179', 'Kings Lynn', 179, 'yes', 'Idox', '2026-10-26', 67231, 'https://online.west-norfolk.gov.uk/online-applications/search.do?action=advanced', 'https://www.west-norfolk.gov.uk', 'active', null, '', '', 'available', ARRAY['Kings Lynn']::text[]),
('Boston Borough Council', 'England', 'East Midlands', 'Lincolnshire', 'district', 'E07000136', 'E60000092', 'Boston', 169, 'yes', 'Custom', '2026-09-28', 17704, 'https://www.boston.gov.uk/planningapplicationsearch', 'https://www.boston.gov.uk', 'active', null, '', '', 'available', ARRAY['Boston']::text[]),
('Bournemouth, Christchurch and Poole Council', 'England', 'South West', '', 'unitary', 'E06000058', 'E60000289', 'BCP', 516, 'yes', 'Atrium', '2026-10-29', 151828, 'https://planning.bcpcouncil.gov.uk/Search/Advanced/', 'https://www.bcpcouncil.gov.uk', 'active', null, '', '', 'available', ARRAY['BCP']::text[]),
('Bracknell Forest Council', 'England', 'South East', '', 'unitary', 'E06000036', 'E60000221', 'Bracknell', 36, 'yes', 'Arcus', '2026-10-30', 33911, 'https://publicaccess.bracknell-forest.gov.uk/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.bracknell-forest.gov.uk/', 'active', null, '', '', 'available', ARRAY['Bracknell']::text[]),
('Braintree District Council', 'England', 'East of England', 'Essex', 'district', 'E07000067', 'E60000155', 'Braintree', 100, 'yes', 'Idox', '2023-11-29', 53960, 'https://publicaccess.braintree.gov.uk/online-applications/search.do?action=advanced', 'https://www.braintree.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2023-11-29)', 'available', ARRAY['Braintree']::text[]),
('Breckland District Council', 'England', 'East of England', 'Norfolk', 'district', 'E07000143', 'E60000176', 'Breckland', 176, 'yes', 'Tascomi', '2026-07-06', 51940, 'https://publicportal.breckland.gov.uk/planning/index.html?fa=search', 'https://www.breckland.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-06)', 'available', ARRAY['Breckland']::text[]),
('Brentwood Borough Council', 'England', 'East of England', 'Essex', 'district', 'E07000068', 'E60000156', 'Brentwood', 101, 'yes', 'Idox', '2026-10-29', 38237, 'https://publicaccess.brentwood.gov.uk/online-applications/search.do?action=advanced', 'https://www.brentwood.gov.uk', 'active', null, '', '', 'available', ARRAY['Brentwood']::text[]),
('Brighton and Hove City Council', 'England', 'South East', '', 'unitary', 'E06000043', 'E60000222', 'Brighton', 43, 'yes', 'Idox', '2026-02-27', 97926, 'https://planningapps.brighton-hove.gov.uk/online-applications/search.do?action=advanced', 'https://www.brighton-hove.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-02-27)', 'available', ARRAY['Brighton']::text[]),
('Bristol City Council', 'England', 'South West', '', 'unitary', 'E06000023', 'E60000290', 'Bristol', 23, 'yes', 'Idox', '2026-09-07', 134820, 'https://pa.bristol.gov.uk/online-applications/search.do?action=advanced', 'https://www.bristol.gov.uk', 'active', null, '', '', 'available', ARRAY['Bristol']::text[]),
('Broadland District Council', 'England', 'East of England', 'Norfolk', 'district', 'E07000144', 'E60000177', 'Broadland', 177, 'yes (via shared service)', '', null, null, '', 'https://www.broadland.gov.uk', 'active', null, '', 'applications under PlanIt area ''South Norfolk Broadland'' (id 521, Idox)', 'shared', ARRAY['South Norfolk Broadland']::text[]),
('Broads Authority', 'England', 'East of England', '', 'national park', 'E26000007', 'E60000326', 'Broads', 360, 'yes', 'Idox', '2026-09-14', 9457, 'https://planning.broads-authority.gov.uk/online-applications/search.do?action=advanced', 'http://www.broads-authority.gov.uk/broads-authority', 'active', null, '', '', 'available', ARRAY['Broads']::text[]),
('Bromsgrove District Council', 'England', 'West Midlands', 'Worcestershire', 'district', 'E07000234', 'E60000137', 'Bromsgrove', 252, 'yes (via shared service)', '', null, null, 'https://publicaccess.bromsgroveandredditch.gov.uk/online-applications/search.do?action=advanced', 'https://www.bromsgrove.gov.uk', 'active', null, '', 'applications under PlanIt area ''Bromsgrove Redditch'' (id 512, Idox)', 'shared', ARRAY['Bromsgrove Redditch']::text[]),
('Broxbourne Borough Council', 'England', 'East of England', 'Hertfordshire', 'district', 'E07000095', 'E60000166', 'Broxbourne', 128, 'yes', 'EnterpriseStore', '2026-10-29', 28904, 'https://planning.broxbourne.gov.uk/LPAssure/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch', 'https://www.broxbourne.gov.uk', 'active', null, '', '', 'available', ARRAY['Broxbourne']::text[]),
('Broxtowe Borough Council', 'England', 'East Midlands', 'Nottinghamshire', 'district', 'E07000172', 'E60000108', 'Broxtowe', 199, 'yes', 'Idox', '2026-10-23', 24644, 'https://publicaccess.broxtowe.gov.uk/online-applications/search.do?action=advanced', 'https://www.broxtowe.gov.uk', 'active', null, '', '', 'available', ARRAY['Broxtowe']::text[]),
('Buckinghamshire Council', 'England', 'South East', '', 'unitary', 'E06000060', 'E60000331', 'Buckinghamshire', 327, 'yes', 'Idox', '2026-10-30', 272832, 'https://publicaccess.buckinghamshire.gov.uk/online-applications/search.do?action=advanced', 'https://www.buckinghamshire.gov.uk/', 'active', null, '', '', 'available', ARRAY['Buckinghamshire']::text[]),
('Burnley Borough Council', 'England', 'North West', 'Lancashire', 'district', 'E07000117', 'E60000035', 'Burnley', 150, 'yes', 'Arcus', '2026-10-27', 16188, 'https://burnleycouncil.my.site.com/pr/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.burnley.gov.uk', 'active', null, '', '', 'available', ARRAY['Burnley']::text[]),
('Bury Metropolitan Borough Council', 'England', 'North West', '', 'metropolitan borough', 'E08000002', 'E60000026', 'Bury', 259, 'yes', 'Idox', '2026-10-22', 35403, 'https://planning.bury.gov.uk/online-applications/search.do?action=advanced', 'https://www.bury.gov.uk', 'active', null, '', '', 'available', ARRAY['Bury']::text[]),
('Calderdale Metropolitan Borough Council', 'England', 'Yorkshire and the Humber', '', 'metropolitan borough', 'E08000033', 'E60000069', 'Calderdale', 290, 'yes', 'Idox', '2026-10-26', 53379, 'https://portal.calderdale.gov.uk/online-applications/search.do?action=advanced', 'https://www.calderdale.gov.uk', 'active', null, '', '', 'available', ARRAY['Calderdale']::text[]),
('Cambridge City Council', 'England', 'East of England', 'Cambridgeshire', 'district', 'E07000008', 'E60000149', 'Cambridge', 61, 'yes', 'Idox', '2026-10-29', 62907, 'https://applications.greatercambridgeplanning.org/online-applications/search.do?action=advanced', 'https://www.cambridge.gov.uk', 'active', null, '', '', 'available', ARRAY['Cambridge']::text[]),
('Cannock Chase District Council', 'England', 'West Midlands', 'Staffordshire', 'district', 'E07000192', 'E60000117', 'Cannock Chase', 214, 'yes', 'Agile', '2026-10-23', 15631, 'https://planning.agileapplications.co.uk/cannock/search-applications/', 'https://www.cannockchasedc.gov.uk', 'active', null, '', '', 'available', ARRAY['Cannock Chase']::text[]),
('Canterbury City Council', 'England', 'South East', 'Kent', 'district', 'E07000106', 'E60000254', 'Canterbury', 139, 'yes', 'Idox', '2026-10-30', 66170, 'https://pa.canterbury.gov.uk/online-applications/search.do?action=advanced', 'https://www.canterbury.gov.uk', 'active', null, '', '', 'available', ARRAY['Canterbury']::text[]),
('Castle Point Borough Council', 'England', 'East of England', 'Essex', 'district', 'E07000069', 'E60000157', 'Castle Point', 102, 'yes', 'Idox', '2026-10-28', 22028, 'https://publicaccess.castlepoint.gov.uk/online-applications/search.do?action=advanced', 'https://www.castlepoint.gov.uk', 'active', null, '', '', 'available', ARRAY['Castle Point']::text[]);

INSERT INTO local_planning_authorities (name, nation, region, county, type, gss_code, lpa_gss_code, planit_area_name, planit_area_id, planit_covered, planit_scraper_type, planit_latest_app_date, planit_total_apps, planning_portal_url, website, status, end_date, successor, notes, coverage, planit_query_areas)
VALUES
('Central Bedfordshire Council', 'England', 'East of England', '', 'unitary', 'E06000056', 'E60000144', 'Central Bedfordshire', 56, 'yes', 'Custom', '2026-10-28', 83716, 'https://plantech.centralbedfordshire.gov.uk/PLANTECH/DCWebPages/acolnetcgi.gov?ACTION=UNWRAP&RIPNAME=Root.pgesearch', 'https://www.centralbedfordshire.gov.uk', 'active', null, '', '', 'available', ARRAY['Central Bedfordshire']::text[]),
('Charnwood Borough Council', 'England', 'East Midlands', 'Leicestershire', 'district', 'E07000130', 'E60000086', 'Charnwood', 163, 'yes', 'EnterpriseStore', '2026-10-19', 66383, 'https://planningexplorer.charnwood.gov.uk/Assure/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch', 'https://www.charnwood.gov.uk', 'active', null, '', '', 'available', ARRAY['Charnwood']::text[]),
('Chelmsford City Council', 'England', 'East of England', 'Essex', 'district', 'E07000070', 'E60000158', 'Chelmsford', 103, 'yes', 'Idox', '2026-10-29', 73566, 'https://publicaccess.chelmsford.gov.uk/online-applications/search.do?action=advanced', 'https://www.chelmsford.gov.uk', 'active', null, '', '', 'available', ARRAY['Chelmsford']::text[]),
('Cheltenham Borough Council', 'England', 'South West', 'Gloucestershire', 'district', 'E07000078', 'E60000308', 'Cheltenham', 111, 'yes', 'Idox', '2026-10-29', 46752, 'https://publicaccess.cheltenham.gov.uk/online-applications/search.do?action=advanced', 'https://www.cheltenham.gov.uk', 'active', null, '', '', 'available', ARRAY['Cheltenham']::text[]),
('Cherwell District Council', 'England', 'South East', 'Oxfordshire', 'district', 'E07000177', 'E60000265', 'Cherwell', 204, 'yes', 'Atrium', '2026-10-29', 76991, 'https://planningregister.cherwell.gov.uk/Search/Advanced/', 'https://www.cherwell-dc.gov.uk', 'active', null, '', '', 'available', ARRAY['Cherwell']::text[]),
('Cheshire East Council', 'England', 'North West', '', 'unitary', 'E06000049', 'E60000015', 'Cheshire East', 49, 'yes', 'Tascomi', '2026-07-06', 132365, 'https://pa.cheshireeast.gov.uk/planning/index.html?fa=search', 'https://www.cheshireeast.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-06)', 'available', ARRAY['Cheshire East']::text[]),
('Cheshire West and Chester Council', 'England', 'North West', '', 'unitary', 'E06000050', 'E60000016', 'Chester', 50, 'yes', 'Idox', '2026-10-30', 110405, 'https://pa.cheshirewestandchester.gov.uk/online-applications/search.do?action=advanced', 'https://www.cheshirewestandchester.gov.uk', 'active', null, '', '', 'available', ARRAY['Chester']::text[]),
('Chesterfield Borough Council', 'England', 'East Midlands', 'Derbyshire', 'district', 'E07000034', 'E60000079', 'Chesterfield', 74, 'yes', 'Idox', '2026-10-28', 21611, 'https://publicaccess.chesterfield.gov.uk/online-applications/search.do?action=advanced', 'https://www.chesterfield.gov.uk', 'active', null, '', '', 'available', ARRAY['Chesterfield']::text[]),
('Chichester District Council', 'England', 'South East', 'West Sussex', 'district', 'E07000225', 'E60000283', 'Chichester', 247, 'yes', 'Idox', '2026-10-27', 65128, 'https://publicaccess.chichester.gov.uk/online-applications/search.do?action=advanced', 'https://www.chichester.gov.uk', 'active', null, '', '', 'available', ARRAY['Chichester']::text[]),
('Chorley Borough Council', 'England', 'North West', 'Lancashire', 'district', 'E07000118', 'E60000036', 'Chorley', 151, 'yes', 'Idox', '2026-10-27', 29349, 'https://planning.chorley.gov.uk/online-applications/search.do?action=advanced', 'https://www.chorley.gov.uk', 'active', null, '', '', 'available', ARRAY['Chorley']::text[]),
('City of Bradford Metropolitan District Council', 'England', 'Yorkshire and the Humber', '', 'metropolitan borough', 'E08000032', 'E60000068', 'Bradford', 289, 'yes', 'Idox', '2026-09-14', 128622, 'https://planning.bradford.gov.uk/online-applications/search.do?action=advanced', 'https://www.bradford.gov.uk', 'active', null, '', '', 'available', ARRAY['Bradford']::text[]),
('City of Lincoln Council', 'England', 'East Midlands', 'Lincolnshire', 'district', 'E07000138', 'E60000094', 'Lincoln', 171, 'yes', 'Idox', '2026-10-26', 22729, 'https://planning.lincoln.gov.uk/online-applications/search.do?action=advanced', 'https://www.lincoln.gov.uk', 'active', null, '', '', 'available', ARRAY['Lincoln']::text[]),
('City of London Corporation', 'England', 'London', '', 'city of london', 'E09000001', 'E60000189', 'City', 294, 'yes', 'Idox', '2026-10-30', 28715, 'https://www.planning2.cityoflondon.gov.uk/online-applications/search.do?action=advanced', 'https://www.cityoflondon.gov.uk/', 'active', null, '', '', 'available', ARRAY['City']::text[]),
('City of Westminster', 'England', 'London', '', 'london borough', 'E09000033', 'E60000201', 'Westminster', 326, 'yes', 'Idox', '2026-10-23', 235240, 'https://idoxpa.westminster.gov.uk/online-applications/search.do?action=advanced', 'https://www.westminster.gov.uk', 'active', null, '', '', 'available', ARRAY['Westminster']::text[]),
('City of Wolverhampton Council', 'England', 'West Midlands', '', 'metropolitan borough', 'E08000031', 'E60000136', 'Wolverhampton', 288, 'yes', 'Idox', '2026-10-30', 35684, 'https://planningonline.wolverhampton.gov.uk/online-applications/search.do?action=advanced', 'https://www.wolverhampton.gov.uk', 'active', null, '', '', 'available', ARRAY['Wolverhampton']::text[]),
('City of York Council', 'England', 'Yorkshire and the Humber', '', 'unitary', 'E06000014', 'E60000056', 'York', 14, 'yes', 'Idox', '2026-10-29', 64425, 'https://planningaccess.york.gov.uk/online-applications/search.do?action=advanced', 'https://www.york.gov.uk', 'active', null, '', '', 'available', ARRAY['York']::text[]),
('Colchester City Council', 'England', 'East of England', 'Essex', 'district', 'E07000071', 'E60000159', 'Colchester', 104, 'yes', 'Custom', '2026-10-28', 53613, 'https://www.colchester.gov.uk/planning-search/', 'https://www.colchester.gov.uk', 'active', null, '', '', 'available', ARRAY['Colchester']::text[]),
('Cornwall Council', 'England', 'South West', '', 'unitary', 'E06000052', 'E60000291', 'Cornwall', 52, 'yes', 'Idox', '2026-10-30', 316669, 'https://planning.cornwall.gov.uk/online-applications/search.do?action=advanced', 'https://www.cornwall.gov.uk', 'active', null, '', '', 'available', ARRAY['Cornwall']::text[]),
('Cotswold District Council', 'England', 'South West', 'Gloucestershire', 'district', 'E07000079', 'E60000309', 'Cotswold', 112, 'yes', 'Idox', '2026-10-30', 76102, 'https://publicaccess.cotswold.gov.uk/online-applications/search.do?action=advanced', 'https://www.cotswold.gov.uk', 'active', null, '', '', 'available', ARRAY['Cotswold']::text[]),
('Council of the Isles of Scilly', 'England', 'South West', '', 'unitary', 'E06000053', 'E60000293', 'Scilly Isles', 53, 'yes', 'Custom', '2026-10-30', 1955, 'https://www.scilly.gov.uk/planning-development/planning-applications', 'https://www.scilly.gov.uk', 'active', null, '', '', 'available', ARRAY['Scilly Isles']::text[]),
('Coventry City Council', 'England', 'West Midlands', '', 'metropolitan borough', 'E08000026', 'E60000131', 'Coventry', 283, 'yes', 'Tascomi', '2026-07-07', 67438, 'https://planandregulatory.coventry.gov.uk/planning/index.html?fa=search', 'https://www.coventry.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-07)', 'available', ARRAY['Coventry']::text[]),
('Crawley Borough Council', 'England', 'South East', 'West Sussex', 'district', 'E07000226', 'E60000284', 'Crawley', 248, 'yes', 'Atrium', '2026-10-29', 22408, 'https://planningregister.crawley.gov.uk/Search/Advanced/#AdvancedSearchTab', 'https://www.crawley.gov.uk', 'active', null, '', '', 'available', ARRAY['Crawley']::text[]),
('Cumberland Council', 'England', 'North West', '', 'unitary', 'E06000063', 'E60000334', 'Cumberland', 522, 'yes (via legacy/child areas)', '', null, null, '', 'https://www.cumberland.gov.uk/', 'active', null, '', 'applications under PlanIt areas: Allerdale (Arcus), Carlisle (Idox), Copeland (Custom)', 'legacy', ARRAY['Allerdale','Carlisle','Copeland']::text[]),
('Dacorum Borough Council', 'England', 'East of England', 'Hertfordshire', 'district', 'E07000096', 'E60000167', 'Dacorum', 129, 'yes', 'Idox', '2026-10-30', 63796, 'https://planning.dacorum.gov.uk/publicaccess/search.do?action=advanced', 'https://www.dacorum.gov.uk', 'active', null, '', '', 'available', ARRAY['Dacorum']::text[]),
('Darlington Borough Council', 'England', 'North East', '', 'unitary', 'E06000005', 'E60000002', 'Darlington', 5, 'yes', 'Idox', '2026-10-27', 27540, 'https://publicaccess.darlington.gov.uk/online-applications/search.do?action=advanced', 'https://www.darlington.gov.uk', 'active', null, '', '', 'available', ARRAY['Darlington']::text[]),
('Dartford Borough Council', 'England', 'South East', 'Kent', 'district', 'E07000107', 'E60000255', 'Dartford', 140, 'yes', 'Idox', '2026-10-29', 29790, 'https://publicaccess.dartford.gov.uk/online-applications/search.do?action=advanced', 'https://www.dartford.gov.uk', 'active', null, '', '', 'available', ARRAY['Dartford']::text[]),
('Dartmoor National Park Authority', 'England', 'South West', '', 'national park', 'E26000001', 'E60000318', 'Dartmoor', 354, 'yes', 'Tascomi', '2026-07-06', 19629, 'https://dartmoor-online.tascomi.com/planning/index.html?fa=search', 'https://www.dartmoor.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-06)', 'available', ARRAY['Dartmoor']::text[]),
('Derby City Council', 'England', 'East Midlands', '', 'unitary', 'E06000015', 'E60000073', 'Derby', 15, 'yes', 'Idox', '2026-10-29', 43125, 'https://eplanning.derby.gov.uk/online-applications/search.do?action=advanced', 'https://www.derby.gov.uk', 'active', null, '', '', 'available', ARRAY['Derby']::text[]),
('Derbyshire Dales District Council', 'England', 'East Midlands', 'Derbyshire', 'district', 'E07000035', 'E60000080', 'Derbyshire Dales', 75, 'yes', 'Idox', '2026-09-14', 25400, 'https://planning.derbyshiredales.gov.uk/online-applications/search.do?action=advanced', 'https://www.derbyshiredales.gov.uk', 'active', null, '', '', 'available', ARRAY['Derbyshire Dales']::text[]),
('Doncaster Metropolitan Borough Council', 'England', 'Yorkshire and the Humber', '', 'metropolitan borough', 'E08000017', 'E60000065', 'Doncaster', 274, 'yes', 'Idox', '2026-10-29', 60787, 'https://planning.doncaster.gov.uk/online-applications/search.do?action=advanced', 'https://www.doncaster.gov.uk', 'active', null, '', '', 'available', ARRAY['Doncaster']::text[]),
('Dorset Council', 'England', 'South West', '', 'unitary', 'E06000059', 'E60000292', 'Dorset', 332, 'yes', 'CCED', '2026-10-30', 188621, 'https://planning.dorsetcouncil.gov.uk/advsearch.aspx', 'https://www.dorsetcouncil.gov.uk', 'active', null, '', '', 'available', ARRAY['Dorset']::text[]),
('Dover District Council', 'England', 'South East', 'Kent', 'district', 'E07000108', 'E60000256', 'Dover', 141, 'yes', 'Idox', '2026-10-29', 45268, 'https://publicaccess.dover.gov.uk/online-applications/search.do?action=advanced', 'https://www.dover.gov.uk', 'active', null, '', '', 'available', ARRAY['Dover']::text[]),
('Dudley Metropolitan Borough Council', 'England', 'West Midlands', '', 'metropolitan borough', 'E08000027', 'E60000132', 'Dudley', 284, 'yes', 'Agile', '2026-10-29', 55210, 'https://planning.agileapplications.co.uk/dudley/search-applications/', 'https://www.dudley.gov.uk', 'active', null, '', '', 'available', ARRAY['Dudley']::text[]),
('Durham County Council', 'England', 'North East', '', 'unitary', 'E06000047', 'E60000001', 'Durham', 47, 'yes', 'Idox', '2026-10-27', 119387, 'https://publicaccess.durham.gov.uk/online-applications/search.do?action=advanced', 'https://www.durham.gov.uk', 'active', null, '', '', 'available', ARRAY['Durham']::text[]),
('East Cambridgeshire District Council', 'England', 'East of England', 'Cambridgeshire', 'district', 'E07000009', 'E60000150', 'East Cambridgeshire', 62, 'yes', 'Idox', '2026-10-27', 41009, 'https://pa.eastcambs.gov.uk/online-applications/search.do?action=advanced', 'https://www.eastcambs.gov.uk', 'active', null, '', '', 'available', ARRAY['East Cambridgeshire']::text[]),
('East Devon District Council', 'England', 'South West', 'Devon', 'district', 'E07000040', 'E60000300', 'East Devon', 80, 'yes', 'Idox', '2026-10-30', 65766, 'https://planning.eastdevon.gov.uk/online-applications/search.do?action=advanced', 'https://eastdevon.gov.uk', 'active', null, '', '', 'available', ARRAY['East Devon']::text[]),
('East Hampshire District Council', 'England', 'South East', 'Hampshire', 'district', 'E07000085', 'E60000243', 'East Hampshire', 118, 'yes', 'Idox Tascomi', '2026-07-08', 48275, 'https://publicaccess.easthants.gov.uk/planning/index.html?fa=search', 'https://www.easthants.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-08)', 'available', ARRAY['East Hampshire']::text[]),
('East Hertfordshire District Council', 'England', 'East of England', 'Hertfordshire', 'district', 'E07000242', 'E60000168', 'East Hertfordshire', 130, 'yes', 'Idox', '2026-10-28', 61146, 'https://publicaccess.eastherts.gov.uk/online-applications/search.do?action=advanced', 'https://www.eastherts.gov.uk', 'active', null, '', '', 'available', ARRAY['East Hertfordshire']::text[]),
('East Lindsey District Council', 'England', 'East Midlands', 'Lincolnshire', 'district', 'E07000137', 'E60000093', 'East Lindsey', 170, 'yes', 'Idox', '2026-10-27', 43644, 'https://publicaccess.e-lindsey.gov.uk/online-applications/search.do?action=advanced', 'https://www.e-lindsey.gov.uk', 'active', null, '', '', 'available', ARRAY['East Lindsey']::text[]),
('East Riding of Yorkshire Council', 'England', 'Yorkshire and the Humber', '', 'unitary', 'E06000011', 'E60000052', 'East Riding', 11, 'yes', 'Idox', '2026-10-28', 104033, 'https://newplanningaccess.eastriding.gov.uk/newplanningaccess/search.do?action=advanced', 'https://www.eastriding.gov.uk/', 'active', null, '', '', 'available', ARRAY['East Riding']::text[]);

INSERT INTO local_planning_authorities (name, nation, region, county, type, gss_code, lpa_gss_code, planit_area_name, planit_area_id, planit_covered, planit_scraper_type, planit_latest_app_date, planit_total_apps, planning_portal_url, website, status, end_date, successor, notes, coverage, planit_query_areas)
VALUES
('East Staffordshire Borough Council', 'England', 'West Midlands', 'Staffordshire', 'district', 'E07000193', 'E60000118', 'East Staffordshire', 215, 'yes', 'Custom', '2026-10-23', 39583, 'https://eaststaffs-publicportal.statmap.co.uk/horizoNext/publicportal', 'https://www.eaststaffsbc.gov.uk', 'active', null, '', '', 'available', ARRAY['East Staffordshire']::text[]),
('East Suffolk Council', 'England', 'East of England', 'Suffolk', 'district', 'E07000244', 'E60000184', 'East Suffolk', 509, 'yes', 'Idox', '2026-10-29', 95977, 'https://publicaccess.eastsuffolk.gov.uk/online-applications/search.do?action=advanced', 'https://www.eastsuffolk.gov.uk', 'active', null, '', '', 'available', ARRAY['East Suffolk']::text[]),
('Eastbourne Borough Council', 'England', 'South East', 'East Sussex', 'district', 'E07000061', 'E60000237', 'Eastbourne', 94, 'yes', 'CivicaJson', '2026-10-26', 26724, 'https://www.lewes-eastbourne.gov.uk/planning/', 'https://www.eastbourne.gov.uk', 'active', null, '', '', 'available', ARRAY['Eastbourne']::text[]),
('Eastleigh Borough Council', 'England', 'South East', 'Hampshire', 'district', 'E07000086', 'E60000244', 'Eastleigh', 119, 'yes', 'Custom', '2026-10-28', 41104, 'https://planning.eastleigh.gov.uk/s/public-register', 'https://www.eastleigh.gov.uk', 'active', null, '', '', 'available', ARRAY['Eastleigh']::text[]),
('Ebbsfleet Development Corporation', 'England', 'South East', '', 'development corporation', 'E51000003', 'E60000328', '', null, 'no', '', null, null, '', 'https://ebbsfleetdc.org.uk', 'active', null, '', 'no PlanIt area found (gap; applications may be decided/recorded by host council - not verified)', 'unavailable', ARRAY[]::text[]),
('Elmbridge Borough Council', 'England', 'South East', 'Surrey', 'district', 'E07000207', 'E60000270', 'Elmbridge', 229, 'yes', 'Custom', '2026-09-30', 85357, 'https://emaps.elmbridge.gov.uk/ebc_planning.aspx?requesttype=parseTemplate&template=AdvancedSearchTab.tmplt', 'https://www.elmbridge.gov.uk', 'active', null, '', '', 'available', ARRAY['Elmbridge']::text[]),
('Epping Forest District Council', 'England', 'East of England', 'Essex', 'district', 'E07000072', 'E60000160', 'Epping Forest', 105, 'yes', 'Arcus', '2026-10-29', 71579, 'https://eppingforestdc.my.site.com/pr/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.eppingforestdc.gov.uk', 'active', null, '', '', 'available', ARRAY['Epping Forest']::text[]),
('Epsom and Ewell Borough Council', 'England', 'South East', 'Surrey', 'district', 'E07000208', 'E60000271', 'Epsom and Ewell', 230, 'yes', 'Idox', '2026-10-29', 35341, 'https://eplanning.epsom-ewell.gov.uk/online-applications/search.do?action=advanced', 'https://www.epsom-ewell.gov.uk', 'active', null, '', '', 'available', ARRAY['Epsom and Ewell']::text[]),
('Erewash Borough Council', 'England', 'East Midlands', 'Derbyshire', 'district', 'E07000036', 'E60000081', 'Erewash', 76, 'yes', 'Arcus', '2026-10-23', 22229, 'https://planning.erewash.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.erewash.gov.uk', 'active', null, '', '', 'available', ARRAY['Erewash']::text[]),
('Exeter City Council', 'England', 'South West', 'Devon', 'district', 'E07000041', 'E60000301', 'Exeter', 81, 'yes', 'Idox', '2026-10-23', 33080, 'https://publicaccess.exeter.gov.uk/online-applications/search.do?action=advanced', 'https://www.exeter.gov.uk', 'active', null, '', '', 'available', ARRAY['Exeter']::text[]),
('Exmoor National Park Authority', 'England', 'South West', '', 'national park', 'E26000002', 'E60000319', 'Exmoor', 355, 'yes', 'Atrium', '2026-10-30', 9257, 'https://exmoor.planning-register.co.uk/Search/Results/', 'https://www.exmoor-nationalpark.gov.uk', 'active', null, '', '', 'available', ARRAY['Exmoor']::text[]),
('Fareham Borough Council', 'England', 'South East', 'Hampshire', 'district', 'E07000087', 'E60000245', 'Fareham', 120, 'yes', 'Ocella', '2026-10-28', 42279, 'https://www.fareham.gov.uk/casetrackerplanning/ApplicationSearch.aspx?search=true', 'https://www.fareham.gov.uk', 'active', null, '', '', 'available', ARRAY['Fareham']::text[]),
('Fenland District Council', 'England', 'East of England', 'Cambridgeshire', 'district', 'E07000010', 'E60000151', 'Fenland', 63, 'yes', 'Idox', '2026-10-15', 33461, 'https://www.publicaccess.fenland.gov.uk/publicaccess/search.do?action=advanced', 'https://www.fenland.gov.uk', 'active', null, '', '', 'available', ARRAY['Fenland']::text[]),
('Folkestone and Hythe Council', 'England', 'South East', 'Kent', 'district', 'E07000112', 'E60000257', 'Shepway', 145, 'yes', 'Arcus', '2026-10-27', 37142, 'https://folkestonehythedc.my.site.com/PR3/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.folkestone-hythe.gov.uk', 'active', null, '', '', 'available', ARRAY['Shepway']::text[]),
('Forest of Dean District Council', 'England', 'South West', 'Gloucestershire', 'district', 'E07000080', 'E60000310', 'Forest of Dean', 113, 'yes', 'Idox', '2026-10-28', 34916, 'https://publicaccess.fdean.gov.uk/online-applications/search.do?action=advanced', 'https://www.fdean.gov.uk', 'active', null, '', '', 'available', ARRAY['Forest of Dean']::text[]),
('Fylde Borough Council', 'England', 'North West', 'Lancashire', 'district', 'E07000119', 'E60000037', 'Fylde', 152, 'yes', 'Atrium', '2026-10-29', 27258, 'https://pa.fylde.gov.uk/Search/Advanced/', 'https://www.fylde.gov.uk', 'active', null, '', '', 'available', ARRAY['Fylde']::text[]),
('Gateshead Metropolitan Borough Council', 'England', 'North East', '', 'metropolitan borough', 'E08000037', 'E60000008', 'Gateshead', 277, 'yes', 'Idox', '2026-10-21', 32100, 'https://public.gateshead.gov.uk/online-applications/search.do?action=advanced', 'https://www.gateshead.gov.uk', 'active', null, '', '', 'available', ARRAY['Gateshead']::text[]),
('Gedling Borough Council', 'England', 'East Midlands', 'Nottinghamshire', 'district', 'E07000173', 'E60000109', 'Gedling', 200, 'yes', 'Idox', '2026-10-23', 24054, 'https://pawam.gedling.gov.uk/online-applications/search.do?action=advanced', 'https://www.gedling.gov.uk', 'active', null, '', '', 'available', ARRAY['Gedling']::text[]),
('Gloucester City Council', 'England', 'South West', 'Gloucestershire', 'district', 'E07000081', 'E60000311', 'Gloucester', 114, 'yes', 'Idox', '2026-10-30', 24431, 'https://publicaccess.gloucester.gov.uk/online-applications/search.do?action=advanced', 'https://www.gloucester.gov.uk', 'active', null, '', '', 'available', ARRAY['Gloucester']::text[]),
('Gosport Borough Council', 'England', 'South East', 'Hampshire', 'district', 'E07000088', 'E60000246', 'Gosport', 121, 'yes', 'Idox', '2026-10-27', 12382, 'https://publicaccess.gosport.gov.uk/online-applications/search.do?action=advanced', 'https://www.gosport.gov.uk', 'active', null, '', '', 'available', ARRAY['Gosport']::text[]),
('Gravesham Borough Council', 'England', 'South East', 'Kent', 'district', 'E07000109', 'E60000258', 'Gravesham', 142, 'yes', 'Idox', '2026-10-30', 28763, 'https://plan.gravesham.gov.uk/online-applications/search.do?action=advanced', 'https://www.gravesham.gov.uk', 'active', null, '', '', 'available', ARRAY['Gravesham']::text[]),
('Great Yarmouth Borough Council', 'England', 'East of England', 'Norfolk', 'district', 'E07000145', 'E60000178', 'Great Yarmouth', 178, 'yes', 'Ocella', '2026-10-28', 24139, 'https://planning.great-yarmouth.gov.uk/OcellaWeb/planningSearch', 'https://www.great-yarmouth.gov.uk', 'active', null, '', '', 'available', ARRAY['Great Yarmouth']::text[]),
('Guildford Borough Council', 'England', 'South East', 'Surrey', 'district', 'E07000209', 'E60000272', 'Guildford', 231, 'yes', 'Idox', '2026-10-29', 75309, 'https://publicaccess.guildford.gov.uk/online-applications/search.do?action=advanced', 'https://www.guildford.gov.uk', 'active', null, '', '', 'available', ARRAY['Guildford']::text[]),
('Halton Borough Council', 'England', 'North West', '', 'unitary', 'E06000006', 'E60000017', 'Halton', 6, 'yes', 'Idox', '2026-10-27', 18680, 'https://pa.halton.gov.uk/online-applications/search.do?action=advanced', 'https://www.halton.gov.uk', 'active', null, '', '', 'available', ARRAY['Halton']::text[]),
('Harborough District Council', 'England', 'East Midlands', 'Leicestershire', 'district', 'E07000131', 'E60000087', 'Harborough', 164, 'yes', 'Idox', '2026-10-15', 44362, 'https://pa2.harborough.gov.uk/online-applications/search.do?action=advanced', 'https://www.harborough.gov.uk', 'active', null, '', '', 'available', ARRAY['Harborough']::text[]),
('Harlow District Council', 'England', 'East of England', 'Essex', 'district', 'E07000073', 'E60000161', 'Harlow', 106, 'yes', 'Idox', '2026-10-29', 16359, 'https://planningonline.harlow.gov.uk/online-applications/search.do?action=advanced', 'https://www.harlow.gov.uk', 'active', null, '', '', 'available', ARRAY['Harlow']::text[]),
('Hart District Council', 'England', 'South East', 'Hampshire', 'district', 'E07000089', 'E60000247', 'Hart', 122, 'yes', 'Idox', '2026-10-30', 58434, 'https://publicaccess.hart.gov.uk/online-applications/search.do?action=advanced', 'https://www.hart.gov.uk', 'active', null, '', '', 'available', ARRAY['Hart']::text[]),
('Hartlepool Borough Council', 'England', 'North East', '', 'unitary', 'E06000001', 'E60000003', 'Hartlepool', 1, 'yes', 'AppSearchServ', '2026-10-29', 17191, 'https://planning.hartlepool.gov.uk/portal/servlets/ApplicationSearchServlet', 'https://www.hartlepool.gov.uk', 'active', null, '', '', 'available', ARRAY['Hartlepool']::text[]),
('Hartlepool Development Corporation', 'England', 'North East', '', 'development corporation', 'E51000007', 'E60000340', '', null, 'no', '', null, null, '', 'https://teesvalley-ca.gov.uk/about/hartlepool-development-corporation/', 'active', null, '', 'no PlanIt area found (gap; applications may be decided/recorded by host council - not verified)', 'unavailable', ARRAY[]::text[]),
('Hastings Borough Council', 'England', 'South East', 'East Sussex', 'district', 'E07000062', 'E60000238', 'Hastings', 95, 'yes', 'Idox', '2026-10-28', 23810, 'https://publicaccess.hastings.gov.uk/online-applications/search.do?action=advanced', 'https://www.hastings.gov.uk', 'active', null, '', '', 'available', ARRAY['Hastings']::text[]),
('Havant Borough Council', 'England', 'South East', 'Hampshire', 'district', 'E07000090', 'E60000248', 'Havant', 123, 'yes', 'Arcus', '2026-10-30', 29588, 'https://service.havant.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.havant.gov.uk', 'active', null, '', '', 'available', ARRAY['Havant']::text[]),
('Herefordshire Council', 'England', 'West Midlands', '', 'unitary', 'E06000019', 'E60000113', 'Herefordshire', 19, 'yes', 'Custom', '2026-10-27', 90252, 'https://www.herefordshire.gov.uk/info/200142/planning_services/planning_application_search', 'https://www.herefordshire.gov.uk', 'active', null, '', '', 'available', ARRAY['Herefordshire']::text[]),
('Hertsmere Borough Council', 'England', 'East of England', 'Hertfordshire', 'district', 'E07000098', 'E60000169', 'Hertsmere', 131, 'yes', 'Idox', '2026-10-30', 44330, 'https://www6.hertsmere.gov.uk/online-applications/search.do?action=advanced', 'https://www.hertsmere.gov.uk', 'active', null, '', '', 'available', ARRAY['Hertsmere']::text[]),
('High Peak Borough Council', 'England', 'East Midlands', 'Derbyshire', 'district', 'E07000037', 'E60000082', 'High Peak', 77, 'yes', 'AppSearchServ', '2026-10-30', 24188, 'http://planning.highpeak.gov.uk/portal/servlets/ApplicationSearchServlet', 'https://www.highpeak.gov.uk', 'active', null, '', '', 'available', ARRAY['High Peak']::text[]),
('Hinckley and Bosworth Borough Council', 'England', 'East Midlands', 'Leicestershire', 'district', 'E07000132', 'E60000088', 'Hinckley and Bosworth', 165, 'yes', 'Idox', '2026-07-08', 31821, 'https://pa.hinckley-bosworth.gov.uk/online-applications/search.do?action=advanced', 'https://www.hinckley-bosworth.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-08)', 'available', ARRAY['Hinckley and Bosworth']::text[]),
('Horsham District Council', 'England', 'South East', 'West Sussex', 'district', 'E07000227', 'E60000285', 'Horsham', 249, 'yes', 'Idox', '2026-10-28', 68052, 'https://public-access.horsham.gov.uk/public-access/search.do?action=advanced', 'https://www.horsham.gov.uk', 'active', null, '', '', 'available', ARRAY['Horsham']::text[]),
('Hull City Council', 'England', 'Yorkshire and the Humber', '', 'unitary', 'E06000010', 'E60000053', 'Hull', 10, 'yes', 'Idox', '2026-10-30', 33191, 'https://www.hullcc.gov.uk/padcbc/publicaccess-live/search.do?action=advanced', 'https://www.hullcc.gov.uk', 'active', null, '', '', 'available', ARRAY['Hull']::text[]),
('Huntingdonshire District Council', 'England', 'East of England', 'Cambridgeshire', 'district', 'E07000011', 'E60000152', 'Huntingdonshire', 64, 'yes', 'Idox', '2026-10-30', 63733, 'https://publicaccess.huntingdonshire.gov.uk/online-applications/search.do?action=advanced', 'https://www.huntingdonshire.gov.uk', 'active', null, '', '', 'available', ARRAY['Huntingdonshire']::text[]),
('Hyndburn Borough Council', 'England', 'North West', 'Lancashire', 'district', 'E07000120', 'E60000038', 'Hyndburn', 153, 'yes', 'EnterpriseStore', '2026-10-29', 15859, 'https://planning.hyndburnbc.gov.uk/Northgate/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch', 'https://www.hyndburnbc.gov.uk', 'active', null, '', '', 'available', ARRAY['Hyndburn']::text[]),
('Ipswich Borough Council', 'England', 'East of England', 'Suffolk', 'district', 'E07000202', 'E60000185', 'Ipswich', 224, 'yes', 'Custom', '2026-10-28', 29685, 'https://ppc.ipswich.gov.uk/appnsearch.asp', 'https://www.ipswich.gov.uk', 'active', null, '', '', 'available', ARRAY['Ipswich']::text[]);

INSERT INTO local_planning_authorities (name, nation, region, county, type, gss_code, lpa_gss_code, planit_area_name, planit_area_id, planit_covered, planit_scraper_type, planit_latest_app_date, planit_total_apps, planning_portal_url, website, status, end_date, successor, notes, coverage, planit_query_areas)
VALUES
('Isle of Wight Council', 'England', 'South East', '', 'unitary', 'E06000046', 'E60000223', 'Isle of Wight', 46, 'yes', 'Idox Idox', '2026-10-30', 55088, 'https://publicaccess.iow.gov.uk/online-applications/search.do?action=advanced', 'https://www.iow.gov.uk/', 'active', null, '', '', 'available', ARRAY['Isle of Wight']::text[]),
('Kirklees Council', 'England', 'Yorkshire and the Humber', '', 'metropolitan borough', 'E08000034', 'E60000070', 'Kirklees', 291, 'yes', 'Custom', '2026-10-29', 112079, 'https://www.kirklees.gov.uk/beta/planning-applications/search-for-planning-applications/default.aspx', 'https://www.kirklees.gov.uk', 'active', null, '', '', 'available', ARRAY['Kirklees']::text[]),
('Knowsley Metropolitan Borough Council', 'England', 'North West', '', 'metropolitan borough', 'E08000011', 'E60000047', 'Knowsley', 268, 'yes', 'Idox', '2026-10-26', 19758, 'https://planapp.knowsley.gov.uk/online-applications/search.do?action=advanced', 'https://www.knowsley.gov.uk', 'active', null, '', '', 'available', ARRAY['Knowsley']::text[]),
('Lake District National Park Authority', 'England', 'North West', '', 'national park', 'E26000011', 'E60000320', 'Lake District', 356, 'yes', 'Agile', '2026-10-28', 39217, 'https://planning.agileapplications.co.uk/ldnpa/search-applications/', 'https://www.lakedistrict.gov.uk', 'active', null, '', '', 'available', ARRAY['Lake District']::text[]),
('Lancaster City Council', 'England', 'North West', 'Lancashire', 'district', 'E07000121', 'E60000039', 'Lancaster', 154, 'yes', 'Idox', '2026-10-28', 38218, 'https://planning.lancaster.gov.uk/online-applications/search.do?action=advanced', 'https://www.lancaster.gov.uk', 'active', null, '', '', 'available', ARRAY['Lancaster']::text[]),
('Leeds City Council', 'England', 'Yorkshire and the Humber', '', 'metropolitan borough', 'E08000035', 'E60000071', 'Leeds', 292, 'yes', 'Idox', '2026-10-29', 191677, 'https://publicaccess.leeds.gov.uk/online-applications/search.do?action=advanced', 'https://www.leeds.gov.uk', 'active', null, '', '', 'available', ARRAY['Leeds']::text[]),
('Leicester City Council', 'England', 'East Midlands', '', 'unitary', 'E06000016', 'E60000074', 'Leicester', 16, 'yes', 'Atrium', '2026-10-26', 60300, 'https://planning.leicester.gov.uk/Search/Advanced/', 'https://www.leicester.gov.uk', 'active', null, '', '', 'available', ARRAY['Leicester']::text[]),
('Lewes District Council', 'England', 'South East', 'East Sussex', 'district', 'E07000063', 'E60000239', 'Lewes', 96, 'yes', 'Idox', '2026-10-26', 29158, 'https://planningpa.lewes-eastbourne.gov.uk/online-applications/search.do?action=advanced', 'https://www.lewes-eastbourne.gov.uk', 'active', null, '', '', 'available', ARRAY['Lewes']::text[]),
('Lichfield District Council', 'England', 'West Midlands', 'Staffordshire', 'district', 'E07000194', 'E60000119', 'Lichfield', 216, 'yes', 'Idox', '2026-10-27', 31402, 'https://planning.lichfielddc.gov.uk/online-applications/search.do?action=advanced', 'https://www.lichfielddc.gov.uk', 'active', null, '', '', 'available', ARRAY['Lichfield']::text[]),
('Liverpool City Council', 'England', 'North West', '', 'metropolitan borough', 'E08000012', 'E60000048', 'Liverpool', 269, 'yes', 'Tascomi', '2026-07-08', 97709, 'https://lar.liverpool.gov.uk/planning/index.html?fa=search', 'https://www.liverpool.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-08)', 'available', ARRAY['Liverpool']::text[]),
('London Borough of Barking and Dagenham', 'England', 'London', '', 'london borough', 'E09000002', 'E60000202', 'Barking and Dagenham', 295, 'yes', 'Tascomi', '2026-07-04', 35748, 'https://online-befirst.lbbd.gov.uk/planning/index.html?fa=search', 'https://www.lbbd.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-04)', 'available', ARRAY['Barking and Dagenham']::text[]),
('London Borough of Barnet', 'England', 'London', '', 'london borough', 'E09000003', 'E60000203', 'Barnet', 296, 'yes', 'Idox', '2026-10-30', 177156, 'https://publicaccess.barnet.gov.uk/online-applications/search.do?action=advanced', 'https://www.barnet.gov.uk', 'active', null, '', '', 'available', ARRAY['Barnet']::text[]),
('London Borough of Bexley', 'England', 'London', '', 'london borough', 'E09000004', 'E60000204', 'Bexley', 297, 'yes', 'Idox', '2026-10-29', 62495, 'https://pa.bexley.gov.uk/online-applications/search.do?action=advanced', 'https://www.bexley.gov.uk', 'active', null, '', '', 'available', ARRAY['Bexley']::text[]),
('London Borough of Brent', 'England', 'London', '', 'london borough', 'E09000005', 'E60000205', 'Brent', 298, 'yes', 'Idox', '2026-10-28', 105642, 'https://pa.brent.gov.uk/online-applications/search.do?action=advanced', 'https://www.brent.gov.uk', 'active', null, '', '', 'available', ARRAY['Brent']::text[]),
('London Borough of Bromley', 'England', 'London', '', 'london borough', 'E09000006', 'E60000206', 'Bromley', 299, 'yes', 'Arcus', '2026-10-30', 128015, 'https://planningaccess.bromley.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.bromley.gov.uk', 'active', null, '', '', 'available', ARRAY['Bromley']::text[]),
('London Borough of Camden', 'England', 'London', '', 'london borough', 'E09000007', 'E60000188', 'Camden', 300, 'yes', 'Custom', '2026-10-30', 138503, 'https://opendata.camden.gov.uk/Environment/Planning-Applications/2eiu-s2cw/about_data', 'https://www.camden.gov.uk', 'active', null, '', '', 'available', ARRAY['Camden']::text[]),
('London Borough of Croydon', 'England', 'London', '', 'london borough', 'E09000008', 'E60000207', 'Croydon', 301, 'yes', 'Idox', '2026-10-29', 110746, 'https://publicaccess3.croydon.gov.uk/online-applications/search.do?action=advanced', 'https://www.croydon.gov.uk', 'active', null, '', '', 'available', ARRAY['Croydon']::text[]),
('London Borough of Ealing', 'England', 'London', '', 'london borough', 'E09000009', 'E60000208', 'Ealing', 302, 'yes', 'Idox', '2026-10-28', 132685, 'https://pam.ealing.gov.uk/online-applications/search.do?action=advanced', 'https://www.ealing.gov.uk', 'active', null, '', '', 'available', ARRAY['Ealing']::text[]),
('London Borough of Enfield', 'England', 'London', '', 'london borough', 'E09000010', 'E60000209', 'Enfield', 303, 'yes', 'Idox', '2026-10-27', 96705, 'https://planningandbuildingcontrol.enfield.gov.uk/online-applications/search.do?action=advanced', 'https://www.enfield.gov.uk', 'active', null, '', '', 'available', ARRAY['Enfield']::text[]),
('London Borough of Hackney', 'England', 'London', '', 'london borough', 'E09000012', 'E60000190', 'Hackney', 305, 'yes', 'Tascomi', '2026-07-02', 79208, 'https://developmentandhousing.hackney.gov.uk/planning/index.html?fa=search', 'https://www.hackney.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-02)', 'available', ARRAY['Hackney']::text[]),
('London Borough of Hammersmith & Fulham', 'England', 'London', '', 'london borough', 'E09000013', 'E60000191', 'Hammersmith and Fulham', 306, 'yes', 'EnterpriseStore', '2026-10-23', 96611, 'https://property.lbhf.gov.uk/NECSWS/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch', 'https://www.lbhf.gov.uk/', 'active', null, '', '', 'available', ARRAY['Hammersmith and Fulham']::text[]),
('London Borough of Haringey', 'England', 'London', '', 'london borough', 'E09000014', 'E60000192', 'Haringey', 307, 'yes', 'Arcus', '2026-10-30', 80838, 'https://publicregister.haringey.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.haringey.gov.uk', 'active', null, '', '', 'available', ARRAY['Haringey']::text[]),
('London Borough of Harrow', 'England', 'London', '', 'london borough', 'E09000015', 'E60000211', 'Harrow', 308, 'yes', 'Tascomi', '2026-07-02', 98798, 'https://planningsearch.harrow.gov.uk/planning/index.html?fa=search', 'https://www.harrow.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-02)', 'available', ARRAY['Harrow']::text[]),
('London Borough of Havering', 'England', 'London', '', 'london borough', 'E09000016', 'E60000212', 'Havering', 309, 'yes', 'Ocella', '2026-10-30', 76252, 'https://development.havering.gov.uk/OcellaWeb/planningSearch', 'https://www.havering.gov.uk', 'active', null, '', '', 'available', ARRAY['Havering']::text[]),
('London Borough of Hillingdon', 'England', 'London', '', 'london borough', 'E09000017', 'E60000213', 'Hillingdon', 310, 'yes', 'Ocella', '2026-10-21', 100777, 'https://planning.hillingdon.gov.uk/OcellaWeb/planningSearch', 'https://www.hillingdon.gov.uk', 'active', null, '', '', 'available', ARRAY['Hillingdon']::text[]),
('London Borough of Hounslow', 'England', 'London', '', 'london borough', 'E09000018', 'E60000214', 'Hounslow', 311, 'yes', 'EnterpriseStore', '2026-10-28', 105425, 'https://planningandbuilding.hounslow.gov.uk/NECSWS/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch', 'https://www.hounslow.gov.uk', 'active', null, '', '', 'available', ARRAY['Hounslow']::text[]),
('London Borough of Islington', 'England', 'London', '', 'london borough', 'E09000019', 'E60000193', 'Islington', 312, 'yes', 'Agile', '2026-10-27', 90247, 'https://planning.agileapplications.co.uk/islington/search-applications/', 'https://www.islington.gov.uk', 'active', null, '', '', 'available', ARRAY['Islington']::text[]),
('London Borough of Lambeth', 'England', 'London', '', 'london borough', 'E09000022', 'E60000195', 'Lambeth', 315, 'yes', 'Idox', '2026-10-28', 102174, 'https://planning.lambeth.gov.uk/online-applications/search.do?action=advanced', 'https://www.lambeth.gov.uk', 'active', null, '', '', 'available', ARRAY['Lambeth']::text[]),
('London Borough of Lewisham', 'England', 'London', '', 'london borough', 'E09000023', 'E60000196', 'Lewisham', 316, 'yes', 'Idox', '2026-10-28', 100731, 'https://planning.lewisham.gov.uk/online-applications/search.do?action=advanced', 'https://www.lewisham.gov.uk', 'active', null, '', '', 'available', ARRAY['Lewisham']::text[]),
('London Borough of Merton', 'England', 'London', '', 'london borough', 'E09000024', 'E60000216', 'Merton', 317, 'yes', 'Tascomi', '2026-07-02', 91338, 'https://rspandlp.merton.gov.uk/planning/index.html?fa=search', 'https://www.merton.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-02)', 'available', ARRAY['Merton']::text[]),
('London Borough of Newham', 'England', 'London', '', 'london borough', 'E09000025', 'E60000197', 'Newham', 318, 'yes', 'Idox', '2026-10-30', 61325, 'https://pa.newham.gov.uk/online-applications/search.do?action=advanced', 'https://www.newham.gov.uk', 'active', null, '', '', 'available', ARRAY['Newham']::text[]),
('London Borough of Redbridge', 'England', 'London', '', 'london borough', 'E09000026', 'E60000217', 'Redbridge', 319, 'yes', 'Agile', '2026-10-29', 111488, 'https://planning.agileapplications.co.uk/redbridge/search-applications/', 'https://www.redbridge.gov.uk', 'active', null, '', '', 'available', ARRAY['Redbridge']::text[]),
('London Borough of Richmond upon Thames', 'England', 'London', '', 'london borough', 'E09000027', 'E60000218', 'Richmond', 320, 'yes', 'Agile', '2026-10-29', 141250, 'https://planning.agileapplications.co.uk/richmond/search-applications/', 'https://www.richmond.gov.uk', 'active', null, '', '', 'available', ARRAY['Richmond']::text[]),
('London Borough of Southwark', 'England', 'London', '', 'london borough', 'E09000028', 'E60000198', 'Southwark', 321, 'yes', 'Idox', '2026-10-29', 94586, 'https://planning.southwark.gov.uk/online-applications/search.do?action=advanced', 'https://www.southwark.gov.uk', 'active', null, '', '', 'available', ARRAY['Southwark']::text[]),
('London Borough of Sutton', 'England', 'London', '', 'london borough', 'E09000029', 'E60000219', 'Sutton', 322, 'yes', 'Idox', '2026-10-28', 55129, 'https://planningregister.sutton.gov.uk/online-applications/search.do?action=advanced', 'https://www.sutton.gov.uk', 'active', null, '', '', 'available', ARRAY['Sutton']::text[]),
('London Borough of Tower Hamlets', 'England', 'London', '', 'london borough', 'E09000030', 'E60000199', 'Tower Hamlets', 323, 'yes', 'Idox', '2026-10-29', 84875, 'https://development.towerhamlets.gov.uk/online-applications/search.do?action=advanced', 'https://www.towerhamlets.gov.uk', 'active', null, '', '', 'available', ARRAY['Tower Hamlets']::text[]),
('London Borough of Waltham Forest', 'England', 'London', '', 'london borough', 'E09000031', 'E60000220', 'Waltham Forest', 324, 'yes', 'Tascomi', '2026-07-02', 70401, 'https://placehub.walthamforest.gov.uk/planning/index.html?fa=search', 'https://www.walthamforest.gov.uk/', 'active', null, '', 'PlanIt data stale (latest 2026-07-02)', 'available', ARRAY['Waltham Forest']::text[]),
('London Borough of Wandsworth', 'England', 'London', '', 'london borough', 'E09000032', 'E60000200', 'Wandsworth', 325, 'yes', 'PlanningExplorer', '2026-09-11', 143553, 'https://planning.wandsworth.gov.uk/Northgate/PlanningExplorer/GeneralSearch.aspx', 'https://www.wandsworth.gov.uk', 'active', null, '', '', 'available', ARRAY['Wandsworth']::text[]),
('Luton Borough Council', 'England', 'East of England', '', 'unitary', 'E06000032', 'E60000145', 'Luton', 32, 'yes', 'Idox', '2026-10-28', 41744, 'https://planning.luton.gov.uk/online-applications/search.do?action=advanced', 'https://www.luton.gov.uk', 'active', null, '', '', 'available', ARRAY['Luton']::text[]),
('Maidstone Borough Council', 'England', 'South East', 'Kent', 'district', 'E07000110', 'E60000259', 'Maidstone', 143, 'yes (via shared service)', '', null, null, 'https://pa.midkent.gov.uk/online-applications/search.do?action=advanced', 'https://www.maidstone.gov.uk', 'active', null, '', 'applications under PlanIt area ''Mid Kent'' (id 508, Idox)', 'shared', ARRAY['Mid Kent']::text[]);

INSERT INTO local_planning_authorities (name, nation, region, county, type, gss_code, lpa_gss_code, planit_area_name, planit_area_id, planit_covered, planit_scraper_type, planit_latest_app_date, planit_total_apps, planning_portal_url, website, status, end_date, successor, notes, coverage, planit_query_areas)
VALUES
('Maldon District Council', 'England', 'East of England', 'Essex', 'district', 'E07000074', 'E60000162', 'Maldon', 107, 'yes', 'Idox', '2026-10-26', 32479, 'https://publicaccess.maldon.gov.uk/online-applications/search.do?action=advanced', 'https://www.maldon.gov.uk', 'active', null, '', '', 'available', ARRAY['Maldon']::text[]),
('Malvern Hills District Council', 'England', 'West Midlands', 'Worcestershire', 'district', 'E07000235', 'E60000138', 'Malvern Hills', 253, 'yes', 'Atrium', '2026-10-29', 42615, 'https://plan.malvernhills.gov.uk/Search/Advanced/', 'https://www.malvernhills.gov.uk', 'active', null, '', '', 'available', ARRAY['Malvern Hills']::text[]),
('Manchester City Council', 'England', 'North West', '', 'metropolitan borough', 'E08000003', 'E60000027', 'Manchester', 260, 'yes', 'Arcus', '2026-10-29', 88049, 'https://arcusbe.manchester.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.manchester.gov.uk', 'active', null, '', '', 'available', ARRAY['Manchester']::text[]),
('Mansfield District Council', 'England', 'East Midlands', 'Nottinghamshire', 'district', 'E07000174', 'E60000110', 'Mansfield', 201, 'yes', 'Idox', '2026-10-26', 18139, 'https://planning.mansfield.gov.uk/online-applications/search.do?action=advanced', 'https://www.mansfield.gov.uk', 'active', null, '', '', 'available', ARRAY['Mansfield']::text[]),
('Medway Council', 'England', 'South East', '', 'unitary', 'E06000035', 'E60000224', 'Medway', 35, 'yes', 'Idox', '2026-10-29', 55992, 'https://publicaccess1.medway.gov.uk/online-applications/search.do?action=advanced', 'https://www.medway.gov.uk', 'active', null, '', '', 'available', ARRAY['Medway']::text[]),
('Melton Borough Council', 'England', 'East Midlands', 'Leicestershire', 'district', 'E07000133', 'E60000089', 'Melton', 166, 'yes', 'Idox', '2026-10-26', 23257, 'https://pa.melton.gov.uk/online-applications/search.do?action=advanced', 'https://www.melton.gov.uk', 'active', null, '', '', 'available', ARRAY['Melton']::text[]),
('Mid Devon District Council', 'England', 'South West', 'Devon', 'district', 'E07000042', 'E60000302', 'Mid Devon', 82, 'yes', 'Idox', '2026-10-30', 37947, 'https://planning.middevon.gov.uk/online-applications/search.do?action=advanced', 'https://www.middevon.gov.uk', 'active', null, '', '', 'available', ARRAY['Mid Devon']::text[]),
('Mid Suffolk District Council', 'England', 'East of England', 'Suffolk', 'district', 'E07000203', 'E60000186', 'Mid Suffolk', 225, 'yes (via shared service)', '', null, null, 'https://planning.baberghmidsuffolk.gov.uk/online-applications/search.do?action=advanced', 'https://www.midsuffolk.gov.uk', 'active', null, '', 'applications under PlanIt area ''Babergh Mid Suffolk'' (id 511, Idox)', 'shared', ARRAY['Babergh Mid Suffolk']::text[]),
('Mid Sussex District Council', 'England', 'South East', 'West Sussex', 'district', 'E07000228', 'E60000286', 'Mid Sussex', 250, 'yes', 'Idox', '2026-10-28', 62790, 'https://pa.midsussex.gov.uk/online-applications/search.do?action=advanced', 'https://www.midsussex.gov.uk', 'active', null, '', '', 'available', ARRAY['Mid Sussex']::text[]),
('Middlesbrough Borough Council', 'England', 'North East', '', 'unitary', 'E06000002', 'E60000004', 'Middlesbrough', 2, 'yes', 'Agile', '2026-10-28', 22260, 'https://planning.agileapplications.co.uk/middlesbrough/search-applications/', 'https://www.middlesbrough.gov.uk', 'active', null, '', '', 'available', ARRAY['Middlesbrough']::text[]),
('Middlesbrough Development Corporation', 'England', 'North East', '', 'development corporation', 'E51000006', 'E60000341', '', null, 'no', '', null, null, '', 'https://teesvalley-ca.gov.uk/about/middlesbrough-development-corporation/', 'active', null, '', 'no PlanIt area found (gap; applications may be decided/recorded by host council - not verified)', 'unavailable', ARRAY[]::text[]),
('Milton Keynes City Council', 'England', 'South East', '', 'unitary', 'E06000042', 'E60000225', 'Milton Keynes', 42, 'yes', 'Arcus', '2026-10-26', 56155, 'https://www.be.milton-keynes.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.milton-keynes.gov.uk/', 'active', null, '', '', 'available', ARRAY['Milton Keynes']::text[]),
('Mole Valley District Council', 'England', 'South East', 'Surrey', 'district', 'E07000210', 'E60000273', 'Mole Valley', 232, 'yes', 'Custom', '2026-10-27', 56352, 'https://molevalley-publicportal.statmap.co.uk/horizoNext/publicportal', 'https://www.molevalley.gov.uk', 'active', null, '', '', 'available', ARRAY['Mole Valley']::text[]),
('New Forest District Council', 'England', 'South East', 'Hampshire', 'district', 'E07000091', 'E60000249', 'New Forest (District)', 124, 'yes', 'Idox', '2026-10-28', 51628, 'https://planning.newforest.gov.uk/online-applications/search.do?action=advanced', 'https://www.newforestdc.gov.uk', 'active', null, '', '', 'available', ARRAY['New Forest (District)']::text[]),
('New Forest National Park Authority', 'England', 'South East', '', 'national park', 'E26000009', 'E60000321', 'New Forest (Park)', 362, 'yes', 'Agile', '2026-10-27', 51958, 'https://planning.agileapplications.co.uk/nfnpa/search-applications/', 'https://www.newforestnpa.gov.uk', 'active', null, '', '', 'available', ARRAY['New Forest (Park)']::text[]),
('Newark and Sherwood District Council', 'England', 'East Midlands', 'Nottinghamshire', 'district', 'E07000175', 'E60000111', 'Newark and Sherwood', 202, 'yes', 'Idox', '2026-10-27', 48043, 'https://publicaccess.newark-sherwooddc.gov.uk/online-applications/search.do?action=advanced', 'https://www.newark-sherwooddc.gov.uk', 'active', null, '', '', 'available', ARRAY['Newark and Sherwood']::text[]),
('Newcastle City Council', 'England', 'North East', '', 'metropolitan borough', 'E08000021', 'E60000009', 'Newcastle upon Tyne', 278, 'yes', 'Tascomi', '2026-07-02', 68897, 'https://portal.newcastle.gov.uk/planning/index.html?fa=search', 'https://www.newcastle.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-02)', 'available', ARRAY['Newcastle upon Tyne']::text[]),
('Newcastle-under-Lyme Borough Council', 'England', 'West Midlands', 'Staffordshire', 'district', 'E07000195', 'E60000120', 'Newcastle under Lyme', 217, 'yes', 'Idox', '2026-10-23', 29693, 'https://publicaccess.newcastle-staffs.gov.uk/online-applications/search.do?action=advanced', 'https://www.newcastle-staffs.gov.uk', 'active', null, '', '', 'available', ARRAY['Newcastle under Lyme']::text[]),
('North Devon District Council', 'England', 'South West', 'Devon', 'district', 'E07000043', 'E60000303', 'North Devon', 83, 'yes', 'Atrium', '2026-10-22', 47579, 'https://planning.northdevon.gov.uk/Search/Advanced/', 'https://www.northdevon.gov.uk', 'active', null, '', '', 'available', ARRAY['North Devon']::text[]),
('North East Derbyshire District Council', 'England', 'East Midlands', 'Derbyshire', 'district', 'E07000038', 'E60000083', 'North East Derbyshire', 78, 'yes', 'Idox', '2026-10-01', 29528, 'https://planapps-online.ne-derbyshire.gov.uk/online-applications/search.do?action=advanced', 'https://www.ne-derbyshire.gov.uk', 'active', null, '', '', 'available', ARRAY['North East Derbyshire']::text[]),
('North East Lincolnshire Council', 'England', 'Yorkshire and the Humber', '', 'unitary', 'E06000012', 'E60000054', 'North East Lincs', 12, 'yes', 'Idox', '2026-10-29', 28888, 'https://planninganddevelopment.nelincs.gov.uk/online-applications/search.do?action=advanced', 'https://www.nelincs.gov.uk', 'active', null, '', '', 'available', ARRAY['North East Lincs']::text[]),
('North Hertfordshire District Council', 'England', 'East of England', 'Hertfordshire', 'district', 'E07000099', 'E60000170', 'North Hertfordshire', 132, 'yes', 'Idox', '2026-10-28', 52656, 'https://pa2.north-herts.gov.uk/online-applications/search.do?action=advanced', 'https://www.north-herts.gov.uk', 'active', null, '', '', 'available', ARRAY['North Hertfordshire']::text[]),
('North Kesteven District Council', 'England', 'East Midlands', 'Lincolnshire', 'district', 'E07000139', 'E60000095', 'North Kesteven', 172, 'yes', 'Idox', '2026-10-30', 39292, 'https://planningonline.n-kesteven.gov.uk/online-applications/search.do?action=advanced', 'https://www.n-kesteven.gov.uk', 'active', null, '', '', 'available', ARRAY['North Kesteven']::text[]),
('North Lincolnshire Council', 'England', 'Yorkshire and the Humber', '', 'unitary', 'E06000013', 'E60000055', 'North Lincs', 13, 'yes', 'Custom', '2026-08-07', 16397, 'https://apps.northlincs.gov.uk/', 'https://www.northlincs.gov.uk', 'active', null, '', '', 'available', ARRAY['North Lincs']::text[]),
('North Norfolk District Council', 'England', 'East of England', 'Norfolk', 'district', 'E07000147', 'E60000180', 'North Norfolk', 180, 'yes', 'Idox', '2026-10-27', 58187, 'https://idoxpa.north-norfolk.gov.uk/online-applications/search.do?action=advanced', 'https://www.northnorfolk.org/', 'active', null, '', '', 'available', ARRAY['North Norfolk']::text[]),
('North Northamptonshire Council', 'England', 'East Midlands', '', 'unitary', 'E06000061', 'E60000332', 'North Northamptonshire', 518, 'yes', 'Idox Northants', '2026-10-28', 3396, 'https://publicaccess.northnorthants.gov.uk/online-applications/search.do?action=advanced', 'https://www.northnorthants.gov.uk/', 'active', null, '', '', 'available', ARRAY['North Northamptonshire']::text[]),
('North Somerset Council', 'England', 'South West', '', 'unitary', 'E06000024', 'E60000294', 'North Somerset', 24, 'yes', 'Idox', '2026-10-26', 66730, 'https://planning.n-somerset.gov.uk/online-applications/search.do?action=advanced', 'https://www.n-somerset.gov.uk', 'active', null, '', '', 'available', ARRAY['North Somerset']::text[]),
('North Tyneside Council', 'England', 'North East', '', 'metropolitan borough', 'E08000022', 'E60000010', 'North Tyneside', 279, 'yes', 'Idox', '2026-10-29', 39000, 'https://idoxpublicaccess.northtyneside.gov.uk/online-applications/search.do?action=advanced', 'https://www.northtyneside.gov.uk', 'active', null, '', '', 'available', ARRAY['North Tyneside']::text[]),
('North Warwickshire Borough Council', 'England', 'West Midlands', 'Warwickshire', 'district', 'E07000218', 'E60000125', 'North Warwickshire', 240, 'yes', 'Atrium', '2026-10-28', 21126, 'https://planning.northwarks.gov.uk/Search/Results/', 'https://www.northwarks.gov.uk', 'active', null, '', '', 'available', ARRAY['North Warwickshire']::text[]),
('North West Leicestershire District Council', 'England', 'East Midlands', 'Leicestershire', 'district', 'E07000134', 'E60000090', 'North West Leicestershire', 167, 'yes', 'Idox', '2026-10-27', 29480, 'https://plans.nwleics.gov.uk/public-access/search.do?action=advanced', 'https://www.nwleics.gov.uk', 'active', null, '', '', 'available', ARRAY['North West Leicestershire']::text[]),
('North York Moors National Park Authority', 'England', 'Yorkshire and the Humber', '', 'national park', 'E26000005', 'E60000322', 'North York Moors', 358, 'yes', 'Custom', '2026-10-26', 21162, 'https://northyorkmoors-publicportal.statmap.co.uk/horizoNext/publicportal', 'https://www.northyorkmoors.org.uk', 'active', null, '', '', 'available', ARRAY['North York Moors']::text[]),
('North Yorkshire Council', 'England', 'Yorkshire and the Humber', '', 'unitary', 'E06000065', 'E60000336', 'North Yorkshire', 344, 'yes', 'Idox Atrium', '2026-10-27', 11981, 'https://publicaccess.northyorks.gov.uk/online-applications/search.do?action=advanced', 'https://www.northyorks.gov.uk/', 'active', null, '', '', 'available', ARRAY['North Yorkshire']::text[]),
('Northumberland County Council', 'England', 'North East', '', 'unitary', 'E06000057', 'E60000005', 'Northumberland (County)', 48, 'yes', 'Idox', '2026-10-30', 106938, 'https://publicaccess.northumberland.gov.uk/online-applications/search.do?action=advanced', 'https://www.northumberland.gov.uk', 'active', null, '', '', 'available', ARRAY['Northumberland (County)']::text[]),
('Northumberland National Park Authority', 'England', 'North East', '', 'national park', 'E26000004', 'E60000323', 'Northumberland (Park)', 357, 'yes', 'Atrium', '2026-10-21', 2543, 'https://nnpa.planning-register.co.uk/Search/Advanced/', 'https://www.northumberlandnationalpark.org.uk', 'active', null, '', '', 'available', ARRAY['Northumberland (Park)']::text[]),
('Norwich City Council', 'England', 'East of England', 'Norfolk', 'district', 'E07000148', 'E60000181', 'Norwich', 181, 'yes', 'Idox', '2026-10-22', 27704, 'https://planning.norwich.gov.uk/online-applications/search.do?action=advanced', 'https://www.norwich.gov.uk', 'active', null, '', '', 'available', ARRAY['Norwich']::text[]),
('Nottingham City Council', 'England', 'East Midlands', '', 'unitary', 'E06000018', 'E60000075', 'Nottingham', 18, 'yes', 'Idox', '2026-10-22', 60647, 'https://publicaccess.nottinghamcity.gov.uk/online-applications/search.do?action=advanced', 'https://www.nottinghamcity.gov.uk', 'active', null, '', '', 'available', ARRAY['Nottingham']::text[]),
('Nuneaton and Bedworth Borough Council', 'England', 'West Midlands', 'Warwickshire', 'district', 'E07000219', 'E60000126', 'Nuneaton', 241, 'yes', 'Tascomi', '2019-10-15', 14465, 'http://apps.nuneatonandbedworth.gov.uk/bt_nbbc_planning/bt_nbbc_planning_disp.asp', 'https://www.nuneatonandbedworth.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2019-10-15)', 'available', ARRAY['Nuneaton']::text[]),
('Oadby and Wigston Borough Council', 'England', 'East Midlands', 'Leicestershire', 'district', 'E07000135', 'E60000091', 'Oadby and Wigston', 168, 'yes', 'Idox', '2026-10-23', 11951, 'https://pa.oadby-wigston.gov.uk/online-applications/search.do?action=advanced', 'https://oadby-wigston.gov.uk', 'active', null, '', '', 'available', ARRAY['Oadby and Wigston']::text[]),
('Old Oak and Park Royal Development Corporation', 'England', 'London', '', 'development corporation', 'E51000002', 'E60000330', 'Old Oak Park Royal', 514, 'yes', 'Agile', '2026-10-21', 2165, 'https://planning.agileapplications.co.uk/opdc/search-applications/', 'https://www.london.gov.uk/about-us/organisations-we-work/old-oak-and-park-royal-development-corporation-opdc', 'active', null, '', '', 'available', ARRAY['Old Oak Park Royal']::text[]),
('Oldham Metropolitan Borough Council', 'England', 'North West', '', 'metropolitan borough', 'E08000004', 'E60000028', 'Oldham', 261, 'yes', 'Idox', '2026-10-22', 43767, 'https://planningpa.oldham.gov.uk/online-applications/search.do?action=advanced', 'https://www.oldham.gov.uk', 'active', null, '', '', 'available', ARRAY['Oldham']::text[]);

INSERT INTO local_planning_authorities (name, nation, region, county, type, gss_code, lpa_gss_code, planit_area_name, planit_area_id, planit_covered, planit_scraper_type, planit_latest_app_date, planit_total_apps, planning_portal_url, website, status, end_date, successor, notes, coverage, planit_query_areas)
VALUES
('Oxford City Council', 'England', 'South East', 'Oxfordshire', 'district', 'E07000178', 'E60000266', 'Oxford', 205, 'yes', 'Idox', '2026-10-29', 67807, 'https://public.oxford.gov.uk/online-applications/search.do?action=advanced', 'https://www.oxford.gov.uk', 'active', null, '', '', 'available', ARRAY['Oxford']::text[]),
('Peak District National Park Authority', 'England', 'East Midlands', '', 'national park', 'E26000006', 'E60000324', 'Peak District', 359, 'yes', 'EnterpriseStore', '2026-10-29', 31070, 'https://planning.peakdistrict.gov.uk/AssureLive/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch', 'https://www.peakdistrict.gov.uk', 'active', null, '', '', 'available', ARRAY['Peak District']::text[]),
('Pendle Borough Council', 'England', 'North West', 'Lancashire', 'district', 'E07000122', 'E60000040', 'Pendle', 155, 'yes', 'Idox', '2026-10-29', 19228, 'https://publicaccess.pendle.gov.uk/online-applications/search.do?action=advanced', 'https://www.pendle.gov.uk', 'active', null, '', '', 'available', ARRAY['Pendle']::text[]),
('Peterborough City Council', 'England', 'East of England', '', 'unitary', 'E06000031', 'E60000146', 'Peterborough', 31, 'yes', 'Agile', '2026-10-27', 46821, 'https://planning.agileapplications.co.uk/peterborough/search-applications/', 'https://www.peterborough.gov.uk', 'active', null, '', '', 'available', ARRAY['Peterborough']::text[]),
('Plymouth City Council', 'England', 'South West', '', 'unitary', 'E06000026', 'E60000295', 'Plymouth', 26, 'yes', 'Idox', '2026-10-27', 44344, 'https://planning.plymouth.gov.uk/online-applications/search.do?action=advanced', 'https://www.plymouth.gov.uk', 'active', null, '', '', 'available', ARRAY['Plymouth']::text[]),
('Portsmouth City Council', 'England', 'South East', '', 'unitary', 'E06000044', 'E60000226', 'Portsmouth', 44, 'yes', 'Idox', '2026-04-17', 31386, 'https://publicaccess.portsmouth.gov.uk/online-applications/search.do?action=advanced', 'https://www.portsmouth.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-04-17)', 'available', ARRAY['Portsmouth']::text[]),
('Preston City Council', 'England', 'North West', 'Lancashire', 'district', 'E07000123', 'E60000041', 'Preston', 156, 'yes', 'Custom', '2026-07-29', 31603, 'https://selfservice.preston.gov.uk/service/planning/ApplicationSearch.aspx', 'https://www.preston.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-29)', 'available', ARRAY['Preston']::text[]),
('Reading Borough Council', 'England', 'South East', '', 'unitary', 'E06000038', 'E60000227', 'Reading', 38, 'yes', 'Arcus', '2026-10-29', 80800, 'https://publicregister.reading.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register', 'http://www.reading.gov.uk', 'active', null, '', '', 'available', ARRAY['Reading']::text[]),
('Redcar and Cleveland Borough Council', 'England', 'North East', '', 'unitary', 'E06000003', 'E60000006', 'Redcar and Cleveland', 3, 'yes', 'Atrium', '2026-10-29', 25797, 'https://planning.redcar-cleveland.gov.uk/Search/Planning/Advanced/', 'https://www.redcar-cleveland.gov.uk', 'active', null, '', '', 'available', ARRAY['Redcar and Cleveland']::text[]),
('Redditch Borough Council', 'England', 'West Midlands', 'Worcestershire', 'district', 'E07000236', 'E60000139', 'Redditch', 254, 'yes (via shared service)', '', null, null, 'https://publicaccess.bromsgroveandredditch.gov.uk/online-applications/search.do?action=advanced', 'https://www.redditchbc.gov.uk', 'active', null, '', 'applications under PlanIt area ''Bromsgrove Redditch'' (id 512, Idox)', 'shared', ARRAY['Bromsgrove Redditch']::text[]),
('Reigate and Banstead Borough Council', 'England', 'South East', 'Surrey', 'district', 'E07000211', 'E60000274', 'Reigate', 233, 'yes', 'Idox', '2026-10-29', 68799, 'https://planning.reigate-banstead.gov.uk/online-applications/search.do?action=advanced', 'https://www.reigate-banstead.gov.uk', 'active', null, '', '', 'available', ARRAY['Reigate']::text[]),
('Ribble Valley Borough Council', 'England', 'North West', 'Lancashire', 'district', 'E07000124', 'E60000042', 'Ribble Valley', 157, 'yes', 'Custom', '2026-10-01', 38846, 'https://webportal.ribblevalley.gov.uk/planningApplication/search/advanced', 'https://www.ribblevalley.gov.uk', 'active', null, '', '', 'available', ARRAY['Ribble Valley']::text[]),
('Rochdale Metropolitan Borough Council', 'England', 'North West', '', 'metropolitan borough', 'E08000005', 'E60000029', 'Rochdale', 262, 'yes', 'Arcus', '2026-10-28', 40024, 'https://account.rochdale.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register&c__q', 'https://www.rochdale.gov.uk', 'active', null, '', '', 'available', ARRAY['Rochdale']::text[]),
('Rochford District Council', 'England', 'East of England', 'Essex', 'district', 'E07000075', 'E60000163', 'Rochford', 108, 'yes', 'Astun', '2026-10-26', 25643, 'https://maps.rochford.gov.uk/DevelopmentControl.aspx?RequestType=ParseTemplate&template=DevelopmentControlAdvancedSearch.tmplt', 'https://www.rochford.gov.uk', 'active', null, '', '', 'available', ARRAY['Rochford']::text[]),
('Rossendale Borough Council', 'England', 'North West', 'Lancashire', 'district', 'E07000125', 'E60000043', 'Rossendale', 158, 'yes', 'Idox', '2026-10-21', 15007, 'https://publicaccess.rossendale.gov.uk/online-applications/search.do?action=advanced', 'https://www.rossendale.gov.uk', 'active', null, '', '', 'available', ARRAY['Rossendale']::text[]),
('Rother District Council', 'England', 'South East', 'East Sussex', 'district', 'E07000064', 'E60000240', 'Rother', 97, 'yes', 'Tascomi', '2026-07-06', 48288, 'https://online.rother.gov.uk/planning/index.html?fa=search', 'https://www.rother.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-06)', 'available', ARRAY['Rother']::text[]),
('Rotherham Metropolitan Borough Council', 'England', 'Yorkshire and the Humber', '', 'metropolitan borough', 'E08000018', 'E60000066', 'Rotherham', 275, 'yes', 'Fastweb', '2026-10-29', 48667, 'https://planning.rotherham.gov.uk/fastweblive/search.asp', 'https://www.rotherham.gov.uk', 'active', null, '', '', 'available', ARRAY['Rotherham']::text[]),
('Royal Borough of Greenwich', 'England', 'London', '', 'london borough', 'E09000011', 'E60000210', 'Greenwich', 304, 'yes', 'Idox', '2026-10-30', 83203, 'https://planning.royalgreenwich.gov.uk/online-applications/search.do?action=advanced', 'https://www.royalgreenwich.gov.uk', 'active', null, '', '', 'available', ARRAY['Greenwich']::text[]),
('Royal Borough of Kensington and Chelsea', 'England', 'London', '', 'london borough', 'E09000020', 'E60000194', 'Kensington', 313, 'yes', 'Custom', '2026-07-27', 134660, 'https://www.rbkc.gov.uk/planningsearch', 'https://www.rbkc.gov.uk/', 'active', null, '', 'PlanIt data stale (latest 2026-07-27)', 'available', ARRAY['Kensington']::text[]),
('Royal Borough of Kingston upon Thames', 'England', 'London', '', 'london borough', 'E09000021', 'E60000215', 'Kingston', 314, 'yes', 'Idox', '2026-10-28', 128037, 'https://publicaccess.kingston.gov.uk/online-applications/search.do?action=advanced', 'https://www.kingston.gov.uk', 'active', null, '', '', 'available', ARRAY['Kingston']::text[]),
('Royal Borough of Windsor and Maidenhead', 'England', 'South East', '', 'unitary', 'E06000040', 'E60000231', 'Windsor', 40, 'yes', 'Idox', '2026-10-28', 86426, 'https://publicaccess.rbwm.gov.uk/online-applications/search.do?action=advanced', 'https://www.rbwm.gov.uk/', 'active', null, '', '', 'available', ARRAY['Windsor']::text[]),
('Rugby Borough Council', 'England', 'West Midlands', 'Warwickshire', 'district', 'E07000220', 'E60000127', 'Rugby', 242, 'yes', 'Agile', '2026-10-26', 32013, 'https://planning.agileapplications.co.uk/rugby/search-applications/', 'https://www.rugby.gov.uk', 'active', null, '', '', 'available', ARRAY['Rugby']::text[]),
('Runnymede Borough Council', 'England', 'South East', 'Surrey', 'district', 'E07000212', 'E60000275', 'Runnymede', 234, 'yes', 'PlanningExplorer', '2026-10-29', 39316, 'https://planning.runnymede.gov.uk/Northgate/PlanningExplorer/GeneralSearch.aspx', 'https://www.runnymede.gov.uk', 'active', null, '', '', 'available', ARRAY['Runnymede']::text[]),
('Rushcliffe Borough Council', 'England', 'East Midlands', 'Nottinghamshire', 'district', 'E07000176', 'E60000112', 'Rushcliffe', 203, 'yes', 'Idox', '2026-10-26', 40215, 'https://planningon-line.rushcliffe.gov.uk/online-applications/search.do?action=advanced', 'https://www.rushcliffe.gov.uk', 'active', null, '', '', 'available', ARRAY['Rushcliffe']::text[]),
('Rushmoor Borough Council', 'England', 'South East', 'Hampshire', 'district', 'E07000092', 'E60000250', 'Rushmoor', 125, 'yes', 'Idox', '2026-10-27', 22217, 'https://publicaccess.rushmoor.gov.uk/online-applications/search.do?action=advanced', 'https://www.rushmoor.gov.uk', 'active', null, '', '', 'available', ARRAY['Rushmoor']::text[]),
('Rutland County Council', 'England', 'East Midlands', '', 'unitary', 'E06000017', 'E60000076', 'Rutland', 17, 'yes', 'Idox', '2026-10-28', 29847, 'https://publicaccess.rutland.gov.uk/online-applications/search.do?action=advanced', 'https://www.rutland.gov.uk', 'active', null, '', '', 'available', ARRAY['Rutland']::text[]),
('Salford City Council', 'England', 'North West', '', 'metropolitan borough', 'E08000006', 'E60000030', 'Salford', 263, 'yes', 'Arcus', '2026-10-29', 43185, 'https://salfordcitycouncil.my.site.com/pr/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.salford.gov.uk', 'active', null, '', '', 'available', ARRAY['Salford']::text[]),
('Sandwell Metropolitan Borough Council', 'England', 'West Midlands', '', 'metropolitan borough', 'E08000028', 'E60000133', 'Sandwell', 285, 'yes', 'Idox', '2026-10-23', 37206, 'https://webcaps.sandwell.gov.uk/publicaccess/search.do?action=advanced', 'https://www.sandwell.gov.uk', 'active', null, '', '', 'available', ARRAY['Sandwell']::text[]),
('Sefton Metropolitan Borough Council', 'England', 'North West', '', 'metropolitan borough', 'E08000014', 'E60000049', 'Sefton', 271, 'yes', 'Idox', '2026-10-27', 53429, 'https://pa.sefton.gov.uk/online-applications/search.do?action=advanced', 'https://www.sefton.gov.uk', 'active', null, '', '', 'available', ARRAY['Sefton']::text[]),
('Sevenoaks District Council', 'England', 'South East', 'Kent', 'district', 'E07000111', 'E60000260', 'Sevenoaks', 144, 'yes', 'Idox', '2026-10-29', 81391, 'https://pa.sevenoaks.gov.uk/online-applications/search.do?action=advanced', 'https://www.sevenoaks.gov.uk', 'active', null, '', '', 'available', ARRAY['Sevenoaks']::text[]),
('Sheffield City Council', 'England', 'Yorkshire and the Humber', '', 'metropolitan borough', 'E08000019', 'E60000067', 'Sheffield', 276, 'yes', 'Idox', '2026-10-28', 96187, 'https://planningapps.sheffield.gov.uk/online-applications/search.do?action=advanced', 'https://www.sheffield.gov.uk', 'active', null, '', '', 'available', ARRAY['Sheffield']::text[]),
('Shropshire Council', 'England', 'West Midlands', '', 'unitary', 'E06000051', 'E60000114', 'Shropshire', 51, 'yes', 'Idox', '2026-10-23', 124069, 'https://pa.shropshire.gov.uk/online-applications/search.do?action=advanced', 'https://www.shropshire.gov.uk', 'active', null, '', '', 'available', ARRAY['Shropshire']::text[]),
('Slough Borough Council', 'England', 'South East', '', 'unitary', 'E06000039', 'E60000228', 'Slough', 39, 'yes', 'Agile', '2026-10-29', 35338, 'https://planning.agileapplications.co.uk/slough/search-applications/', 'https://www.slough.gov.uk', 'active', null, '', '', 'available', ARRAY['Slough']::text[]),
('Solihull Metropolitan Borough Council', 'England', 'West Midlands', '', 'metropolitan borough', 'E08000029', 'E60000134', 'Solihull', 286, 'yes', 'Idox', '2026-10-28', 67582, 'https://publicaccess.solihull.gov.uk/online-applications/search.do?action=advanced', 'https://www.solihull.gov.uk', 'active', null, '', '', 'available', ARRAY['Solihull']::text[]),
('Somerset Council', 'England', 'South West', '', 'unitary', 'E06000066', 'E60000337', 'Somerset', 347, 'yes', 'Atrium', '2026-10-29', 4457, 'https://planning.somerset.gov.uk/Search/Advanced/', 'https://www.somerset.gov.uk/', 'active', null, '', '', 'available', ARRAY['Somerset']::text[]),
('South Cambridgeshire District Council', 'England', 'East of England', 'Cambridgeshire', 'district', 'E07000012', 'E60000153', 'South Cambridgeshire', 65, 'yes', 'Idox Idox', '2026-10-30', 75268, 'https://applications.greatercambridgeplanning.org/online-applications/search.do?action=advanced', 'https://www.scambs.gov.uk', 'active', null, '', '', 'available', ARRAY['South Cambridgeshire']::text[]),
('South Derbyshire District Council', 'England', 'East Midlands', 'Derbyshire', 'district', 'E07000039', 'E60000084', 'South Derbyshire', 79, 'yes', 'Custom', '2026-10-12', 33090, 'https://planning.southderbyshire.gov.uk/', 'https://www.southderbyshire.gov.uk/', 'active', null, '', '', 'available', ARRAY['South Derbyshire']::text[]),
('South Downs National Park Authority', 'England', 'South East', '', 'national park', 'E26000010', 'E60000325', 'South Downs', 363, 'yes', 'Idox', '2026-10-30', 70023, 'https://planningpublicaccess.southdowns.gov.uk/online-applications/search.do?action=advanced', 'https://www.southdowns.gov.uk', 'active', null, '', '', 'available', ARRAY['South Downs']::text[]),
('South Gloucestershire Council', 'England', 'South West', '', 'unitary', 'E06000025', 'E60000296', 'South Gloucestershire', 25, 'yes', 'Idox', '2026-10-29', 78461, 'https://developments.southglos.gov.uk/online-applications/search.do?action=advanced', 'https://www.southglos.gov.uk', 'active', null, '', '', 'available', ARRAY['South Gloucestershire']::text[]),
('South Hams District Council', 'England', 'South West', 'Devon', 'district', 'E07000044', 'E60000304', 'South Hams', 84, 'yes (via shared service)', '', null, null, '', 'https://www.southhams.gov.uk/', 'active', null, '', 'applications under PlanIt area ''South West Devon'' (id 510, Atrium)', 'shared', ARRAY['South West Devon']::text[]);

INSERT INTO local_planning_authorities (name, nation, region, county, type, gss_code, lpa_gss_code, planit_area_name, planit_area_id, planit_covered, planit_scraper_type, planit_latest_app_date, planit_total_apps, planning_portal_url, website, status, end_date, successor, notes, coverage, planit_query_areas)
VALUES
('South Holland District Council', 'England', 'East Midlands', 'Lincolnshire', 'district', 'E07000140', 'E60000096', 'South Holland', 173, 'yes', 'Ocella', '2026-10-28', 34264, 'https://planning.sholland.gov.uk/OcellaWeb/planningSearch', 'https://www.sholland.gov.uk', 'active', null, '', '', 'available', ARRAY['South Holland']::text[]),
('South Kesteven District Council', 'England', 'East Midlands', 'Lincolnshire', 'district', 'E07000141', 'E60000097', 'South Kesteven', 174, 'yes', 'Idox', '2026-10-20', 96390, 'https://prod.publicaccess.southkesteven.gov.uk/online-applications/search.do?action=advanced', 'https://www.southkesteven.gov.uk', 'active', null, '', '', 'available', ARRAY['South Kesteven']::text[]),
('South Norfolk District Council', 'England', 'East of England', 'Norfolk', 'district', 'E07000149', 'E60000182', 'South Norfolk', 182, 'yes (via shared service)', '', null, null, '', 'https://www.south-norfolk.gov.uk', 'active', null, '', 'applications under PlanIt area ''South Norfolk Broadland'' (id 521, Idox)', 'shared', ARRAY['South Norfolk Broadland']::text[]),
('South Oxfordshire District Council', 'England', 'South East', 'Oxfordshire', 'district', 'E07000179', 'E60000267', 'South Oxfordshire', 206, 'yes', 'Atrium', '2026-10-28', 86584, 'https://southoxfordshire.planning-register.co.uk/Search/Results', 'https://www.southoxon.gov.uk', 'active', null, '', '', 'available', ARRAY['South Oxfordshire']::text[]),
('South Ribble Borough Council', 'England', 'North West', 'Lancashire', 'district', 'E07000126', 'E60000044', 'South Ribble', 159, 'yes', 'Idox', '2026-10-30', 22730, 'https://publicaccess.southribble.gov.uk/online-applications/search.do?action=advanced', 'https://www.southribble.gov.uk', 'active', null, '', '', 'available', ARRAY['South Ribble']::text[]),
('South Staffordshire Council', 'England', 'West Midlands', 'Staffordshire', 'district', 'E07000196', 'E60000121', 'South Staffordshire', 218, 'yes', 'Idox', '2026-10-26', 29557, 'https://planning.sstaffs.gov.uk/online-applications/search.do?action=advanced', 'https://www.sstaffs.gov.uk', 'active', null, '', '', 'available', ARRAY['South Staffordshire']::text[]),
('South Tyneside Council', 'England', 'North East', '', 'metropolitan borough', 'E08000023', 'E60000011', 'South Tyneside', 280, 'yes', 'PlanningExplorer', '2026-10-26', 29354, 'https://planning.southtyneside.info/Northgate/PlanningExplorer/GeneralSearch.aspx', 'https://www.southtyneside.info', 'active', null, '', '', 'available', ARRAY['South Tyneside']::text[]),
('Southampton City Council', 'England', 'South East', '', 'unitary', 'E06000045', 'E60000229', 'Southampton', 45, 'yes', 'Idox', '2026-10-28', 42719, 'https://planningpublicaccess.southampton.gov.uk/online-applications/search.do?action=advanced', 'https://www.southampton.gov.uk/', 'active', null, '', '', 'available', ARRAY['Southampton']::text[]),
('Southend-on-Sea Borough Council', 'England', 'East of England', '', 'unitary', 'E06000033', 'E60000147', 'Southend', 33, 'yes', 'Idox', '2026-10-26', 42416, 'https://publicaccess.southend.gov.uk/online-applications/search.do?action=advanced', 'https://www.southend.gov.uk', 'active', null, '', '', 'available', ARRAY['Southend']::text[]),
('Spelthorne Borough Council', 'England', 'South East', 'Surrey', 'district', 'E07000213', 'E60000276', 'Spelthorne', 235, 'yes', 'Idox', '2026-10-29', 31997, 'https://publicaccess.spelthorne.gov.uk/online-applications/search.do?action=advanced', 'https://www.spelthorne.gov.uk', 'active', null, '', '', 'available', ARRAY['Spelthorne']::text[]),
('St Albans City and District Council', 'England', 'East of England', 'Hertfordshire', 'district', 'E07000240', 'E60000171', 'St Albans', 133, 'yes', 'CivicaJson', '2026-10-05', 88037, 'https://planningapplications.stalbans.gov.uk/planning/search-applications', 'https://www.stalbans.gov.uk', 'active', null, '', '', 'available', ARRAY['St Albans']::text[]),
('St Helens Council', 'England', 'North West', '', 'metropolitan borough', 'E08000013', 'E60000050', 'St Helens', 270, 'yes', 'Idox', '2026-10-27', 34373, 'https://publicaccess.sthelens.gov.uk/online-applications/search.do?action=advanced', 'https://www.sthelens.gov.uk', 'active', null, '', '', 'available', ARRAY['St Helens']::text[]),
('Stafford Borough Council', 'England', 'West Midlands', 'Staffordshire', 'district', 'E07000197', 'E60000122', 'Stafford', 219, 'yes', 'Idox', '2026-10-21', 33639, 'https://www12.staffordbc.gov.uk/online-applications/search.do?action=advanced', 'https://www.staffordbc.gov.uk', 'active', null, '', '', 'available', ARRAY['Stafford']::text[]),
('Staffordshire Moorlands District Council', 'England', 'West Midlands', 'Staffordshire', 'district', 'E07000198', 'E60000123', 'Staffordshire Moorlands', 220, 'yes', 'AppSearchServ', '2026-10-30', 30756, 'http://publicaccess.staffsmoorlands.gov.uk/portal/servlets/ApplicationSearchServlet', 'https://www.staffsmoorlands.gov.uk', 'active', null, '', '', 'available', ARRAY['Staffordshire Moorlands']::text[]),
('Stevenage Borough Council', 'England', 'East of England', 'Hertfordshire', 'district', 'E07000243', 'E60000172', 'Stevenage', 134, 'yes', 'Idox', '2026-10-27', 15833, 'https://publicaccess.stevenage.gov.uk/online-applications/search.do?action=advanced', 'https://www.stevenage.gov.uk', 'active', null, '', '', 'available', ARRAY['Stevenage']::text[]),
('Stockport Metropolitan Borough Council', 'England', 'North West', '', 'metropolitan borough', 'E08000007', 'E60000031', 'Stockport', 264, 'yes', 'Idox', '2026-10-29', 85152, 'https://planning.stockport.gov.uk/PlanningData-live/search.do?action=advanced', 'https://www.stockport.gov.uk', 'active', null, '', '', 'available', ARRAY['Stockport']::text[]),
('Stockton-on-Tees Borough Council', 'England', 'North East', '', 'unitary', 'E06000004', 'E60000007', 'Stockton-on-Tees', 4, 'yes', 'Idox', '2026-10-27', 36697, 'https://www.developmentmanagement.stockton.gov.uk/online-applications/search.do?action=advanced', 'https://www.stockton.gov.uk', 'active', null, '', '', 'available', ARRAY['Stockton-on-Tees']::text[]),
('Stoke-on-Trent City Council', 'England', 'West Midlands', '', 'unitary', 'E06000021', 'E60000115', 'Stoke on Trent', 21, 'yes', 'Tascomi', '2026-06-23', 30261, 'https://development.stoke.gov.uk/planning/index.html?fa=search', 'https://www.stoke.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-06-23)', 'available', ARRAY['Stoke on Trent']::text[]),
('Stratford-on-Avon District Council', 'England', 'West Midlands', 'Warwickshire', 'district', 'E07000221', 'E60000128', 'Stratford on Avon', 243, 'yes', 'Custom', '2026-10-25', 83664, 'https://apps.stratford.gov.uk/EplanningV2/', 'https://www.stratford.gov.uk', 'active', null, '', '', 'available', ARRAY['Stratford on Avon']::text[]),
('Stroud District Council', 'England', 'South West', 'Gloucestershire', 'district', 'E07000082', 'E60000312', 'Stroud', 115, 'yes', 'Idox', '2026-10-29', 59173, 'https://publicaccess.stroud.gov.uk/online-applications/search.do?action=advanced', 'https://www.stroud.gov.uk', 'active', null, '', '', 'available', ARRAY['Stroud']::text[]),
('Sunderland City Council', 'England', 'North East', '', 'metropolitan borough', 'E08000024', 'E60000012', 'Sunderland', 281, 'yes', 'Idox', '2026-10-28', 42444, 'https://online-applications.sunderland.gov.uk/online-applications/search.do?action=advanced', 'https://www.sunderland.gov.uk', 'active', null, '', '', 'available', ARRAY['Sunderland']::text[]),
('Surrey Heath Borough Council', 'England', 'South East', 'Surrey', 'district', 'E07000214', 'E60000277', 'Surrey Heath', 236, 'yes', 'Idox', '2026-10-29', 37634, 'https://publicaccess.surreyheath.gov.uk/online-applications/search.do?action=advanced', 'https://www.surreyheath.gov.uk', 'active', null, '', '', 'available', ARRAY['Surrey Heath']::text[]),
('Swale Borough Council', 'England', 'South East', 'Kent', 'district', 'E07000113', 'E60000261', 'Swale', 146, 'yes (via shared service)', '', null, null, 'https://pa.midkent.gov.uk/online-applications/search.do?action=advanced', 'https://www.swale.gov.uk', 'active', null, '', 'applications under PlanIt area ''Mid Kent'' (id 508, Idox)', 'shared', ARRAY['Mid Kent']::text[]),
('Swindon Borough Council', 'England', 'South West', '', 'unitary', 'E06000030', 'E60000297', 'Swindon', 30, 'yes', 'Idox', '2026-10-30', 48035, 'https://pa.swindon.gov.uk/publicaccess/search.do?action=advanced', 'https://www.swindon.gov.uk', 'active', null, '', '', 'available', ARRAY['Swindon']::text[]),
('Tameside Metropolitan Borough Council', 'England', 'North West', '', 'metropolitan borough', 'E08000008', 'E60000032', 'Tameside', 265, 'yes', 'Idox', '2026-10-27', 32390, 'https://publicaccess.tameside.gov.uk/online-applications/search.do?action=advanced', 'https://www.tameside.gov.uk', 'active', null, '', '', 'available', ARRAY['Tameside']::text[]),
('Tamworth Borough Council', 'England', 'West Midlands', 'Staffordshire', 'district', 'E07000199', 'E60000124', 'Tamworth', 221, 'yes', 'PlanningExplorer', '2026-10-29', 13917, 'https://planning.tamworth.gov.uk/Northgate/PlanningExplorerAA/GeneralSearch.aspx', 'https://www.tamworth.gov.uk', 'active', null, '', '', 'available', ARRAY['Tamworth']::text[]),
('Tandridge District Council', 'England', 'South East', 'Surrey', 'district', 'E07000215', 'E60000278', 'Tandridge', 237, 'yes', 'Custom', '2026-10-30', 47871, 'https://tdcplanningsearch.tandridge.gov.uk/', 'https://www.tandridge.gov.uk', 'active', null, '', '', 'available', ARRAY['Tandridge']::text[]),
('Teignbridge District Council', 'England', 'South West', 'Devon', 'district', 'E07000045', 'E60000305', 'Teignbridge', 85, 'yes', 'Idox', '2026-10-30', 54344, 'https://publicaccess.teignbridge.gov.uk/online-applications/search.do?action=advanced', 'https://www.teignbridge.gov.uk', 'active', null, '', '', 'available', ARRAY['Teignbridge']::text[]),
('Telford & Wrekin Council', 'England', 'West Midlands', '', 'unitary', 'E06000020', 'E60000116', 'Telford', 20, 'yes', 'Custom', '2026-10-26', 45201, 'https://secure.telford.gov.uk/planning/search-all.aspx', 'https://www.telford.gov.uk', 'active', null, '', '', 'available', ARRAY['Telford']::text[]),
('Tendring District Council', 'England', 'East of England', 'Essex', 'district', 'E07000076', 'E60000164', 'Tendring', 109, 'yes', 'Idox', '2026-10-27', 45778, 'https://idox.tendringdc.gov.uk/online-applications/search.do?action=advanced', 'https://www.tendringdc.gov.uk', 'active', null, '', '', 'available', ARRAY['Tendring']::text[]),
('Test Valley Borough Council', 'England', 'South East', 'Hampshire', 'district', 'E07000093', 'E60000251', 'Test Valley', 126, 'yes', 'Idox', '2026-10-30', 59033, 'https://view-applications.testvalley.gov.uk/online-applications/search.do?action=advanced', 'https://www.testvalley.gov.uk', 'active', null, '', '', 'available', ARRAY['Test Valley']::text[]),
('Tewkesbury Borough Council', 'England', 'South West', 'Gloucestershire', 'district', 'E07000083', 'E60000313', 'Tewkesbury', 116, 'yes', 'Idox IdoxPeriod', '2026-09-28', 34108, 'https://publicaccess.tewkesbury.gov.uk/online-applications/search.do?action=advanced', 'https://tewkesbury.gov.uk', 'active', null, '', '', 'available', ARRAY['Tewkesbury']::text[]),
('Thanet District Council', 'England', 'South East', 'Kent', 'district', 'E07000114', 'E60000262', 'Thanet', 147, 'yes', 'Tascomi', '2026-07-31', 36287, 'https://planning.thanet.gov.uk/online-applications/search.do?action=advanced', 'https://thanet.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-07-31)', 'available', ARRAY['Thanet']::text[]),
('Three Rivers District Council', 'England', 'East of England', 'Hertfordshire', 'district', 'E07000102', 'E60000173', 'Three Rivers', 135, 'yes', 'Idox', '2026-10-30', 48339, 'https://www3.threerivers.gov.uk/online-applications/search.do?action=advanced', 'https://www.threerivers.gov.uk', 'active', null, '', '', 'available', ARRAY['Three Rivers']::text[]),
('Thurrock Council', 'England', 'East of England', '', 'unitary', 'E06000034', 'E60000148', 'Thurrock', 34, 'yes', 'Idox', '2026-10-26', 33189, 'https://regs.thurrock.gov.uk/online-applications/search.do?action=advanced', 'https://www.thurrock.gov.uk', 'active', null, '', '', 'available', ARRAY['Thurrock']::text[]),
('Tonbridge and Malling Borough Council', 'England', 'South East', 'Kent', 'district', 'E07000115', 'E60000263', 'Tonbridge', 148, 'yes', 'Idox', '2026-10-29', 63958, 'https://publicaccess.tmbc.gov.uk/online-applications/search.do?action=advanced', 'https://www.tmbc.gov.uk', 'active', null, '', '', 'available', ARRAY['Tonbridge']::text[]),
('Torbay Council', 'England', 'South West', '', 'unitary', 'E06000027', 'E60000298', 'Torbay', 27, 'yes', 'Idox', '2026-10-30', 39711, 'https://publicaccess.torbay.gov.uk/view/search.do?action=advanced', 'https://www.torbay.gov.uk', 'active', null, '', '', 'available', ARRAY['Torbay']::text[]),
('Torridge District Council', 'England', 'South West', 'Devon', 'district', 'E07000046', 'E60000306', 'Torridge', 86, 'yes', 'Idox', '2026-09-07', 31283, 'https://publicaccess.torridge.gov.uk/online-applications/search.do?action=advanced', 'https://www.torridge.gov.uk', 'active', null, '', '', 'available', ARRAY['Torridge']::text[]),
('Trafford Metropolitan Borough Council', 'England', 'North West', '', 'metropolitan borough', 'E08000009', 'E60000033', 'Trafford', 266, 'yes', 'Idox', '2026-10-30', 68092, 'https://publicaccess.trafford.gov.uk/online-applications/search.do?action=advanced', 'https://www.trafford.gov.uk', 'active', null, '', '', 'available', ARRAY['Trafford']::text[]),
('Tunbridge Wells Borough Council', 'England', 'South East', 'Kent', 'district', 'E07000116', 'E60000264', 'Tunbridge Wells', 149, 'yes', 'Idox', '2026-10-28', 80591, 'https://twbcpa.midkent.gov.uk/online-applications/search.do?action=advanced', 'https://www.tunbridgewells.gov.uk', 'active', null, '', '', 'available', ARRAY['Tunbridge Wells']::text[]);

INSERT INTO local_planning_authorities (name, nation, region, county, type, gss_code, lpa_gss_code, planit_area_name, planit_area_id, planit_covered, planit_scraper_type, planit_latest_app_date, planit_total_apps, planning_portal_url, website, status, end_date, successor, notes, coverage, planit_query_areas)
VALUES
('Uttlesford District Council', 'England', 'East of England', 'Essex', 'district', 'E07000077', 'E60000165', 'Uttlesford', 110, 'yes', 'Idox', '2026-10-29', 61889, 'https://publicaccess.uttlesford.gov.uk/online-applications/search.do?action=advanced', 'https://www.uttlesford.gov.uk', 'active', null, '', '', 'available', ARRAY['Uttlesford']::text[]),
('Vale of White Horse District Council', 'England', 'South East', 'Oxfordshire', 'district', 'E07000180', 'E60000268', 'Vale of White Horse', 207, 'yes', 'Atrium', '2026-10-27', 56767, 'https://valeofwhitehorse.planning-register.co.uk/Search/Results', 'https://www.whitehorsedc.gov.uk', 'active', null, '', '', 'available', ARRAY['Vale of White Horse']::text[]),
('Wakefield Metropolitan District Council', 'England', 'Yorkshire and the Humber', '', 'metropolitan borough', 'E08000036', 'E60000072', 'Wakefield', 293, 'yes', 'Idox', '2026-10-28', 70453, 'https://planning.wakefield.gov.uk/online-applications/search.do?action=advanced', 'https://www.wakefield.gov.uk', 'active', null, '', '', 'available', ARRAY['Wakefield']::text[]),
('Walsall Metropolitan Borough Council', 'England', 'West Midlands', '', 'metropolitan borough', 'E08000030', 'E60000135', 'Walsall', 287, 'yes', 'SwiftLG', '2026-10-29', 48885, 'https://planning.walsall.gov.uk/swift/apas/run/wphappcriteria.display', 'https://www.walsall.gov.uk', 'active', null, '', '', 'available', ARRAY['Walsall']::text[]),
('Warrington Borough Council', 'England', 'North West', '', 'unitary', 'E06000007', 'E60000018', 'Warrington', 7, 'yes', 'Tascomi', '2026-06-30', 63910, 'https://online.warrington.gov.uk/planning/index.html?fa=search', 'https://www.warrington.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-06-30)', 'available', ARRAY['Warrington']::text[]),
('Warwick District Council', 'England', 'West Midlands', 'Warwickshire', 'district', 'E07000222', 'E60000129', 'Warwick', 244, 'yes', 'Idox', '2026-10-28', 46702, 'https://planningdocuments.warwickdc.gov.uk/online-applications/search.do?action=advanced', 'https://www.warwickdc.gov.uk', 'active', null, '', '', 'available', ARRAY['Warwick']::text[]),
('Watford Borough Council', 'England', 'East of England', 'Hertfordshire', 'district', 'E07000103', 'E60000174', 'Watford', 136, 'yes', 'Idox', '2026-10-28', 30512, 'https://pa.watford.gov.uk/publicaccess/search.do?action=advanced', 'https://www.watford.gov.uk', 'active', null, '', '', 'available', ARRAY['Watford']::text[]),
('Waverley Borough Council', 'England', 'South East', 'Surrey', 'district', 'E07000216', 'E60000279', 'Waverley', 238, 'yes', 'CivicaJson', '2026-10-29', 72405, 'https://planning360.waverley.gov.uk:4443/planning/search-applications', 'https://www.waverley.gov.uk/', 'active', null, '', '', 'available', ARRAY['Waverley']::text[]),
('Wealden District Council', 'England', 'South East', 'East Sussex', 'district', 'E07000065', 'E60000241', 'Wealden', 98, 'yes', 'Atrium', '2026-10-29', 87717, 'https://planning.wealden.gov.uk/Search/Advanced/', 'https://www.wealden.gov.uk', 'active', null, '', '', 'available', ARRAY['Wealden']::text[]),
('Welwyn Hatfield Borough Council', 'England', 'East of England', 'Hertfordshire', 'district', 'E07000241', 'E60000175', 'Welwyn Hatfield', 137, 'yes', 'Atrium', '2026-10-26', 55717, 'https://planning.welhat.gov.uk/Search/Advanced/', 'https://www.welhat.gov.uk', 'active', null, '', '', 'available', ARRAY['Welwyn Hatfield']::text[]),
('West Berkshire Council', 'England', 'South East', '', 'unitary', 'E06000037', 'E60000230', 'West Berkshire', 37, 'yes', 'Idox', '2026-10-29', 67226, 'https://publicaccess.westberks.gov.uk/online-applications/search.do?action=advanced', 'https://www.westberks.gov.uk', 'active', null, '', '', 'available', ARRAY['West Berkshire']::text[]),
('West Devon Borough Council', 'England', 'South West', 'Devon', 'district', 'E07000047', 'E60000307', 'West Devon', 87, 'yes (via shared service)', '', null, null, '', 'https://www.westdevon.gov.uk', 'active', null, '', 'applications under PlanIt area ''South West Devon'' (id 510, Atrium)', 'shared', ARRAY['South West Devon']::text[]),
('West Lancashire Borough Council', 'England', 'North West', 'Lancashire', 'district', 'E07000127', 'E60000045', 'West Lancashire', 160, 'yes', 'Idox', '2026-10-29', 36212, 'https://pa.westlancs.gov.uk/online-applications/search.do?action=advanced', 'https://www.westlancs.gov.uk', 'active', null, '', '', 'available', ARRAY['West Lancashire']::text[]),
('West Lindsey District Council', 'England', 'East Midlands', 'Lincolnshire', 'district', 'E07000142', 'E60000098', 'West Lindsey', 175, 'yes', 'Custom', '2026-10-28', 33323, 'https://westlindsey-publicportal.statmap.co.uk/horizoNext/publicportal', 'https://www.west-lindsey.gov.uk', 'active', null, '', '', 'available', ARRAY['West Lindsey']::text[]),
('West Northamptonshire Council', 'England', 'East Midlands', '', 'unitary', 'E06000062', 'E60000333', 'West Northamptonshire', 519, 'yes', 'Atrium Northants', '2026-10-27', 130824, 'https://wnc.planning-register.co.uk/Search/Advanced/', 'https://www.westnorthants.gov.uk/', 'active', null, '', '', 'available', ARRAY['West Northamptonshire']::text[]),
('West Oxfordshire District Council', 'England', 'South East', 'Oxfordshire', 'district', 'E07000181', 'E60000269', 'West Oxfordshire', 208, 'yes', 'Idox', '2026-10-29', 50596, 'https://publicaccess.westoxon.gov.uk/online-applications/search.do?action=advanced', 'https://www.westoxon.gov.uk', 'active', null, '', '', 'available', ARRAY['West Oxfordshire']::text[]),
('West Suffolk Council', 'England', 'East of England', 'Suffolk', 'district', 'E07000245', 'E60000187', 'West Suffolk', 497, 'yes', 'Idox', '2026-10-27', 69057, 'https://planning.westsuffolk.gov.uk/online-applications/search.do?action=advanced', 'https://www.westsuffolk.gov.uk', 'active', null, '', '', 'available', ARRAY['West Suffolk']::text[]),
('Westmorland and Furness Council', 'England', 'North West', '', 'unitary', 'E06000064', 'E60000335', 'Westmorland and Furness', 523, 'yes', 'Atrium', '2026-10-26', 61676, 'https://planningregister.westmorlandandfurness.gov.uk/Search/Advanced', 'https://www.westmorlandandfurness.gov.uk/', 'active', null, '', '', 'available', ARRAY['Westmorland and Furness']::text[]),
('Wigan Metropolitan Borough Council', 'England', 'North West', '', 'metropolitan borough', 'E08000010', 'E60000034', 'Wigan', 267, 'yes', 'Idox', '2026-10-27', 45885, 'https://planning.wigan.gov.uk/online-applications/search.do?action=advanced', 'https://www.wigan.gov.uk', 'active', null, '', '', 'available', ARRAY['Wigan']::text[]),
('Wiltshire Council', 'England', 'South West', '', 'unitary', 'E06000054', 'E60000299', 'Wiltshire', 54, 'yes', 'Custom', '2026-10-30', 230889, 'https://development.wiltshire.gov.uk/pr/s/?tabset-167f1=3', 'https://wiltshire.gov.uk', 'active', null, '', '', 'available', ARRAY['Wiltshire']::text[]),
('Winchester City Council', 'England', 'South East', 'Hampshire', 'district', 'E07000094', 'E60000252', 'Winchester', 127, 'yes', 'Idox', '2026-10-30', 60675, 'https://planningapps.winchester.gov.uk/online-applications/search.do?action=advanced', 'https://www.winchester.gov.uk', 'active', null, '', '', 'available', ARRAY['Winchester']::text[]),
('Wirral Borough Council', 'England', 'North West', '', 'metropolitan borough', 'E08000015', 'E60000051', 'Wirral', 272, 'yes', 'Tascomi', '2026-06-30', 51019, 'https://online.wirral.gov.uk/planning/index.html?fa=search', 'https://www.wirral.gov.uk', 'active', null, '', 'PlanIt data stale (latest 2026-06-30)', 'available', ARRAY['Wirral']::text[]),
('Woking Borough Council', 'England', 'South East', 'Surrey', 'district', 'E07000217', 'E60000280', 'Woking', 239, 'yes', 'Idox', '2026-10-30', 41160, 'https://caps.woking.gov.uk/online-applications/search.do?action=advanced', 'https://www.woking.gov.uk', 'active', null, '', '', 'available', ARRAY['Woking']::text[]),
('Wokingham Borough Council', 'England', 'South East', '', 'unitary', 'E06000041', 'E60000232', 'Wokingham', 41, 'yes', 'Fastweb', '2026-10-29', 73640, 'https://planning.wokingham.gov.uk/FastWebPL/search.asp', 'https://www.wokingham.gov.uk', 'active', null, '', '', 'available', ARRAY['Wokingham']::text[]),
('Worcester City Council', 'England', 'West Midlands', 'Worcestershire', 'district', 'E07000237', 'E60000140', 'Worcester', 255, 'yes', 'Atrium', '2026-10-29', 23745, 'https://plan.worcester.gov.uk/Search/Advanced/', 'https://www.worcester.gov.uk', 'active', null, '', '', 'available', ARRAY['Worcester']::text[]),
('Worthing Borough Council', 'England', 'South East', 'West Sussex', 'district', 'E07000229', 'E60000287', 'Worthing', 251, 'yes (via shared service)', '', null, null, 'https://planning.adur-worthing.gov.uk/online-applications/search.do?action=advanced', 'https://www.adur-worthing.gov.uk', 'active', null, '', 'applications under PlanIt area ''Adur and Worthing'' (id 449, Idox)', 'shared', ARRAY['Adur and Worthing']::text[]),
('Wychavon District Council', 'England', 'West Midlands', 'Worcestershire', 'district', 'E07000238', 'E60000141', 'Wychavon', 256, 'yes', 'Atrium', '2026-10-29', 56322, 'https://plan.wychavon.gov.uk/Search/Advanced/', 'https://www.wychavon.gov.uk', 'active', null, '', '', 'available', ARRAY['Wychavon']::text[]),
('Wyre Borough Council', 'England', 'North West', 'Lancashire', 'district', 'E07000128', 'E60000046', 'Wyre', 161, 'yes', 'Idox', '2026-10-29', 31657, 'https://publicaccess.wyre.gov.uk/online-applications/search.do?action=advanced', 'https://www.wyre.gov.uk', 'active', null, '', '', 'available', ARRAY['Wyre']::text[]),
('Wyre Forest District Council', 'England', 'West Midlands', 'Worcestershire', 'district', 'E07000239', 'E60000142', 'Wyre Forest', 257, 'yes', 'Idox Idox', '2026-10-28', 21297, 'https://planningpa.wyreforestdc.gov.uk/online-applications/search.do?action=advanced', 'https://www.wyreforestdc.gov.uk', 'active', null, '', '', 'available', ARRAY['Wyre Forest']::text[]),
('Yorkshire Dales National Park Authority', 'England', 'Yorkshire and the Humber', '', 'national park', 'E26000012', 'E60000327', 'Yorkshire Dales', 361, 'yes', 'Agile', '2026-10-27', 21038, 'https://planning.agileapplications.co.uk/yorkshiredales/search-applications/', 'https://www.yorkshiredales.org.uk', 'active', null, '', '', 'available', ARRAY['Yorkshire Dales']::text[]),
('Antrim and Newtownabbey Borough Council', 'Northern Ireland', 'Northern Ireland', '', 'district council', 'N09000001', '', 'Antrim and Newtownabbey', 498, 'yes', 'NIPortal', '2026-10-22', 30760, 'https://planningregister.planningsystemni.gov.uk/simple-search', 'https://www.antrimandnewtownabbey.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Antrim and Newtownabbey']::text[]),
('Ards and North Down Borough Council', 'Northern Ireland', 'Northern Ireland', '', 'district council', 'N09000011', '', 'Ards and North Down', 499, 'yes', 'NIPortal', '2026-10-29', 36579, 'https://planningregister.planningsystemni.gov.uk/simple-search', 'https://www.ardsandnorthdown.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Ards and North Down']::text[]),
('Armagh City, Banbridge and Craigavon Borough Council', 'Northern Ireland', 'Northern Ireland', '', 'district council', 'N09000002', '', 'Armagh Banbridge Craigavon', 500, 'yes', 'NIPortal', '2026-10-23', 56555, 'https://planningregister.planningsystemni.gov.uk/simple-search', 'https://www.armaghbanbridgecraigavon.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Armagh Banbridge Craigavon']::text[]),
('Belfast City Council', 'Northern Ireland', 'Northern Ireland', '', 'district council', 'N09000003', '', 'Belfast', 448, 'yes', 'NIPortal', '2026-10-29', 56233, 'https://planningregister.planningsystemni.gov.uk/simple-search', 'https://www.belfastcity.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Belfast']::text[]),
('Causeway Coast and Glens Borough Council', 'Northern Ireland', 'Northern Ireland', '', 'district council', 'N09000004', '', 'Causeway and Glens', 501, 'yes', 'NIPortal', '2026-10-28', 48159, 'https://planningregister.planningsystemni.gov.uk/simple-search', 'https://www.causewaycoastandglens.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Causeway and Glens']::text[]),
('Derry City and Strabane District Council', 'Northern Ireland', 'Northern Ireland', '', 'district council', 'N09000005', '', 'Derry and Strabane', 502, 'yes', 'NIPortal', '2026-10-23', 33456, 'https://planningregister.planningsystemni.gov.uk/simple-search', 'https://www.derrycityandstrabanedistrict.com/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Derry and Strabane']::text[]),
('Fermanagh and Omagh District Council', 'Northern Ireland', 'Northern Ireland', '', 'district council', 'N09000006', '', 'Fermanagh and Omagh', 503, 'yes', 'NIPortal', '2026-10-30', 50488, 'https://planningregister.planningsystemni.gov.uk/simple-search', 'https://www.fermanaghomagh.com/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Fermanagh and Omagh']::text[]),
('Lisburn and Castlereagh City Council', 'Northern Ireland', 'Northern Ireland', '', 'district council', 'N09000007', '', 'Lisburn and Castlereagh', 504, 'yes', 'NIPortal', '2026-10-28', 36358, 'https://planningregister.planningsystemni.gov.uk/simple-search', 'https://www.lisburncastlereagh.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Lisburn and Castlereagh']::text[]),
('Mid Ulster District Council', 'Northern Ireland', 'Northern Ireland', '', 'district council', 'N09000009', '', 'Mid Ulster', 506, 'yes', 'Idox', '2026-10-29', 54168, 'https://planning.midulstercouncil.org/online-applications/search.do?action=advanced', 'https://www.midulstercouncil.org/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Mid Ulster']::text[]),
('Mid and East Antrim Borough Council', 'Northern Ireland', 'Northern Ireland', '', 'district council', 'N09000008', '', 'Mid East Antrim', 505, 'yes', 'NIPortal', '2026-10-29', 33227, 'https://planningregister.planningsystemni.gov.uk/simple-search', 'https://www.midandeastantrim.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Mid East Antrim']::text[]);

INSERT INTO local_planning_authorities (name, nation, region, county, type, gss_code, lpa_gss_code, planit_area_name, planit_area_id, planit_covered, planit_scraper_type, planit_latest_app_date, planit_total_apps, planning_portal_url, website, status, end_date, successor, notes, coverage, planit_query_areas)
VALUES
('Newry, Mourne and Down District Council', 'Northern Ireland', 'Northern Ireland', '', 'district council', 'N09000010', '', 'Newry Mourne Down', 507, 'yes', 'NIPortal', '2026-10-29', 62901, 'https://planningregister.planningsystemni.gov.uk/simple-search', 'https://www.newrymournedown.org/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Newry Mourne Down']::text[]),
('Aberdeen City Council', 'Scotland', 'Scotland', '', 'council', 'S12000033', '', 'Aberdeen', 384, 'yes', 'Idox', '2026-10-30', 48894, 'https://publicaccess.aberdeencity.gov.uk/online-applications/search.do?action=advanced', 'https://www.aberdeencity.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Aberdeen']::text[]),
('Aberdeenshire Council', 'Scotland', 'Scotland', '', 'council', 'S12000034', '', 'Aberdeenshire', 385, 'yes', 'Idox', '2026-10-30', 78715, 'https://upa.aberdeenshire.gov.uk/online-applications/search.do?action=advanced', 'https://www.aberdeenshire.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Aberdeenshire']::text[]),
('Angus Council', 'Scotland', 'Scotland', '', 'council', 'S12000041', '', 'Angus', 391, 'yes', 'Idox', '2026-10-27', 30243, 'https://planning.angus.gov.uk/online-applications/search.do?action=advanced', 'https://www.angus.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Angus']::text[]),
('Argyll and Bute Council', 'Scotland', 'Scotland', '', 'council', 'S12000035', '', 'Argyll', 386, 'yes', 'Idox', '2026-10-06', 46889, 'https://publicaccess.argyll-bute.gov.uk/online-applications/search.do?action=advanced', 'https://www.argyll-bute.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Argyll']::text[]),
('Cairngorms National Park', 'Scotland', 'Scotland', '', 'national park', 'S21000003', '', 'Cairngorms', 397, 'yes', 'Idox', '2026-10-30', 9896, 'https://www.eplanningcnpa.co.uk/online-applications/search.do?action=advanced', 'https://cairngorms.co.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Cairngorms']::text[]),
('Clackmannanshire Council', 'Scotland', 'Scotland', '', 'council', 'S12000005', '', 'Clackmannanshire', 364, 'yes', 'Idox', '2026-10-28', 8399, 'https://publicaccess.clacks.gov.uk/publicaccess/search.do?action=advanced', 'https://www.clacks.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Clackmannanshire']::text[]),
('Dumfries and Galloway Council', 'Scotland', 'Scotland', '', 'council', 'S12000006', '', 'Dumfries', 365, 'yes', 'Idox', '2026-10-30', 54720, 'https://eaccess.dumgal.gov.uk/online-applications/search.do?action=advanced', 'https://www.dumgal.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Dumfries']::text[]),
('Dundee City Council', 'Scotland', 'Scotland', '', 'council', 'S12000042', '', 'Dundee', 392, 'yes', 'Idox', '2026-10-29', 20809, 'https://idoxwam.dundeecity.gov.uk/idoxpa-web/search.do?action=advanced', 'https://www.dundeecity.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Dundee']::text[]),
('East Ayrshire Council', 'Scotland', 'Scotland', '', 'council', 'S12000008', '', 'East Ayrshire', 366, 'yes', 'Idox', '2026-10-28', 26354, 'https://eplanning.east-ayrshire.gov.uk/online/search.do?action=advanced', 'https://www.east-ayrshire.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['East Ayrshire']::text[]),
('East Dunbartonshire Council', 'Scotland', 'Scotland', '', 'council', 'S12000045', '', 'East Dunbartonshire', 394, 'yes', 'Idox', '2026-10-27', 21412, 'https://planning.eastdunbarton.gov.uk/online-applications/search.do?action=advanced', 'https://www.eastdunbarton.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['East Dunbartonshire']::text[]),
('East Lothian District Council', 'Scotland', 'Scotland', '', 'council', 'S12000010', '', 'East Lothian', 367, 'yes', 'Idox', '2026-10-30', 29669, 'https://pa.eastlothian.gov.uk/online-applications/search.do?action=advanced', 'https://www.eastlothian.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['East Lothian']::text[]),
('East Renfrewshire Council', 'Scotland', 'Scotland', '', 'council', 'S12000011', '', 'East Renfrewshire', 368, 'yes', 'Idox', '2026-10-29', 20302, 'https://ercbuildingstandards.eastrenfrewshire.gov.uk/buildingstandards/search.do?action=advanced', 'https://www.eastrenfrewshire.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['East Renfrewshire']::text[]),
('Edinburgh City Council', 'Scotland', 'Scotland', '', 'council', 'S12000036', '', 'Edinburgh', 387, 'yes', 'Idox', '2026-10-28', 126960, 'https://citydev-portal.edinburgh.gov.uk/idoxpa-web/search.do?action=advanced', 'https://www.edinburgh.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Edinburgh']::text[]),
('Falkirk Council', 'Scotland', 'Scotland', '', 'council', 'S12000014', '', 'Falkirk', 370, 'yes', 'Idox', '2026-10-27', 20837, 'https://edevelopment.falkirk.gov.uk/online/search.do?action=advanced', 'https://www.falkirk.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Falkirk']::text[]),
('Fife Council', 'Scotland', 'Scotland', '', 'council', 'S12000015', '', 'Fife', 371, 'yes', 'Idox', '2026-10-28', 79893, 'https://planning.fife.gov.uk/online/search.do?action=advanced', 'https://www.fife.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Fife']::text[]),
('Glasgow City Council', 'Scotland', 'Scotland', '', 'council', 'S12000046', '', 'Glasgow', 395, 'yes', 'Idox', '2026-10-26', 70861, 'https://publicaccess.glasgow.gov.uk/online-applications/search.do?action=advanced', 'https://www.glasgow.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Glasgow']::text[]),
('Highland Council', 'Scotland', 'Scotland', '', 'council', 'S12000017', '', 'Highland', 372, 'yes', 'Idox', '2026-10-23', 95324, 'https://wam.highland.gov.uk/wam/search.do?action=advanced', 'https://www.highland.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Highland']::text[]),
('Inverclyde Council', 'Scotland', 'Scotland', '', 'council', 'S12000018', '', 'Inverclyde', 373, 'yes', 'Idox', '2026-10-27', 7972, 'https://planning.inverclyde.gov.uk/Online/search.do?action=advanced', 'https://www.inverclyde.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Inverclyde']::text[]),
('Loch Lomond and The Trossachs National Park', 'Scotland', 'Scotland', '', 'national park', 'S21000002', '', 'Loch Lomond', 396, 'yes', 'Idox', '2026-10-22', 9780, 'https://eplanning.lochlomond-trossachs.org/OnlinePlanning/search.do?action=advanced', 'https://www.lochlomond-trossachs.org/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Loch Lomond']::text[]),
('Midlothian Council', 'Scotland', 'Scotland', '', 'council', 'S12000019', '', 'Midlothian', 374, 'yes', 'Idox', '2026-10-29', 17667, 'https://planning-applications.midlothian.gov.uk/OnlinePlanning/search.do?action=advanced', 'https://www.midlothian.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Midlothian']::text[]),
('Moray Council', 'Scotland', 'Scotland', '', 'council', 'S12000020', '', 'Moray', 375, 'yes', 'Idox', '2026-10-28', 26926, 'https://publicaccess.moray.gov.uk/eplanning/search.do?action=advanced', 'https://www.moray.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Moray']::text[]),
('North Ayrshire Council', 'Scotland', 'Scotland', '', 'council', 'S12000021', '', 'North Ayrshire', 376, 'yes', 'Idox', '2026-10-29', 21518, 'https://www.eplanning.north-ayrshire.gov.uk/OnlinePlanning/search.do?action=advanced', 'https://www.north-ayrshire.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['North Ayrshire']::text[]),
('North Lanarkshire Council', 'Scotland', 'Scotland', '', 'council', 'S12000044', '', 'North Lanarkshire', 393, 'yes', 'Idox', '2026-10-27', 41936, 'https://eplanning.northlanarkshire.gov.uk/online-applications/search.do?action=advanced', 'https://www.northlan.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['North Lanarkshire']::text[]),
('Orkney Islands Council', 'Scotland', 'Scotland', '', 'council', 'S12000023', '', 'Orkney', 377, 'yes', 'Idox', '2026-10-16', 11772, 'https://planningandwarrant.orkney.gov.uk/online-applications/search.do?action=advanced', 'https://www.orkney.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Orkney']::text[]),
('Perth and Kinross Council', 'Scotland', 'Scotland', '', 'council', 'S12000024', '', 'Perth', 378, 'yes', 'Idox', '2026-10-29', 51219, 'https://planningapps.pkc.gov.uk/online-applications/search.do?action=advanced', 'https://www.pkc.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Perth']::text[]),
('Renfrewshire Council', 'Scotland', 'Scotland', '', 'council', 'S12000038', '', 'Renfrewshire', 388, 'yes', 'Idox', '2026-10-26', 22850, 'https://pl-bs.renfrewshire.gov.uk/online-applications/search.do?action=advanced', 'https://www.renfrewshire.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Renfrewshire']::text[]),
('Scottish Borders Council', 'Scotland', 'Scotland', '', 'council', 'S12000026', '', 'Scottish Borders', 379, 'yes', 'Idox', '2026-10-30', 41009, 'https://eplanning.scotborders.gov.uk/online-applications/search.do?action=advanced', 'https://www.scotborders.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Scottish Borders']::text[]),
('Shetland Islands Council', 'Scotland', 'Scotland', '', 'council', 'S12000027', '', 'Shetlands', 380, 'yes', 'Idox', '2026-10-28', 12322, 'https://pa.shetland.gov.uk/online-applications/search.do?action=advanced', 'https://www.shetland.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Shetlands']::text[]),
('South Ayrshire Council', 'Scotland', 'Scotland', '', 'council', 'S12000028', '', 'South Ayrshire', 381, 'yes', 'Idox', '2026-10-29', 32579, 'https://publicaccess.south-ayrshire.gov.uk/online-applications/search.do?action=advanced', 'https://www.south-ayrshire.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['South Ayrshire']::text[]),
('South Lanarkshire Council', 'Scotland', 'Scotland', '', 'council', 'S12000029', '', 'South Lanarkshire', 382, 'yes', 'Idox', '2026-10-21', 40502, 'https://publicaccess.southlanarkshire.gov.uk/online-applications/search.do?action=advanced', 'https://www.southlanarkshire.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['South Lanarkshire']::text[]),
('Stirling Council', 'Scotland', 'Scotland', '', 'council', 'S12000030', '', 'Stirling', 383, 'yes', 'Idox', '2026-10-28', 24341, 'https://pabs.stirling.gov.uk/online-applications/search.do?action=advanced', 'https://www.stirling.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Stirling']::text[]),
('West Dunbartonshire Council', 'Scotland', 'Scotland', '', 'council', 'S12000039', '', 'West Dunbartonshire', 389, 'yes', 'Custom', '2026-10-27', 8593, 'https://apps.west-dunbarton.gov.uk/dcsearch_app.asp', 'https://www.west-dunbarton.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['West Dunbartonshire']::text[]),
('West Lothian Council', 'Scotland', 'Scotland', '', 'council', 'S12000040', '', 'West Lothian', 390, 'yes', 'Idox', '2026-10-23', 28026, 'https://planning.westlothian.gov.uk/publicaccess/search.do?action=advanced', 'https://www.westlothian.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['West Lothian']::text[]),
('Western Isles Council', 'Scotland', 'Scotland', '', 'council', 'S12000013', '', 'Western Isles', 369, 'yes', 'Idox', '2026-10-30', 14645, 'https://planning.cne-siar.gov.uk/PublicAccess/search.do?action=advanced', 'https://www.cne-siar.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Western Isles']::text[]),
('Blaenau Gwent County Borough Council', 'Wales', 'Wales', '', 'council', 'W06000019', '', 'Blaenau Gwent', 414, 'yes', 'Tascomi', '2026-07-02', 4228, 'https://developmentservices.blaenau-gwent.gov.uk/planning/index.html?fa=search', 'https://www.blaenau-gwent.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only); PlanIt data stale (latest 2026-07-02)', 'available', ARRAY['Blaenau Gwent']::text[]),
('Brecon Beacons National Park', 'Wales', 'Wales', '', 'national park', 'W18000001', '', 'Brecon Beacons', 420, 'yes', 'Idox', '2026-10-26', 13824, 'https://planningonline.beacons-npa.gov.uk/online-applications/search.do?action=advanced', 'https://www.beacons-npa.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Brecon Beacons']::text[]),
('Bridgend County Borough Council', 'Wales', 'Wales', '', 'council', 'W06000013', '', 'Bridgend', 409, 'yes', 'Atrium', '2026-10-26', 32997, 'https://planning.bridgend.gov.uk/search/Planning/Advanced/', 'https://www.bridgend.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Bridgend']::text[]),
('Caerphilly County Borough Council', 'Wales', 'Wales', '', 'council', 'W06000018', '', 'Caerphilly', 413, 'yes', 'Idox', '2026-10-26', 30634, 'https://publicaccess.caerphilly.gov.uk/PublicAccess/search.do?action=advanced', 'https://www.caerphilly.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Caerphilly']::text[]),
('Cardiff Council', 'Wales', 'Wales', '', 'council', 'W06000015', '', 'Cardiff', 411, 'yes', 'Idox', '2026-10-29', 77242, 'https://www.cardiffidoxcloud.wales/publicaccess/search.do?action=advanced', 'https://www.cardiff.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Cardiff']::text[]);

INSERT INTO local_planning_authorities (name, nation, region, county, type, gss_code, lpa_gss_code, planit_area_name, planit_area_id, planit_covered, planit_scraper_type, planit_latest_app_date, planit_total_apps, planning_portal_url, website, status, end_date, successor, notes, coverage, planit_query_areas)
VALUES
('Carmarthenshire County Council', 'Wales', 'Wales', '', 'council', 'W06000010', '', 'Carmarthenshire', 406, 'yes', 'Custom', '2026-10-21', 55445, 'https://carmarthenshire.my.site.com/en/s/?tabset-a3431=3', 'https://www.carmarthenshire.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Carmarthenshire']::text[]),
('Ceredigion County Council', 'Wales', 'Wales', '', 'council', 'W06000008', '', 'Ceredigion', 404, 'yes', 'Tascomi', '2026-06-23', 29339, 'https://ceredigion-online.tascomi.com/planning/index.html?fa=search', 'https://www.ceredigion.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only); PlanIt data stale (latest 2026-06-23)', 'available', ARRAY['Ceredigion']::text[]),
('City and County of Swansea', 'Wales', 'Wales', '', 'council', 'W06000011', '', 'Swansea', 407, 'yes', 'Idox', '2026-10-29', 61148, 'https://property.swansea.gov.uk/online-applications/search.do?action=advanced', 'https://www.swansea.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Swansea']::text[]),
('Conwy County Borough Council', 'Wales', 'Wales', '', 'council', 'W06000003', '', 'Conwy', 400, 'yes', 'PlanningExplorer', '2026-10-20', 30211, 'https://npe.conwy.gov.uk/Northgate/EnglishPlanningExplorer/generalsearch.aspx', 'https://www.conwy.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Conwy']::text[]),
('Denbighshire County Council', 'Wales', 'Wales', '', 'council', 'W06000004', '', 'Denbighshire', 401, 'yes', 'CivicaJson Tascomi', '2026-06-19', 29845, 'https://planningandpublicprotection.denbighshire.gov.uk/planning/index.html?fa=search', 'https://www.denbighshire.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only); PlanIt data stale (latest 2026-06-19)', 'available', ARRAY['Denbighshire']::text[]),
('Flintshire County Council', 'Wales', 'Wales', '', 'council', 'W06000005', '', 'Flintshire', 402, 'yes', 'Agile', '2026-10-29', 35821, 'https://planning.agileapplications.co.uk/flintshire/search-applications/', 'https://www.flintshire.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Flintshire']::text[]),
('Gwynedd County Council', 'Wales', 'Wales', '', 'council', 'W06000002', '', 'Gwynedd', 399, 'yes', 'Tascomi', '2026-07-02', 34356, 'https://amg.gwynedd.llyw.cymru/planning/index.html?fa=search', 'https://www.gwynedd.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only); PlanIt data stale (latest 2026-07-02)', 'available', ARRAY['Gwynedd']::text[]),
('Isle of Anglesey County Council', 'Wales', 'Wales', '', 'council', 'W06000001', '', 'Anglesey', 398, 'yes', 'Arcus', '2026-10-26', 28650, 'https://planning-public-register.anglesey.gov.wales/prIoA/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.anglesey.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Anglesey']::text[]),
('Merthyr Tydfil County Borough Council', 'Wales', 'Wales', '', 'council', 'W06000024', '', 'Merthyr Tydfil', 419, 'yes', 'Idox', '2026-10-29', 11781, 'https://publicaccess.merthyr.gov.uk/online-applications/search.do?action=advanced', 'https://www.merthyr.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Merthyr Tydfil']::text[]),
('Monmouthshire County Council', 'Wales', 'Wales', '', 'council', 'W06000021', '', 'Monmouthshire', 416, 'yes', 'Idox', '2026-10-26', 33777, 'https://planningonline.monmouthshire.gov.uk/online-applications/search.do?action=advanced', 'https://www.monmouthshire.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Monmouthshire']::text[]),
('Neath & Port Talbot County Borough Council', 'Wales', 'Wales', '', 'council', 'W06000012', '', 'Neath', 408, 'yes', 'Idox', '2026-10-28', 31123, 'https://planningonline.npt.gov.uk/online-applications/search.do?action=advanced', 'https://www.neath-porttalbot.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Neath']::text[]),
('Newport City Council', 'Wales', 'Wales', '', 'council', 'W06000022', '', 'Newport', 417, 'yes', 'Idox', '2026-10-26', 35752, 'https://publicaccess.newport.gov.uk/online-applications/search.do?action=advanced', 'https://www.newport.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Newport']::text[]),
('Pembrokeshire Coast National Park', 'Wales', 'Wales', '', 'national park', 'W18000002', '', 'Pembroke Coast', 421, 'yes', 'Agile', '2026-10-28', 17177, 'https://planning.agileapplications.co.uk/pcnpa/search-applications/', 'https://www.pembrokeshirecoast.org.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Pembroke Coast']::text[]),
('Pembrokeshire County Council', 'Wales', 'Wales', '', 'council', 'W06000009', '', 'Pembrokeshire', 405, 'yes', 'Agile', '2026-10-21', 33986, 'https://planning.agileapplications.co.uk/pembrokeshire/search-applications/', 'https://www.pembrokeshire.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Pembrokeshire']::text[]),
('Powys County Council', 'Wales', 'Wales', '', 'council', 'W06000023', '', 'Powys', 418, 'yes', 'Arcus', '2026-10-29', 48893, 'https://service.powys.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.powys.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Powys']::text[]),
('Rhondda Cynnon Taf County Borough Council', 'Wales', 'Wales', '', 'council', 'W06000016', '', 'Rhondda', 412, 'yes', 'Idox', '2026-10-26', 80214, 'https://planonline.rctcbc.gov.uk/online-applications/search.do?action=advanced', 'https://www.rhondda-cynon-taf.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Rhondda']::text[]),
('Snowdonia National Park Authority', 'Wales', 'Wales', '', 'national park', 'W18000003', '', 'Snowdonia', 422, 'yes', 'Agile', '2026-10-26', 14734, 'https://planning.agileapplications.co.uk/snowdonia/search-applications/', 'https://www.snowdonia-npa.gov.uk/', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Snowdonia']::text[]),
('Torfaen County Borough Council', 'Wales', 'Wales', '', 'council', 'W06000020', '', 'Torfaen', 415, 'yes', 'Idox', '2026-10-27', 18244, 'https://planningonline.torfaen.gov.uk/online-applications/search.do?action=advanced', 'https://www.torfaen.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Torfaen']::text[]),
('Vale of Glamorgan Council', 'Wales', 'Wales', '', 'council', 'W06000014', '', 'Glamorgan', 410, 'yes', 'Atrium', '2026-10-28', 42821, 'https://vogonline.planning-register.co.uk/Search/Planning/Advanced/', 'https://www.valeofglamorgan.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Glamorgan']::text[]),
('Wrexham County Borough Council', 'Wales', 'Wales', '', 'council', 'W06000006', '', 'Wrexham', 403, 'yes', 'Arcus', '2026-10-22', 30297, 'https://register.wrexham.gov.uk/pr/s/register-view?language=en_GB&c__r=Arcus_BE_Public_Register', 'https://www.wrexham.gov.uk', 'active', null, '', 'name/GSS from PlanIt; not in planning.data.gov.uk (England-only)', 'available', ARRAY['Wrexham']::text[]),
('Allerdale Borough Council', 'England', 'North West', 'Cumbria', 'district', 'E07000026', 'E60000019', 'Allerdale', 66, 'yes', 'Arcus', '2026-10-29', 34546, 'https://cumberlandcouncil.my.site.com/pr3/s/register-view?c__r=Arcus_BE_Public_Register', 'https://www.allerdale.gov.uk', 'abolished', '2023-03-31', 'Cumberland Council', '', 'available', ARRAY['Allerdale']::text[]),
('Aylesbury Vale District Council', 'England', 'South East', '', 'district', 'E07000004', 'E60000233', 'Aylesbury Vale', 57, 'no', '', null, null, '', 'https://www.aylesburyvaledc.gov.uk', 'abolished', '2020-03-31', 'Buckinghamshire Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Barrow-in-Furness Borough Council', 'England', 'North West', 'Cumbria', 'district', 'E07000027', 'E60000020', 'Barrow', 67, 'yes', 'Custom', '2026-10-15', 5854, 'https://webapps.barrowbc.gov.uk/webapps/f?p=BARROWPLANNINGHUB:APPLICATIONSEARCH:0', 'https://www.barrowbc.gov.uk', 'abolished', '2023-03-31', 'Westmorland and Furness Council', '', 'available', ARRAY['Barrow']::text[]),
('Borough of Poole', 'England', 'South West', '', 'unitary', 'E06000029', '', 'Poole', 29, 'no', '', null, null, '', 'https://www.boroughofpoole.com', 'abolished', '2019-03-31', 'BCP Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Bournemouth Borough Council', 'England', 'South West', '', 'unitary', 'E06000028', '', 'Bournemouth', 28, 'no', '', null, null, '', 'https://www.bournemouth.gov.uk', 'abolished', '2019-03-31', 'BCP Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Carlisle City Council', 'England', 'North West', 'Cumbria', 'district', 'E07000028', 'E60000021', 'Carlisle', 68, 'yes', 'Idox', '2026-10-28', 34020, 'https://publicaccess.carlisle.gov.uk/online-applications/search.do?action=advanced', 'https://www.carlisle.gov.uk', 'abolished', '2023-03-31', 'Cumberland Council', '', 'available', ARRAY['Carlisle']::text[]),
('Chiltern District Council', 'England', 'South East', '', 'district', 'E07000005', 'E60000234', 'Chiltern', 58, 'no', '', null, null, 'https://pa.chilternsouthbucks.gov.uk/online-applications/search.do?action=advanced', 'https://www.chiltern.gov.uk', 'abolished', '2020-03-31', 'Buckinghamshire Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Christchurch Borough Council', 'England', 'South West', '', 'district', 'E07000048', '', 'Christchurch', 88, 'no', '', null, null, '', 'https://www.dorsetforyou.com', 'abolished', '2019-03-31', 'BCP Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Copeland Borough Council', 'England', 'North West', 'Cumbria', 'district', 'E07000029', 'E60000022', 'Copeland', 69, 'yes', 'Custom', '2026-10-29', 2882, 'https://www.cumberland.gov.uk/planning/application-search', 'https://www.copeland.gov.uk', 'abolished', '2023-03-31', 'Cumberland Council', '', 'available', ARRAY['Copeland']::text[]),
('Corby Borough Council', 'England', 'East Midlands', '', 'district', 'E07000150', 'E60000099', 'Corby', 183, 'no', '', null, null, '', 'https://www.corby.gov.uk', 'abolished', '2021-03-31', 'North Northamptonshire Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Craven District Council', 'England', 'Yorkshire and the Humber', '', 'district', 'E07000163', 'E60000057', 'Craven', 190, 'yes', 'Idox', '2025-12-22', 25920, 'https://publicaccess.northyorks.gov.uk/online-applications/search.do?action=advanced', 'https://www.cravendc.gov.uk', 'abolished', '2023-03-31', 'North Yorkshire Council', '', 'available', ARRAY['Craven']::text[]),
('Daventry District Council', 'England', 'East Midlands', '', 'district', 'E07000151', 'E60000100', 'Daventry', 184, 'no', '', null, null, '', 'https://www.daventrydc.gov.uk', 'abolished', '2021-03-31', 'West Northamptonshire Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('East Dorset District Council', 'England', 'South West', '', 'district', 'E07000049', '', 'East Dorset', 89, 'no', '', null, null, '', 'http://www.eastdorsetdc.gov.uk/', 'abolished', '2019-03-31', 'Dorset Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('East Northamptonshire Council', 'England', 'East Midlands', '', 'district', 'E07000152', 'E60000101', 'East Northamptonshire', 185, 'no', '', null, null, '', 'https://www.east-northamptonshire.gov.uk', 'abolished', '2021-03-31', 'North Northamptonshire Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Eden District Council', 'England', 'North West', 'Cumbria', 'district', 'E07000030', 'E60000023', 'Eden', 70, 'no', '', null, null, '', 'https://www.eden.gov.uk', 'abolished', '2023-03-31', 'Westmorland and Furness Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Forest Heath District Council', 'England', 'East of England', 'Suffolk', 'district', 'E07000201', '', 'Forest Heath', 223, 'no', '', null, null, 'https://planning.westsuffolk.gov.uk/online-applications/search.do?action=advanced', 'https://www.forest-heath.gov.uk', 'abolished', '2019-03-31', 'West Suffolk Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Hambleton District Council', 'England', 'Yorkshire and the Humber', '', 'district', 'E07000164', 'E60000058', 'Hambleton', 191, 'yes', 'Idox', '2026-06-10', 92972, 'https://publicaccess.northyorks.gov.uk/online-applications/search.do?action=advanced', 'https://www.hambleton.gov.uk', 'abolished', '2023-03-31', 'North Yorkshire Council', '', 'available', ARRAY['Hambleton']::text[]),
('Harrogate Borough Council', 'England', 'Yorkshire and the Humber', '', 'district', 'E07000165', 'E60000059', 'Harrogate', 192, 'yes', 'Idox', '2025-04-08', 80459, 'https://publicaccess.northyorks.gov.uk/online-applications/search.do?action=advanced', 'https://www.harrogate.gov.uk', 'abolished', '2023-03-31', 'North Yorkshire Council', '', 'available', ARRAY['Harrogate']::text[]),
('Kettering Borough Council', 'England', 'East Midlands', '', 'district', 'E07000153', 'E60000102', 'Kettering', 186, 'no', '', null, null, '', 'https://www.kettering.gov.uk', 'abolished', '2021-03-31', 'North Northamptonshire Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('London Legacy Development Corporation', 'England', 'England', '', 'development corporation', 'E51000001', 'E60000329', 'London Legacy', 496, 'no', '', null, null, 'https://www.queenelizabetholympicpark.co.uk/transfer-planning-powers', 'https://www.queenelizabetholympicpark.co.uk/planning-authority/planning-policy', 'abolished', '2024-12-01', 'Planning powers returned to LB Hackney, Newham, Tower Hamlets, Waltham Forest (Dec 2024)', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]);

INSERT INTO local_planning_authorities (name, nation, region, county, type, gss_code, lpa_gss_code, planit_area_name, planit_area_id, planit_covered, planit_scraper_type, planit_latest_app_date, planit_total_apps, planning_portal_url, website, status, end_date, successor, notes, coverage, planit_query_areas)
VALUES
('Mendip District Council', 'England', 'South West', '', 'district', 'E07000187', 'E60000314', 'Mendip', 209, 'yes', 'Idox', '2026-10-28', 58848, 'https://publicaccess.mendip.gov.uk/online-applications/search.do?action=advanced', 'https://www.mendip.gov.uk', 'abolished', '2023-03-31', 'Somerset Council', '', 'available', ARRAY['Mendip']::text[]),
('North Dorset District Council', 'England', 'South West', '', 'district', 'E07000050', '', 'North Dorset', 90, 'no', '', null, null, '', 'https://www.dorsetforyou.com', 'abolished', '2019-03-31', 'Dorset Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Northampton Borough Council', 'England', 'East Midlands', '', 'district', 'E07000154', 'E60000103', 'Northampton', 187, 'no', '', null, null, '', 'https://www.northampton.gov.uk', 'abolished', '2020-03-31', 'West Northamptonshire Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Purbeck District Council', 'England', 'South West', '', 'district', 'E07000051', '', 'Purbeck', 91, 'no', '', null, null, '', 'https://www.dorsetforyou.com', 'abolished', '2019-03-31', 'Dorset Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Richmondshire District Council', 'England', 'Yorkshire and the Humber', '', 'district', 'E07000166', 'E60000060', 'Richmondshire', 193, 'yes', 'Idox', '2026-10-06', 19090, 'https://planning.richmondshire.gov.uk/online-applications/search.do?action=advanced', 'https://richmondshire.gov.uk', 'abolished', '2023-03-31', 'North Yorkshire Council', '', 'available', ARRAY['Richmondshire']::text[]),
('Ryedale District Council', 'England', 'Yorkshire and the Humber', '', 'district', 'E07000167', 'E60000061', 'Ryedale', 194, 'yes', 'Idox', '2026-09-22', 19860, 'https://planningregister.ryedale.gov.uk/caonline-applications/search.do?action=advanced', 'https://www.ryedale.gov.uk', 'abolished', '2023-03-31', 'North Yorkshire Council', '', 'available', ARRAY['Ryedale']::text[]),
('Scarborough Borough Council', 'England', 'Yorkshire and the Humber', '', 'district', 'E07000168', 'E60000062', 'Scarborough', 195, 'yes', 'Idox', '2025-10-20', 25629, 'https://publicaccess.northyorks.gov.uk/online-applications/search.do?action=advanced', 'https://www.scarborough.gov.uk', 'abolished', '2023-03-31', 'North Yorkshire Council', '', 'available', ARRAY['Scarborough']::text[]),
('Sedgemoor District Council', 'England', 'South West', '', 'district', 'E07000188', 'E60000315', 'Sedgemoor', 210, 'yes', 'Custom', '2026-10-29', 43522, 'https://sdc.somerset.gov.uk/Planning_Online/', 'https://www.sedgemoor.gov.uk', 'abolished', '2023-03-31', 'Somerset Council', '', 'available', ARRAY['Sedgemoor']::text[]),
('Selby District Council', 'England', 'Yorkshire and the Humber', '', 'district', 'E07000169', 'E60000063', 'Selby', 196, 'yes', 'Idox', '2026-06-08', 59784, 'https://publicaccess.northyorks.gov.uk/online-applications/search.do?action=advanced', 'https://www.selby.gov.uk', 'abolished', '2023-03-31', 'North Yorkshire Council', '', 'available', ARRAY['Selby']::text[]),
('Somerset West and Taunton Council', 'England', 'South West', '', 'district', 'E07000246', 'E60000316', 'Somerset West and Taunton', 517, 'yes (via legacy/child areas)', '', null, null, 'https://www.somersetwestandtaunton.gov.uk/planning/find-a-planning-application/', 'https://www.somersetwestandtaunton.gov.uk', 'abolished', '2023-03-31', 'Somerset Council', 'applications under PlanIt areas: Taunton Deane (Custom), West Somerset (Idox)', 'legacy', ARRAY['Allerdale','Carlisle','Copeland']::text[]),
('South Bucks District Council', 'England', 'South East', '', 'district', 'E07000006', 'E60000235', 'South Bucks', 59, 'no', '', null, null, 'https://pa.chilternsouthbucks.gov.uk/online-applications/search.do?action=advanced', 'https://www.southbucks.gov.uk', 'abolished', '2020-03-31', 'Buckinghamshire Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('South Lakeland District Council', 'England', 'North West', 'Cumbria', 'district', 'E07000031', 'E60000024', 'South Lakeland', 71, 'no', '', null, null, '', 'https://www.southlakeland.gov.uk', 'abolished', '2023-03-31', 'Westmorland and Furness Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('South Northamptonshire Council', 'England', 'East Midlands', '', 'district', 'E07000155', 'E60000104', 'South Northamptonshire', 188, 'no', '', null, null, '', 'https://www.southnorthants.gov.uk', 'abolished', '2021-03-31', 'West Northamptonshire Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('South Somerset District Council', 'England', 'South West', '', 'district', 'E07000189', 'E60000317', 'South Somerset', 211, 'yes', 'Idox', '2026-10-29', 74480, 'https://publicaccess.southsomerset.gov.uk/online-applications/search.do?action=advanced', 'https://www.southsomerset.gov.uk', 'abolished', '2023-03-31', 'Somerset Council', '', 'available', ARRAY['South Somerset']::text[]),
('St Edmundsbury Borough Council', 'England', 'East of England', 'Suffolk', 'district', 'E07000204', '', 'St Edmundsbury', 226, 'no', '', null, null, 'https://planning.westsuffolk.gov.uk/online-applications/search.do?action=advanced', 'https://www.stedmundsbury.gov.uk', 'abolished', '2019-03-31', 'West Suffolk Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Suffolk Coastal District Council', 'England', 'East of England', 'Suffolk', 'district', 'E07000205', '', 'Suffolk Coastal', 227, 'no', '', null, null, 'https://publicaccess.eastsuffolk.gov.uk/online-applications/search.do?action=advanced', 'https://www.suffolkcoastal.gov.uk', 'abolished', '2019-03-31', 'East Suffolk Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Taunton Deane Borough Council', 'England', 'South West', '', 'district', 'E07000190', '', 'Taunton Deane', 212, 'yes', 'Custom', '2026-10-23', 39610, 'https://www3.somersetwestandtaunton.gov.uk/asp/webpages/plan/plapplookup.asp', 'https://www.tauntondeane.gov.uk', 'abolished', '2019-03-31', 'Somerset West and Taunton Council', '', 'available', ARRAY['Taunton Deane']::text[]),
('Waveney District Council', 'England', 'East of England', 'Suffolk', 'district', 'E07000206', '', 'Waveney', 228, 'no', '', null, null, 'https://publicaccess.eastsuffolk.gov.uk/online-applications/search.do?action=advanced', 'https://www.waveney.gov.uk', 'abolished', '2019-03-31', 'East Suffolk Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Wellingborough Borough Council', 'England', 'East Midlands', '', 'district', 'E07000156', 'E60000105', 'Wellingborough', 189, 'no', '', null, null, '', 'https://www.wellingborough.gov.uk', 'abolished', '2021-03-31', 'North Northamptonshire Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('West Dorset District Council', 'England', 'South West', '', 'district', 'E07000052', '', 'West Dorset', 92, 'no', '', null, null, '', 'https://www.dorsetforyou.com', 'abolished', '2019-03-31', 'Dorset Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('West Somerset District Council', 'England', 'South West', '', 'district', 'E07000191', '', 'West Somerset', 213, 'yes', 'Idox', '2026-10-26', 12749, 'https://www1.somersetwestandtaunton.gov.uk/online-applications/search.do?action=advanced', 'https://www.westsomersetonline.gov.uk', 'abolished', '2019-03-31', 'Somerset West and Taunton Council', '', 'available', ARRAY['West Somerset']::text[]),
('Weymouth and Portland Borough Council', 'England', 'South West', '', 'district', 'E07000053', '', 'Weymouth', 93, 'no', '', null, null, '', 'https://www.dorsetforyou.com', 'abolished', '2019-03-31', 'Dorset Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]),
('Wycombe District Council', 'England', 'South East', '', 'district', 'E07000007', 'E60000236', 'Wycombe', 60, 'no', '', null, null, '', 'https://www.wycombe.gov.uk', 'abolished', '2020-03-31', 'Buckinghamshire Council', 'PlanIt area exists but is_planning=false', 'unavailable', ARRAY[]::text[]);

-- pg_cron schedule
-- PlanIt ingestion schedule. Apply this on the hosted Supabase project
-- (SQL editor or `supabase db push`). The local docker database and the
-- Drizzle migration runner do not load pg_cron.
--
-- Hobby Vercel projects reject cron expressions that run more than once a day,
-- so the timetable lives here. pg_cron runs in UTC.
--
-- Store the same value as Vercel CRON_SECRET before the job can succeed.
-- Do not put that value in this file:
--
--   select vault.create_secret(
--     '<paste the Vercel CRON_SECRET value>',
--     'cron_secret',
--     'Bearer token for https://planningpal.vercel.app/api/cron/ingest'
--   );

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'planningpal-planit-ingest') then
    perform cron.unschedule('planningpal-planit-ingest');
  end if;
end $$;

select cron.schedule(
  'planningpal-planit-ingest',
  '0 6,13,20 * * *',
  $job$
  select net.http_post(
    url := 'https://planningpal.vercel.app/api/cron/ingest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization',
      'Bearer ' || coalesce(
        (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1),
        ''
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $job$
);
