-- Prevent users from self-escalating their role via the client-scoped
-- "Users can update own data" policy. Role changes must go through the
-- admin client (service_role), e.g. acceptInvite() or admin actions.

-- Uses auth.role() (Supabase helper reading the PostgREST JWT role claim),
-- the same check already used by other service-role-only policies in this
-- schema (see "Service role manages invites" in 00011_platform_settings_invites.sql).
CREATE OR REPLACE FUNCTION prevent_role_self_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'role changes require service role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_role_self_change ON users;
CREATE TRIGGER trg_prevent_role_self_change
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_self_change();

-- Tighten "Users can update own data": add WITH CHECK so a user cannot
-- update rows they don't own even if a future policy rewrite drops USING.
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
