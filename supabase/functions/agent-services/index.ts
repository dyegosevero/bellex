import { createClient } from "npm:@supabase/supabase-js@2";
import { validateApiKey, unauthorized, CORS as cors } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!(await validateApiKey(req))) return unauthorized();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, price, duration_minutes")
    .eq("active", true)
    .order("name");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ services: data }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
