import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey      = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Authenticate caller
  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Não autorizado" }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user: caller } } = await callerClient.auth.getUser();
  if (!caller) return json({ error: "Não autorizado" }, 401);

  const { email, role = "admin", workspace_url = "https://bellex.beauty/workspace" } = await req.json();
  if (!email) return json({ error: "E-mail obrigatório" }, 400);

  const admin = createClient(supabaseUrl, serviceKey);

  // Upsert workspace_users row (idempotent)
  const { error: wsErr } = await admin.from("workspace_users").upsert({
    workspace_owner_id: caller.id,
    email,
    role,
    status: "pending",
    invited_at: new Date().toISOString(),
  }, { onConflict: "workspace_owner_id,email" });

  if (wsErr) return json({ error: wsErr.message }, 400);

  // Invite via Supabase Auth (sends magic-link email automatically)
  const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: workspace_url,
  });

  if (invErr && !invErr.message.includes("already been registered")) {
    return json({ error: invErr.message }, 400);
  }

  // If user already exists, update their user_id in workspace_users
  if (invited?.user?.id) {
    await admin.from("workspace_users")
      .update({ user_id: invited.user.id })
      .eq("workspace_owner_id", caller.id)
      .eq("email", email);
  }

  return json({ success: true, email });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
