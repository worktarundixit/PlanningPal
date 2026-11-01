DROP INDEX IF EXISTS planning_applications_ref_idx;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS planning_applications_authority_ref_idx ON planning_applications (local_authority, application_ref);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS raw_payloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  source text NOT NULL,
  request_url text NOT NULL DEFAULT '',
  body jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS ingest_cursors (
  source text PRIMARY KEY,
  last_different text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
