-- =============================================================================
-- SELL.DO CRM REPLICA: ROW LEVEL SECURITY POLICIES (RLS)
-- Enables strict tenant data isolation at the database level.
-- =============================================================================

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'User',
    'Team',
    'AuditLog',
    'PasswordResetToken',
    'Lead',
    'LeadActivity',
    'Project',
    'Tower',
    'ProjectUnit',
    'Booking',
    'CallLog',
    'SiteVisit',
    'Followup',
    'Task',
    'Campaign'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Enable and Force RLS on table
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);
    
    -- Drop existing policy if present
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
    
    -- Create strict tenant isolation policy
    -- Checks current_setting('app.current_tenant', true). If null, returns no rows.
    EXECUTE format(
      'CREATE POLICY tenant_isolation_policy ON %I
       FOR ALL
       USING ("clientId" = NULLIF(current_setting(''app.current_tenant'', true), ''''))
       WITH CHECK ("clientId" = NULLIF(current_setting(''app.current_tenant'', true), ''''));',
       tbl
    );
  END LOOP;
END $$;
