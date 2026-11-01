ALTER TABLE clients RENAME TO organisations;
--> statement-breakpoint
ALTER TABLE users RENAME COLUMN client_id TO organisation_id;
--> statement-breakpoint
ALTER TABLE team_members RENAME COLUMN client_id TO organisation_id;
--> statement-breakpoint
ALTER TABLE custom_roles RENAME COLUMN client_id TO organisation_id;
--> statement-breakpoint
ALTER TABLE crm_leads RENAME COLUMN client_id TO organisation_id;
--> statement-breakpoint
ALTER TABLE activities RENAME COLUMN client_id TO organisation_id;
--> statement-breakpoint
ALTER TABLE campaigns RENAME COLUMN client_id TO organisation_id;
--> statement-breakpoint
ALTER TABLE sending_domains RENAME COLUMN client_id TO organisation_id;
--> statement-breakpoint
ALTER TABLE inbox_conversations RENAME COLUMN client_id TO organisation_id;
--> statement-breakpoint
ALTER TABLE intent_events RENAME COLUMN client_id TO organisation_id;
--> statement-breakpoint
ALTER TABLE persona_templates RENAME COLUMN client_id TO organisation_id;
--> statement-breakpoint
ALTER TABLE meetings RENAME COLUMN client_id TO organisation_id;
--> statement-breakpoint
ALTER TABLE invoices RENAME COLUMN client_id TO organisation_id;
--> statement-breakpoint
ALTER TABLE users ALTER COLUMN organisation_id DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN org_role text;
--> statement-breakpoint
UPDATE users SET org_role = 'owner' WHERE org_role IS NULL;
--> statement-breakpoint
ALTER TABLE users ALTER COLUMN org_role SET NOT NULL;
--> statement-breakpoint
ALTER TABLE users ALTER COLUMN org_role SET DEFAULT 'member';
--> statement-breakpoint
ALTER TABLE users ADD COLUMN platform_role text;
--> statement-breakpoint
UPDATE team_members SET role = lower(role) WHERE lower(role) IN ('owner', 'admin', 'member', 'viewer');
--> statement-breakpoint
ALTER TABLE team_members ALTER COLUMN role SET DEFAULT 'member';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS auth_user (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS auth_session_user_idx ON auth_session (user_id);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS auth_account_provider_idx ON auth_account (provider_id, account_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS auth_account_user_idx ON auth_account (user_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS auth_verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS auth_verification_identifier_idx ON auth_verification (identifier);
--> statement-breakpoint
ALTER TABLE users ADD COLUMN auth_user_id text UNIQUE REFERENCES auth_user(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE saved_schemes ADD COLUMN organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE;
--> statement-breakpoint
UPDATE saved_schemes AS saved
SET organisation_id = users.organisation_id
FROM users
WHERE saved.user_id = users.id AND saved.organisation_id IS NULL;
--> statement-breakpoint
DELETE FROM saved_schemes WHERE organisation_id IS NULL;
--> statement-breakpoint
ALTER TABLE saved_schemes ALTER COLUMN organisation_id SET NOT NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS saved_schemes_user_app_idx;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS saved_schemes_org_app_idx ON saved_schemes (organisation_id, application_id);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS mail_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
