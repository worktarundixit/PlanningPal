-- Private notes, tasks, and inbox messages stay with their author unless shared.
-- Platform ingest tables are not readable through the Data API, including for staff.
DROP POLICY IF EXISTS ingest_read ON pipeline_runs;
--> statement-breakpoint
DROP POLICY IF EXISTS raw_read ON raw_payloads;
--> statement-breakpoint
DROP POLICY IF EXISTS cursor_read ON ingest_cursors;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_read ON activities;
--> statement-breakpoint
CREATE POLICY tenant_read ON activities FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT public.member_workspace_ids())
    AND (
      shared
      OR type = 'system'
      OR user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
    )
  );
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_write ON activities;
--> statement-breakpoint
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
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_read ON inbox_messages;
--> statement-breakpoint
CREATE POLICY tenant_read ON inbox_messages FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT public.member_workspace_ids())
    AND (
      shared
      OR owner_user_id IS NULL
      OR owner_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
    )
  );
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_write ON inbox_messages;
--> statement-breakpoint
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
