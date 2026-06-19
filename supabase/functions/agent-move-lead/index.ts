/**
 * agent-move-lead
 * Move um lead para outra etapa do pipeline.
 * Chamado pelo n8n após qualificação ou escalada para humano.
 *
 * Auth: x-bellex-api-key
 * Body: { lead_id, stage_id }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateApiKey, unauthorized, CORS } from "../_shared/auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  if (!(await validateApiKey(req))) return unauthorized();

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let body: { lead_id?: string; stage_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400, headers: CORS });
  }

  const { lead_id, stage_id } = body;
  if (!lead_id || !stage_id) {
    return new Response(JSON.stringify({ error: "lead_id e stage_id são obrigatórios" }), { status: 400, headers: CORS });
  }

  const { error } = await supabase
    .from("leads")
    .update({ stage_id, updated_at: new Date().toISOString() })
    .eq("id", lead_id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: CORS });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
