/**
 * agent-context
 * Retorna tudo que o n8n precisa para executar o loop IA:
 *  - config do agente (system_prompt, model, qualifications)
 *  - histórico de mensagens da conversa
 *  - dados do lead
 *  - credenciais EvoAPI para enviar resposta (url, key, instance)
 *
 * Auth: x-bellex-api-key (validado contra integration_settings.n8n_api_key)
 * Body: { conversation_id }
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

  let body: { conversation_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400, headers: CORS });
  }

  const { conversation_id } = body;
  if (!conversation_id) {
    return new Response(JSON.stringify({ error: "conversation_id é obrigatório" }), { status: 400, headers: CORS });
  }

  // ── Conversa + lead + stage ──────────────────────────────────────────────
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, lead_id, channel, instance_name, remote_jid, agent_stopped")
    .eq("id", conversation_id)
    .maybeSingle();

  if (!conv) {
    return new Response(JSON.stringify({ error: "Conversa não encontrada" }), { status: 404, headers: CORS });
  }

  if (conv.agent_stopped) {
    return new Response(JSON.stringify({ error: "agent_stopped" }), { status: 409, headers: CORS });
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id, name, phone, stage_id")
    .eq("id", conv.lead_id)
    .maybeSingle();

  if (!lead?.stage_id) {
    return new Response(JSON.stringify({ error: "Lead sem stage" }), { status: 422, headers: CORS });
  }

  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("id, label, agent_id, move_to_next_id, move_to_human_id")
    .eq("id", lead.stage_id)
    .maybeSingle();

  if (!stage?.agent_id) {
    return new Response(JSON.stringify({ error: "Stage sem agente" }), { status: 422, headers: CORS });
  }

  // ── Agente + qualificações ────────────────────────────────────────────────
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, system_prompt, model, active")
    .eq("id", stage.agent_id)
    .eq("active", true)
    .maybeSingle();

  if (!agent) {
    return new Response(JSON.stringify({ error: "Agente inativo ou não encontrado" }), { status: 422, headers: CORS });
  }

  const { data: qualifications } = await supabase
    .from("agent_qualifications")
    .select("description, status_name")
    .eq("agent_id", agent.id);

  // ── Histórico de mensagens (últimas 30) ───────────────────────────────────
  const { data: messages } = await supabase
    .from("messages")
    .select("text, from_me, created_at")
    .eq("conversation_id", conversation_id)
    .order("created_at", { ascending: false })
    .limit(30);

  const history = (messages ?? []).reverse().map((m) => ({
    role: m.from_me ? "assistant" : "user",
    content: m.text,
  }));

  // ── Credenciais EvoAPI (para n8n enviar resposta) ─────────────────────────
  const { data: integrationRows } = await supabase
    .from("integration_settings")
    .select("setting_key, setting_value")
    .in("setting_key", ["whatsapp_request_url", "whatsapp_api_key"]);

  const integrations: Record<string, string> = {};
  for (const row of integrationRows ?? []) {
    integrations[row.setting_key] = row.setting_value;
  }

  return new Response(
    JSON.stringify({
      agent: {
        id: agent.id,
        name: agent.name,
        system_prompt: agent.system_prompt,
        model: agent.model,
        qualifications: qualifications ?? [],
      },
      lead: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        stage_id: lead.stage_id,
      },
      stage: {
        id: stage.id,
        label: stage.label,
        move_to_next_id: stage.move_to_next_id,
        move_to_human_id: stage.move_to_human_id,
      },
      conversation: {
        id: conv.id,
        channel: conv.channel,
        instance_name: conv.instance_name,
        remote_jid: conv.remote_jid,
      },
      history,
      evo: {
        url: integrations["whatsapp_request_url"] ?? "",
        key: integrations["whatsapp_api_key"] ?? "",
      },
    }),
    { headers: { ...CORS, "Content-Type": "application/json" } },
  );
});
