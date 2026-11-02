CREATE TABLE IF NOT EXISTS campaign_provider_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciphertext text NOT NULL,
  hint text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS campaign_provider_workspace_idx ON campaign_provider_mappings (provider_workspace_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS campaign_engine_links (
  campaign_id uuid PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  provider_campaign_id text NOT NULL
);
--> statement-breakpoint
ALTER TABLE campaign_provider_settings ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE campaign_provider_mappings ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE campaign_engine_links ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS campaign_provider_settings_admin ON campaign_provider_settings;
--> statement-breakpoint
CREATE POLICY campaign_provider_settings_admin ON campaign_provider_settings
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS campaign_provider_mappings_admin ON campaign_provider_mappings;
--> statement-breakpoint
CREATE POLICY campaign_provider_mappings_admin ON campaign_provider_mappings
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS campaign_engine_links_admin ON campaign_engine_links;
--> statement-breakpoint
CREATE POLICY campaign_engine_links_admin ON campaign_engine_links
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_provider_settings, campaign_provider_mappings, campaign_engine_links TO authenticated;
