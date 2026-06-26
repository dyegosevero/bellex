import postgres from "npm:postgres@3";

Deno.serve(async () => {
  const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { ssl: "require", max: 1 });
  const results = [];
  const stmts = [
    `ALTER TABLE workspace_clinics ADD COLUMN IF NOT EXISTS appearance jsonb DEFAULT '{}'`,
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
