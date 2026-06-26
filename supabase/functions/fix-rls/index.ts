import postgres from "npm:postgres@3";

Deno.serve(async () => {
  const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { ssl: "require", max: 1 });
  const results = [];

  // Strategy: each clinic has ONE owner user (clinic_auth_user_id in workspace_clinics).
  // All data tables link to auth.uid() via owner_id.
  // RLS: users can only see rows where owner_id = auth.uid()
  // Superadmin (role='admin') bypasses via is_admin() function.

  const stmts = [
    // ── Helper functions ────────────────────────────────────────────────────
    `CREATE OR REPLACE FUNCTION public.is_admin()
     RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
       SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
     $$`,

    `CREATE OR REPLACE FUNCTION public.is_staff(uid uuid DEFAULT auth.uid())
     RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
       SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = uid)
     $$`,

    // ── Add owner_id to data tables that don't have it ───────────────────
    `ALTER TABLE clients       ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id)`,
    `ALTER TABLE appointments  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id)`,
    `ALTER TABLE charges       ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id)`,
    `ALTER TABLE products      ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id)`,
    `ALTER TABLE services      ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id)`,
    `ALTER TABLE leads         ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id)`,
    `ALTER TABLE messages      ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id)`,
    `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id)`,

    // ── Populate owner_id for existing rows from workspace_clinics ────────
    // Link existing data to the clinic owner via clinic_auth_user_id
    `UPDATE clients c SET owner_id = wc.clinic_auth_user_id
     FROM workspace_clinics wc
     WHERE c.owner_id IS NULL AND wc.clinic_auth_user_id IS NOT NULL
     LIMIT 1`,

    // ── RLS ON (enable if not already) ────────────────────────────────────
    `ALTER TABLE clients       ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE appointments  ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE charges       ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE products      ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE services      ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE leads         ENABLE ROW LEVEL SECURITY`,

    // ── Drop old permissive policies ──────────────────────────────────────
    `DROP POLICY IF EXISTS "staff_all_clients"      ON clients`,
    `DROP POLICY IF EXISTS "staff_all_appointments" ON appointments`,
    `DROP POLICY IF EXISTS "staff_all_charges"      ON charges`,
    `DROP POLICY IF EXISTS "staff_all_products"     ON products`,
    `DROP POLICY IF EXISTS "staff_all_services"     ON services`,
    `DROP POLICY IF EXISTS "staff_all_leads"        ON leads`,

    // ── New isolated policies ─────────────────────────────────────────────
    // clients: owner_id = auth.uid() OR is_admin() (bypass for SA)
    `CREATE POLICY "clinic_own_clients" ON clients FOR ALL TO authenticated
     USING (owner_id = auth.uid() OR is_admin())
     WITH CHECK (owner_id = auth.uid() OR is_admin())`,

    `CREATE POLICY "clinic_own_appointments" ON appointments FOR ALL TO authenticated
     USING (owner_id = auth.uid() OR is_admin())
     WITH CHECK (owner_id = auth.uid() OR is_admin())`,

    `CREATE POLICY "clinic_own_charges" ON charges FOR ALL TO authenticated
     USING (owner_id = auth.uid() OR is_admin())
     WITH CHECK (owner_id = auth.uid() OR is_admin())`,

    `CREATE POLICY "clinic_own_products" ON products FOR ALL TO authenticated
     USING (owner_id = auth.uid() OR is_admin())
     WITH CHECK (owner_id = auth.uid() OR is_admin())`,

    `CREATE POLICY "clinic_own_services" ON services FOR ALL TO authenticated
     USING (owner_id = auth.uid() OR is_admin())
     WITH CHECK (owner_id = auth.uid() OR is_admin())`,

    `CREATE POLICY "clinic_own_leads" ON leads FOR ALL TO authenticated
     USING (owner_id = auth.uid() OR is_admin())
     WITH CHECK (owner_id = auth.uid() OR is_admin())`,

    // ── Auto-set owner_id on INSERT via trigger ────────────────────────────
    `CREATE OR REPLACE FUNCTION public.set_owner_id()
     RETURNS trigger LANGUAGE plpgsql AS $$
     BEGIN NEW.owner_id := COALESCE(NEW.owner_id, auth.uid()); RETURN NEW; END $$`,

    `DROP TRIGGER IF EXISTS set_owner_clients      ON clients`,
    `DROP TRIGGER IF EXISTS set_owner_appointments ON appointments`,
    `DROP TRIGGER IF EXISTS set_owner_charges      ON charges`,
    `DROP TRIGGER IF EXISTS set_owner_products     ON products`,
    `DROP TRIGGER IF EXISTS set_owner_services     ON services`,
    `DROP TRIGGER IF EXISTS set_owner_leads        ON leads`,

    `CREATE TRIGGER set_owner_clients      BEFORE INSERT ON clients      FOR EACH ROW EXECUTE FUNCTION set_owner_id()`,
    `CREATE TRIGGER set_owner_appointments BEFORE INSERT ON appointments  FOR EACH ROW EXECUTE FUNCTION set_owner_id()`,
    `CREATE TRIGGER set_owner_charges      BEFORE INSERT ON charges       FOR EACH ROW EXECUTE FUNCTION set_owner_id()`,
    `CREATE TRIGGER set_owner_products     BEFORE INSERT ON products      FOR EACH ROW EXECUTE FUNCTION set_owner_id()`,
    `CREATE TRIGGER set_owner_services     BEFORE INSERT ON services      FOR EACH ROW EXECUTE FUNCTION set_owner_id()`,
    `CREATE TRIGGER set_owner_leads        BEFORE INSERT ON leads         FOR EACH ROW EXECUTE FUNCTION set_owner_id()`,
  ];

  for (const stmt of stmts) {
    try {
      await sql.unsafe(stmt);
      results.push({ ok: true, stmt: stmt.slice(0, 80) });
    } catch (e: unknown) {
      results.push({ ok: false, error: String(e), stmt: stmt.slice(0, 80) });
    }
  }

  await sql.end();
  return Response.json(results);
});
