BEGIN;
SET LOCAL app.current_tenant = 'fake_tenant_id';
SELECT id, "clientId" FROM "Lead";
COMMIT;
