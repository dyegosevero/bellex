/**
 * handle-whatsapp — Entry point para webhooks do EvoAPI.
 *
 * Fluxo completo sem n8n:
 *  1. Parse payload EvoAPI
 *  2. Busca/cria lead pelo telefone
 *  3. Verifica se a etapa tem agente ativo
 *  4. Salva mensagem recebida no banco
 *  5. Carrega histórico do Redis
 *  6. Chama OpenAI com tools locais
 *  7. Executa tools retornadas pela IA
 *  8. Persiste resposta no banco + Redis
 *  9. Envia mensagens via EvoAPI
 * 10. Executa ações CRM (mover lead) baseadas no status_detected
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { appendAndSave, getHistory } from "../_shared/redis.ts";

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

  // ── 1. Parse EvoAPI ──────────────────────────────────────────────────────
  const event = body.event as string;
  const instanceName = body.instance as string;

  if (event !== "messages.upsert") return new Response("ok", { status: 200 });

  const data = body.data as Record<string, unknown> | undefined;
  const key = data?.key as Record<string, unknown> | undefined;

  if (key?.fromMe) return new Response("ok", { status: 200 });

  const remoteJid = key?.remoteJid as string | undefined;
  if (!remoteJid) return new Response("ok", { status: 200 });

  const phone = remoteJid.split("@")[0];

  const msgData = data?.message as Record<string, unknown> | undefined;
  const messageText =
    (msgData?.conversation as string) ??
    ((msgData?.extendedTextMessage as Record<string, unknown> | undefined)?.text as string) ??
    "";

  if (!messageText || !phone) return new Response("ok", { status: 200 });

  // ── 2. Busca instância WhatsApp → credenciais EvoAPI ────────────────────
  const { data: instance } = await supabase
    .from("whatsapp_instances")
    .select("id, api_url, api_key")
    .eq("instance_name", instanceName)
    .maybeSingle();

  const evoUrl = instance?.api_url ?? "https://api.evolution-api.com";
  const evoKey = instance?.api_key ?? "";

  // ── 3. Busca/cria lead ───────────────────────────────────────────────────
  let lead: Record<string, unknown>;

  const { data: existingLead } = await supabase
    .from("leads")
    .select("id, name, phone, stage_id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingLead) {
    lead = existingLead;
  } else {
    const { data: firstStage } = await supabase
      .from("pipeline_stages")
      .select("id")
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: newLead, error } = await supabase
      .from("leads")
      .insert({ name: phone, phone, source: "whatsapp", stage_id: firstStage?.id ?? null })
      .select("id, name, phone, stage_id")
      .single();

    if (error || !newLead) {
      console.error("Erro ao criar lead:", error);
      return new Response("ok", { status: 200 });
    }
    lead = newLead;
  }

  // ── 4. Verifica agente na etapa ──────────────────────────────────────────
  if (!lead.stage_id) {
    await persistMessage(supabase, lead, instanceName, remoteJid, messageText, false);
    return new Response("ok", { status: 200 });
  }

  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("id, label, agent_id")
    .eq("id", lead.stage_id)
    .maybeSingle();

  if (!stage?.agent_id) {
    await persistMessage(supabase, lead, instanceName, remoteJid, messageText, false);
    return new Response("ok", { status: 200 });
  }

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, system_prompt, model, active")
    .eq("id", stage.agent_id)
    .eq("active", true)
    .maybeSingle();

  if (!agent) {
    await persistMessage(supabase, lead, instanceName, remoteJid, messageText, false);
    return new Response("ok", { status: 200 });
  }

  // ── 5. Salva mensagem recebida ───────────────────────────────────────────
  const conv = await persistMessage(supabase, lead, instanceName, remoteJid, messageText, false);
  if (!conv) return new Response("ok", { status: 200 });

  // Verifica agent_stopped
  const { data: convData } = await supabase
    .from("conversations")
    .select("agent_stopped")
    .eq("id", conv.id)
    .maybeSingle();
  if (convData?.agent_stopped) return new Response("ok", { status: 200 });

  // ── 6. Busca configurações: openai_key, memory_limit ────────────────────
  const { data: settings } = await supabase
    .from("integration_settings")
    .select("setting_key, setting_value")
    .in("setting_key", ["openai_api_key", "agent_memory_limit", "agent_response_delay_ms"]);

  const cfg: Record<string, string> = {};
  for (const s of settings ?? []) cfg[s.setting_key] = s.setting_value;

  const openaiKey = cfg["openai_api_key"] ?? "";
  const memLimit = Number(cfg["agent_memory_limit"] ?? "20");
  const responseDelayMs = Number(cfg["agent_response_delay_ms"] ?? "1200");

  if (!openaiKey) {
    console.warn("openai_api_key não configurado");
    return new Response("ok", { status: 200 });
  }

  // ── 7. Busca qualificações do agente ─────────────────────────────────────
  const { data: qualifications } = await supabase
    .from("agent_qualifications")
    .select("status_name, description")
    .eq("agent_id", agent.id);

  // ── 8. Histórico Redis ───────────────────────────────────────────────────
  const leadId = lead.id as string;
  const history = await getHistory(leadId);

  // ── 9. Monta system prompt ───────────────────────────────────────────────
  const statusList = (qualifications ?? [])
    .map((q: Record<string, string>) => `- ${q.status_name}: ${q.description}`)
    .join("\n");

  const systemPrompt = `${agent.system_prompt}

Lead: ${lead.name} | Telefone: ${lead.phone}

Status disponíveis para classificação:
${statusList || "Nenhum status configurado"}

IMPORTANTE: Quando detectar um status, informe em status_detected. Caso contrário, deixe null.
Responda sempre em múltiplas mensagens curtas e naturais, como um humano no WhatsApp.`;

  // ── 10. Define tools ──────────────────────────────────────────────────────
  const tools = [
    {
      type: "function",
      function: {
        name: "get_services",
        description: "Lista os serviços disponíveis na clínica com nome, preço e duração.",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "get_availability",
        description: "Retorna horários disponíveis para agendamento.",
        parameters: {
          type: "object",
          properties: {
            service_id: { type: "string", description: "ID do serviço" },
            date: { type: "string", description: "Data no formato YYYY-MM-DD" },
          },
          required: ["service_id", "date"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_appointment",
        description: "Cria um agendamento para o lead.",
        parameters: {
          type: "object",
          properties: {
            service_id: { type: "string" },
            date: { type: "string", description: "YYYY-MM-DD" },
            time: { type: "string", description: "HH:MM" },
          },
          required: ["service_id", "date", "time"],
        },
      },
    },
  ];

  // Schema de resposta estruturada
  const responseFormat = {
    type: "json_schema",
    json_schema: {
      name: "agent_response",
      strict: true,
      schema: {
        type: "object",
        properties: {
          messages: {
            type: "array",
            items: { type: "string" },
            description: "Mensagens para enviar ao lead, uma por vez",
          },
          status_detected: {
            type: ["string", "null"],
            description: "Status detectado na conversa ou null",
          },
        },
        required: ["messages", "status_detected"],
        additionalProperties: false,
      },
    },
  };

  // ── 11. Loop OpenAI com tools ────────────────────────────────────────────
  const openaiMessages: Array<Record<string, unknown>> = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: messageText },
  ];

  let finalResponse: { messages: string[]; status_detected: string | null } | null = null;
  let iterations = 0;
  const MAX_ITERATIONS = 5;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: agent.model ?? "gpt-4o-mini",
        messages: openaiMessages,
        tools,
        tool_choice: "auto",
        response_format: responseFormat,
      }),
    });

    if (!aiResp.ok) {
      const err = await aiResp.text();
      console.error("OpenAI error:", err);
      break;
    }

    const aiData = await aiResp.json();
    const choice = aiData.choices?.[0];
    const msg = choice?.message;

    if (!msg) break;

    // Tool calls
    if (msg.tool_calls?.length) {
      openaiMessages.push(msg);

      for (const tc of msg.tool_calls) {
        const args = JSON.parse(tc.function.arguments ?? "{}");
        const result = await executeTool(supabase, leadId, tc.function.name, args);
        openaiMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
      continue;
    }

    // Resposta final
    if (msg.content) {
      try {
        finalResponse = JSON.parse(msg.content);
      } catch {
        finalResponse = { messages: [msg.content], status_detected: null };
      }
    }
    break;
  }

  if (!finalResponse?.messages?.length) return new Response("ok", { status: 200 });

  // ── 12. Persiste respostas no banco ──────────────────────────────────────
  for (const text of finalResponse.messages) {
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      text,
      from_me: true,
    });
  }

  // Atualiza last_message no lead
  const lastMsg = finalResponse.messages[finalResponse.messages.length - 1];
  await supabase
    .from("leads")
    .update({ last_message: lastMsg, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  // ── 13. Atualiza Redis ───────────────────────────────────────────────────
  await appendAndSave(
    leadId,
    [
      { role: "user", content: messageText },
      ...finalResponse.messages.map((m) => ({ role: "assistant" as const, content: m })),
    ],
    memLimit,
  );

  // ── 14. Envia mensagens via EvoAPI ───────────────────────────────────────
  for (const text of finalResponse.messages) {
    await sendWhatsApp(evoUrl, evoKey, instanceName, remoteJid, text);
    if (finalResponse.messages.length > 1) {
      await delay(responseDelayMs);
    }
  }

  // ── 15. Executa ação CRM baseada no status_detected ──────────────────────
  if (finalResponse.status_detected) {
    await executeCrmAction(supabase, agent.id as string, leadId, finalResponse.status_detected);
  }

  return new Response("ok", { status: 200 });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function persistMessage(
  supabase: ReturnType<typeof createClient>,
  lead: Record<string, unknown>,
  instanceName: string,
  remoteJid: string,
  text: string,
  fromMe: boolean,
): Promise<Record<string, unknown> | null> {
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

  return conv;
}

async function executeTool(
  supabase: ReturnType<typeof createClient>,
  leadId: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  if (toolName === "get_services") {
    const { data } = await supabase
      .from("services")
      .select("id, name, description, price, duration_minutes")
      .eq("active", true)
      .order("display_order");
    return data ?? [];
  }

  if (toolName === "get_availability") {
    const { service_id, date } = args as { service_id: string; date: string };
    const dateStart = `${date}T00:00:00`;
    const dateEnd = `${date}T23:59:59`;

    // Busca horários ocupados
    const { data: busy } = await supabase
      .from("appointments")
      .select("start_time, end_time")
      .eq("service_id", service_id)
      .gte("start_time", dateStart)
      .lte("start_time", dateEnd)
      .neq("status", "cancelado");

    // Gera slots de 1h das 8h às 18h
    const slots: string[] = [];
    for (let h = 8; h < 18; h++) {
      const slotTime = `${date}T${String(h).padStart(2, "0")}:00:00`;
      const isBusy = (busy ?? []).some((b: Record<string, string>) => {
        const start = new Date(b.start_time).getTime();
        const end = new Date(b.end_time || b.start_time).getTime();
        const slot = new Date(slotTime).getTime();
        return slot >= start && slot < end;
      });
      if (!isBusy) slots.push(`${String(h).padStart(2, "0")}:00`);
    }
    return slots;
  }

  if (toolName === "create_appointment") {
    const { service_id, date, time } = args as { service_id: string; date: string; time: string };
    const startTime = `${date}T${time}:00`;

    // Busca client_id pelo lead (phone)
    const { data: lead } = await supabase
      .from("leads")
      .select("phone, name")
      .eq("id", leadId)
      .maybeSingle();

    const { data: service } = await supabase
      .from("services")
      .select("duration_minutes")
      .eq("id", service_id)
      .maybeSingle();

    const durationMin = (service as Record<string, number> | null)?.duration_minutes ?? 60;
    const endTime = new Date(new Date(startTime).getTime() + durationMin * 60000).toISOString();

    // Tenta encontrar client existente pelo telefone
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("phone", lead?.phone ?? "")
      .maybeSingle();

    if (!client) {
      return { error: "Cliente não encontrado. Precisa ser criado manualmente no CRM." };
    }

    const { data: appt, error } = await supabase
      .from("appointments")
      .insert({
        client_id: client.id,
        service_id,
        start_time: startTime,
        end_time: endTime,
        status: "agendado",
        notes: `Agendado via WhatsApp — Lead ${leadId}`,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    return { success: true, appointment_id: appt.id };
  }

  return { error: `Tool desconhecida: ${toolName}` };
}

async function executeCrmAction(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  leadId: string,
  status: string,
): Promise<void> {
  // Busca ação configurada para este status
  const { data: action } = await supabase
    .from("agent_actions")
    .select("action, target_stage_id")
    .eq("agent_id", agentId)
    .eq("trigger_status", status)
    .maybeSingle();

  if (!action?.target_stage_id) return;

  if (action.action === "move_lead") {
    await supabase
      .from("leads")
      .update({ stage_id: action.target_stage_id, updated_at: new Date().toISOString() })
      .eq("id", leadId);
  }
}

async function sendWhatsApp(
  evoUrl: string,
  evoKey: string,
  instanceName: string,
  remoteJid: string,
  text: string,
): Promise<void> {
  try {
    await fetch(`${evoUrl}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evoKey,
      },
      body: JSON.stringify({
        number: remoteJid,
        options: { delay: 0 },
        textMessage: { text },
      }),
    });
  } catch (err) {
    console.error("Erro ao enviar WhatsApp:", err);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
