/**
 * handle-whatsapp — Entry point para webhooks do EvoAPI (Evolution API)
 *
 * Fluxo:
 *  1. Valida payload do EvoAPI (mensagem recebida)
 *  2. Busca/cria lead pelo número de telefone
 *  3. Verifica se o pipeline stage atual tem agent_id
 *  4. Se sim: busca config do agente + openai_key da clínica + evoapi creds
 *  5. Salva mensagem no banco (conversations + messages)
 *  6. POSTa payload enriquecido para n8n executar o loop IA
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const N8N_WEBHOOK_URL = Deno.env.get("N8N_WHATSAPP_WEBHOOK_URL")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // ── 1. Parse EvoAPI payload ──────────────────────────────────────────────
  // EvoAPI emits: { event, instance, data: { key: { remoteJid, fromMe }, message: { conversation } } }
  const event = body.event as string;
  const instanceName = body.instance as string;

  // Só processa mensagens recebidas (não enviadas pelo bot)
  if (event !== "messages.upsert") {
    return new Response("ok", { status: 200 });
  }

  const data = body.data as Record<string, unknown> | undefined;
  const key = data?.key as Record<string, unknown> | undefined;
  const fromMe = key?.fromMe as boolean | undefined;

  if (fromMe) {
    return new Response("ok", { status: 200 });
  }

  const remoteJid = key?.remoteJid as string | undefined;
  if (!remoteJid) {
    return new Response("ok", { status: 200 });
  }

  // Extrai número limpo do JID (ex: "5511999999999@s.whatsapp.net" → "5511999999999")
  const phone = remoteJid.split("@")[0];

  const msgData = data?.message as Record<string, unknown> | undefined;
  const messageText =
    (msgData?.conversation as string) ??
    (msgData?.extendedTextMessage as Record<string, unknown> | undefined)?.text as string ??
    "";

  if (!messageText || !phone) {
    return new Response("ok", { status: 200 });
  }

  // ── 2. Busca/cria lead pelo telefone ────────────────────────────────────
  let lead: Record<string, unknown> | null = null;

  const { data: existingLead } = await supabase
    .from("leads")
    .select("id, name, phone, stage_id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingLead) {
    lead = existingLead;
  } else {
    // Cria lead novo na primeira etapa ativa do pipeline
    const { data: firstStage } = await supabase
      .from("pipeline_stages")
      .select("id")
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: newLead, error: insertError } = await supabase
      .from("leads")
      .insert({
        name: phone,
        phone,
        source: "whatsapp",
        stage_id: firstStage?.id ?? null,
      })
      .select("id, name, phone, stage_id")
      .single();

    if (insertError) {
      console.error("Erro ao criar lead:", insertError);
      return new Response("ok", { status: 200 });
    }
    lead = newLead;
  }

  // ── 3. Verifica agent_id na etapa atual ─────────────────────────────────
  if (!lead.stage_id) {
    await saveMessage(supabase, lead, instanceName, remoteJid, messageText, false);
    return new Response("ok", { status: 200 });
  }

  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("id, label, agent_id, move_to_human_id, move_to_next_id")
    .eq("id", lead.stage_id)
    .maybeSingle();

  if (!stage?.agent_id) {
    // Sem agente nesta etapa — só salva a mensagem
    await saveMessage(supabase, lead, instanceName, remoteJid, messageText, false);
    return new Response("ok", { status: 200 });
  }

  // ── 4. Busca config do agente ────────────────────────────────────────────
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, system_prompt, model, active")
    .eq("id", stage.agent_id)
    .eq("active", true)
    .maybeSingle();

  if (!agent) {
    await saveMessage(supabase, lead, instanceName, remoteJid, messageText, false);
    return new Response("ok", { status: 200 });
  }

  const { data: qualifications } = await supabase
    .from("agent_qualifications")
    .select("description, status_name")
    .eq("agent_id", agent.id);

  // ── 5. Salva mensagem recebida ───────────────────────────────────────────
  const conversation = await saveMessage(supabase, lead, instanceName, remoteJid, messageText, false);

  // ── 5.5. Verifica se agente está parado para esta conversa ──────────────
  if (conversation) {
    const { data: convData } = await supabase
      .from("conversations")
      .select("agent_stopped")
      .eq("id", conversation.id)
      .maybeSingle();
    if (convData?.agent_stopped) {
      return new Response("ok", { status: 200 });
    }
  }

  // ── 6. POST para n8n — payload mínimo (n8n busca contexto via agent-context) ──
  const n8nPayload = {
    instance: instanceName,
    remote_jid: remoteJid,
    phone,
    message: messageText,
    lead_id: lead.id,
    stage_id: lead.stage_id,
    conversation_id: conversation?.id ?? null,
  };

  if (N8N_WEBHOOK_URL) {
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(n8nPayload),
      });
    } catch (err) {
      console.error("Erro ao chamar n8n:", err);
    }
  } else {
    console.warn("N8N_WHATSAPP_WEBHOOK_URL não configurado");
  }

  return new Response("ok", { status: 200 });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function saveMessage(
  supabase: ReturnType<typeof createClient>,
  lead: Record<string, unknown>,
  instanceName: string,
  remoteJid: string,
  text: string,
  fromMe: boolean,
): Promise<Record<string, unknown> | null> {
  // Upsert conversation
  const { data: conv } = await supabase
    .from("conversations")
    .upsert(
      {
        lead_id: lead.id,
        channel: "whatsapp",
        instance_name: instanceName,
        remote_jid: remoteJid,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lead_id,channel,instance_name" },
    )
    .select("id")
    .single();

  if (!conv) return null;

  await supabase.from("messages").insert({
    conversation_id: conv.id,
    text,
    from_me: fromMe,
  });

  // Atualiza last_message no lead
  await supabase
    .from("leads")
    .update({ last_message: text, updated_at: new Date().toISOString() })
    .eq("id", lead.id);

  return conv;
}
