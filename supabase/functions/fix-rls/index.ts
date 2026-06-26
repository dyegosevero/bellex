import postgres from "npm:postgres@3";

Deno.serve(async () => {
  const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { ssl: "require", max: 1 });

  // Ver owner_id atual das clínicas e usuários existentes
  const clinics = await sql`SELECT id, name, owner_id, customer_id FROM workspace_clinics`;
  const customers = await sql`SELECT id, client_name, owner_id FROM workspace_customers`;
  const users = await sql`SELECT id, email FROM auth.users LIMIT 10`;

  // Corrigir owner_id: cada clínica deve ter o owner_id do workspace owner
  // workspace_clinics.customer_id → workspace_customers.id → workspace_customers.owner_id
  const fixed = await sql`
    UPDATE workspace_clinics wc
    SET owner_id = wsc.owner_id
    FROM workspace_customers wsc
    WHERE wc.customer_id = wsc.id
      AND (wc.owner_id IS NULL OR wc.owner_id != wsc.owner_id)
    RETURNING wc.id, wc.name, wc.owner_id
  `;

  // Também fixar policy de update para usar customer_id como fallback
  try {
    await sql`DROP POLICY IF EXISTS "ws_auth_update" ON workspace_clinics`;
    await sql`
      CREATE POLICY "ws_auth_update" ON workspace_clinics
      FOR UPDATE TO authenticated
      USING (
        owner_id = auth.uid()
        OR customer_id IN (SELECT id FROM workspace_customers WHERE owner_id = auth.uid())
      )
    `;
  } catch(e) { /* ignore */ }

  await sql.end();
  return Response.json({ clinics, customers, users, fixed });
});
