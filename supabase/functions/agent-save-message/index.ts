/**
 * agent-save-message
 * Salva a resposta gerada pelo agente IA no banco.
 *
 * Auth: x-bellex-api-key
 * Body: { conversation_id, text, lead_id }
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

  let body: { conversation_id?: string; text?: string; lead_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400, headers: CORS });
  }

  const { conversation_id, text, lead_id } = body;
  if (!conversation_id || !text) {
    return new Response(JSON.stringify({ error: "conversation_id e text são obrigatórios" }), { status: 400, headers: CORS });
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id,
    text,
    from_me: true,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: CORS });
  }

  if (lead_id) {
    await supabase
      .from("leads")
      .update({ last_message: text, updated_at: new Date().toISOString() })
      .eq("id", lead_id);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
