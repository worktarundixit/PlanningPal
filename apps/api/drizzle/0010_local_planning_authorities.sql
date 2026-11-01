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
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS local_planning_authorities_gss_idx ON local_planning_authorities (gss_code);
--> statement-breakpoint
ALTER TABLE local_planning_authorities ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS lpa_read ON local_planning_authorities;
--> statement-breakpoint
CREATE POLICY lpa_read ON local_planning_authorities FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
GRANT SELECT ON local_planning_authorities TO authenticated;
