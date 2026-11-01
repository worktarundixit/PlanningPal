CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  permissions text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS planning_applications_ref_idx ON planning_applications (application_ref);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS planning_applications_hash_idx ON planning_applications (composite_hash);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS planning_applications_outcode_idx ON planning_applications (outcode);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS planning_applications_region_idx ON planning_applications (region);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS planning_applications_value_idx ON planning_applications (value_to_m);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS planning_applications_geom_idx ON planning_applications USING gist (geom);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS saved_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES planning_applications(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS saved_schemes_user_app_idx ON saved_schemes (user_id, application_id);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS crm_leads_client_stage_idx ON crm_leads (client_id, stage);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS sending_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  inboxes integer NOT NULL DEFAULT 0,
  health text NOT NULL DEFAULT 'Setup',
  status text NOT NULL DEFAULT 'Verifying',
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS persona_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stakeholder text NOT NULL DEFAULT 'Lead architect',
  angle text NOT NULL DEFAULT '',
  proof_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  when_label text NOT NULL,
  firm text NOT NULL,
  scheme text NOT NULL,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  issued_on text NOT NULL,
  number text NOT NULL,
  amount text NOT NULL,
  status text NOT NULL DEFAULT 'Paid'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
