/**
 * handle-instagram — Webhooks do EvoAPI para Instagram DM
 *
 * Fluxo:
 *  1. Valida payload (messages.upsert, não enviado por nós)
 *  2. Extrai instagram_user_id do remoteJid (@instagram.com)
 *  3. Busca/cria lead pelo instagram_user_id (source='instagram')
 *  4. Upsert conversation (channel='instagram')
 *  5. Salva mensagem em messages
 *  6. Log bruto em ig_webhook_events
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const event = body.event as string;
  const instanceName = (body.instance as string) ?? "";

  // Log bruto sempre (para debug)
  await supabase.from("ig_webhook_events").insert({
    instance_name: instanceName,
    event_type: event ?? "unknown",
    payload: body,
  });

  // Só processa mensagens novas
  if (event !== "messages.upsert") {
    return new Response("ok", { status: 200 });
  }

  const data = body.data as Record<string, unknown> | undefined;
  const key = data?.key as Record<string, unknown> | undefined;

  if (key?.fromMe) return new Response("ok", { status: 200 });

  const remoteJid = key?.remoteJid as string | undefined;
  // Aceita tanto @instagram.com quanto @s.instagram.net (variações do EvoAPI)
  if (!remoteJid?.includes("instagram")) return new Response("ok", { status: 200 });

  const instagramUserId = remoteJid.split("@")[0];
  const pushName = (data?.pushName as string) ?? instagramUserId;

  const msgData = data?.message as Record<string, unknown> | undefined;
  const messageText =
    (msgData?.conversation as string) ??
    ((msgData?.extendedTextMessage as Record<string, unknown> | undefined)?.text as string) ??
    (msgData?.imageMessage ? "[Imagem]" : undefined) ??
    "";

  if (!messageText) return new Response("ok", { status: 200 });

  // ── Busca/cria lead pelo instagram_user_id ────────────────────────────────
  // Primeiro tenta encontrar pelo conversation existente
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id, lead_id")
    .eq("instagram_user_id", instagramUserId)
    .eq("channel", "instagram")
    .maybeSingle();

  let leadId: string;

  if (existingConv?.lead_id) {
    leadId = existingConv.lead_id;
  } else {
    // Cria lead novo na primeira etapa do pipeline
    const { data: firstStage } = await supabase
      .from("pipeline_stages")
      .select("id")
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: newLead, error } = await supabase
      .from("leads")
      .insert({
        name: pushName,
        source: "instagram",
        stage_id: firstStage?.id ?? null,
      })
      .select("id")
      .single();

    if (error || !newLead) {
      console.error("Erro ao criar lead:", error);
      return new Response("ok", { status: 200 });
    }
    leadId = newLead.id;
  }

  // ── Upsert conversation ───────────────────────────────────────────────────
  const { data: conv } = await supabase
    .from("conversations")
    .upsert(
      {
        lead_id: leadId,
        channel: "instagram",
        instance_name: instanceName,
        instagram_user_id: instagramUserId,
        instagram_username: pushName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lead_id,channel,instance_name" },
    )
    .select("id")
    .single();

  if (!conv) return new Response("ok", { status: 200 });

  // ── Salva mensagem ────────────────────────────────────────────────────────
  await supabase.from("messages").insert({
    conversation_id: conv.id,
    text: messageText,
    from_me: false,
  });

  // Atualiza last_message no lead
  await supabase
    .from("leads")
    .update({ last_message: messageText, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  return new Response("ok", { status: 200 });
});
