-- Contact Groups and Group Members for workspace campaign outreach
CREATE TABLE IF NOT EXISTS contact_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS contact_groups_org_idx ON contact_groups (organisation_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS contact_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  council text NOT NULL DEFAULT '',
  scheme_title text NOT NULL DEFAULT '',
  scheme_ref text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS contact_group_members_group_idx ON contact_group_members (group_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS contact_group_members_unique_lead ON contact_group_members (group_id, email);
--> statement-breakpoint
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS contact_groups_isolation ON contact_groups;
--> statement-breakpoint
CREATE POLICY contact_groups_isolation ON contact_groups FOR ALL TO authenticated
  USING (organisation_id = nullif(current_setting('app.current_organisation_id', true), '')::uuid)
  WITH CHECK (organisation_id = nullif(current_setting('app.current_organisation_id', true), '')::uuid);
--> statement-breakpoint
DROP POLICY IF EXISTS contact_group_members_isolation ON contact_group_members;
--> statement-breakpoint
CREATE POLICY contact_group_members_isolation ON contact_group_members FOR ALL TO authenticated
  USING (organisation_id = nullif(current_setting('app.current_organisation_id', true), '')::uuid)
  WITH CHECK (organisation_id = nullif(current_setting('app.current_organisation_id', true), '')::uuid);
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON contact_groups TO authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON contact_group_members TO authenticated;
