CREATE OR REPLACE FUNCTION get_user_tenant_for_auth(p_email text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT "clientId" FROM "User" WHERE email = LOWER(TRIM(p_email)) LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_user_tenant_for_auth(text) TO selldo_app;
