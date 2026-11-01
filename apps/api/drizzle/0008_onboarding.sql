-- Resumable onboarding lives on the user. Existing accounts stay finished so the command centre does not send them back through setup.
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step text NOT NULL DEFAULT 'done';
--> statement-breakpoint
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_skipped text[] NOT NULL DEFAULT ARRAY[]::text[];
--> statement-breakpoint
ALTER TABLE users ADD COLUMN IF NOT EXISTS checklist_dismissed boolean NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN IF NOT EXISTS alerts_enabled boolean NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN IF NOT EXISTS alert_frequency text NOT NULL DEFAULT 'immediate';
--> statement-breakpoint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_onboarding_step_check;
--> statement-breakpoint
ALTER TABLE users ADD CONSTRAINT users_onboarding_step_check CHECK (onboarding_step IN ('workspace', 'profile', 'icp', 'team', 'alerts', 'done'));
--> statement-breakpoint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_alert_frequency_check;
--> statement-breakpoint
ALTER TABLE users ADD CONSTRAINT users_alert_frequency_check CHECK (alert_frequency IN ('immediate', 'daily', 'weekly', 'off'));
--> statement-breakpoint
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS logo_url text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS coverage text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS project_types text[] NOT NULL DEFAULT ARRAY[]::text[];
--> statement-breakpoint
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS value_ranges text[] NOT NULL DEFAULT ARRAY[]::text[];
--> statement-breakpoint
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS riba_stages text[] NOT NULL DEFAULT ARRAY[]::text[];
--> statement-breakpoint
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS council_targets text[] NOT NULL DEFAULT ARRAY[]::text[];
