# Spec — Sprint 1: Foundation (IG-01 a IG-06)

## Objetivo

Conectar uma instância Instagram via Evolution API v2 no painel de Integrações e começar a receber DMs no banco de dados.

---

## IG-01 — Migration: conversations + instagram fields

**Arquivo:** `supabase/migrations/20260619000001_instagram_conversations.sql`

```sql
-- Adiciona campos Instagram na tabela de conversas
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS instagram_user_id text,   -- ex: "123456789"
  ADD COLUMN IF NOT EXISTS instagram_username text;  -- ex: "joao.silva"

-- Índice para busca rápida por instagram_user_id (equivale ao phone no WhatsApp)
CREATE INDEX IF NOT EXISTS conversations_instagram_user_id_idx
  ON public.conversations(instagram_user_id)
  WHERE instagram_user_id IS NOT NULL;

-- Índice por canal para filtros na inbox
CREATE INDEX IF NOT EXISTS conversations_channel_idx
  ON public.conversations(channel);
```

---

## IG-02 — Migration: ig_webhook_events

**Arquivo:** `supabase/migrations/20260619000002_ig_webhook_events.sql`

```sql
CREATE TABLE IF NOT EXISTS public.ig_webhook_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name   text,
  event_type      text NOT NULL DEFAULT 'other',
  payload         jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ig_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_ig_events" ON public.ig_webhook_events FOR SELECT USING (true);
-- Apenas service_role escreve (webhook usa service key)
```

---

## IG-03 — Migration: leads.source

**Arquivo:** `supabase/migrations/20260619000003_leads_source.sql`

```sql
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual', 'whatsapp', 'instagram', 'organic'));

CREATE INDEX IF NOT EXISTS leads_source_idx ON public.leads(source);
```

---

## IG-04 — Edge Function: handle-instagram

**Arquivo:** `supabase/functions/handle-instagram/index.ts`

### Payload EvoAPI para Instagram DM

A EvoAPI v2 emite para Instagram o mesmo envelope de `messages.upsert`, mas com estrutura diferente no `remoteJid` e dados do remetente:

```json
{
  "event": "messages.upsert",
  "instance": "minha-instancia-ig",
  "data": {
    "key": {
      "remoteJid": "123456789@instagram.com",
      "fromMe": false,
      "id": "mid.xxx"
    },
    "message": {
      "conversation": "Olá, quero agendar"
    },
    "pushName": "João Silva"
  }
}
```

O `remoteJid` no Instagram usa o formato `{instagram_user_id}@instagram.com`.

### Fluxo da Edge Function

```
POST /functions/v1/handle-instagram
│
├── Validar: event === "messages.upsert" && !fromMe
├── Extrair: instagram_user_id = remoteJid.split("@")[0]
├── Extrair: texto da mensagem (conversation ou extendedTextMessage.text)
├── Extrair: pushName (username/nome do remetente)
│
├── Buscar instância nas settings (instance_name → clinic_id)
│
├── Buscar lead por instagram_user_id
│   ├── Encontrou → usa lead existente
│   └── Não encontrou → cria lead:
│       { full_name: pushName, source: "instagram", instagram_user_id }
│
├── Salvar em ig_webhook_events (log bruto)
│
├── Buscar/criar conversation:
│   { lead_id, channel: "instagram", instance_name, instagram_user_id }
│
├── Salvar mensagem em messages:
│   { conversation_id, text, from_me: false }
│
├── Verificar pipeline stage do lead tem agent_id?
│   ├── Não → retorna 200 (só registrou, não ativa IA)
│   └── Sim → buscar config do agente + credenciais Instagram da clínica
│       └── POST para N8N_INSTAGRAM_WEBHOOK_URL com payload enriquecido
│
└── Retorna 200
```

### Variáveis de ambiente necessárias

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
N8N_INSTAGRAM_WEBHOOK_URL   ← novo; registrado em Supabase secrets
```

### Código completo

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const N8N_WEBHOOK_URL = Deno.env.get("N8N_INSTAGRAM_WEBHOOK_URL")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return new Response("Invalid JSON", { status: 400 }); }

  const event = body.event as string;
  const instanceName = body.instance as string;

  // Log bruto sempre (para debug)
  await supabase.from("ig_webhook_events").insert({
    instance_name: instanceName,
    event_type: event,
    payload: body,
  });

  if (event !== "messages.upsert") return new Response("ok", { status: 200 });

  const data = body.data as Record<string, unknown>;
  const key = data?.key as Record<string, unknown>;
  if (key?.fromMe) return new Response("ok", { status: 200 });

  const remoteJid = key?.remoteJid as string;
  if (!remoteJid?.includes("@instagram.com")) return new Response("ok", { status: 200 });

  const instagramUserId = remoteJid.split("@")[0];
  const pushName = (data?.pushName as string) ?? "Contato Instagram";

  const msgData = data?.message as Record<string, unknown>;
  const messageText =
    (msgData?.conversation as string) ??
    ((msgData?.extendedTextMessage as Record<string, unknown>)?.text as string) ??
    "";

  if (!messageText) return new Response("ok", { status: 200 });

  // Buscar clinic_id pela instância
  const { data: settings } = await supabase
    .from("clinic_settings")
    .select("clinic_id")
    .eq("setting_key", "instagram_instance_name")
    .eq("setting_value", instanceName)
    .single();

  const clinicId = settings?.clinic_id;
  if (!clinicId) return new Response("ok", { status: 200 });

  // Buscar/criar lead
  let lead: Record<string, unknown> | null = null;
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("lead_id, leads(*)")
    .eq("instagram_user_id", instagramUserId)
    .eq("channel", "instagram")
    .maybeSingle();

  if (existingConv?.lead_id) {
    lead = existingConv.leads as Record<string, unknown>;
  } else {
    const { data: newLead } = await supabase
      .from("leads")
      .insert({
        clinic_id: clinicId,
        full_name: pushName,
        source: "instagram",
      })
      .select()
      .single();
    lead = newLead;
  }

  if (!lead) return new Response("Lead creation failed", { status: 500 });

  // Buscar/criar conversation
  const { data: conversation } = await supabase
    .from("conversations")
    .upsert(
      {
        lead_id: lead.id,
        channel: "instagram",
        instance_name: instanceName,
        instagram_user_id: instagramUserId,
        instagram_username: pushName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lead_id,channel,instance_name" }
    )
    .select()
    .single();

  if (!conversation) return new Response("Conversation error", { status: 500 });

  // Salvar mensagem
  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    text: messageText,
    from_me: false,
  });

  // Verificar se o pipeline stage tem agent_id
  const { data: leadData } = await supabase
    .from("leads")
    .select("pipeline_stage_id, agent_stopped")
    .eq("id", lead.id)
    .single();

  if (!leadData?.pipeline_stage_id || leadData.agent_stopped) {
    return new Response("ok", { status: 200 });
  }

  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("agent_id")
    .eq("id", leadData.pipeline_stage_id)
    .single();

  if (!stage?.agent_id) return new Response("ok", { status: 200 });

  // Buscar credenciais Instagram da clínica
  const { data: igSettings } = await supabase
    .from("clinic_settings")
    .select("setting_key, setting_value")
    .eq("clinic_id", clinicId)
    .in("setting_key", ["instagram_api_key", "instagram_api_url", "instagram_instance_name"]);

  const creds: Record<string, string> = {};
  (igSettings ?? []).forEach((s: { setting_key: string; setting_value: string }) => {
    creds[s.setting_key] = s.setting_value;
  });

  // Encaminhar para n8n
  await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lead_id: lead.id,
      conversation_id: conversation.id,
      clinic_id: clinicId,
      agent_id: stage.agent_id,
      instagram_user_id: instagramUserId,
      instagram_username: pushName,
      message: messageText,
      instance_name: instanceName,
      instagram_api_key: creds.instagram_api_key,
      instagram_api_url: creds.instagram_api_url,
    }),
  });

  return new Response("ok", { status: 200 });
});
```

---

## IG-05 + IG-06 — Admin UI: Seção Instagram em IntegrationsTab

### Campos de configuração necessários em `clinic_settings`

```
instagram_instance_name   — nome da instância EvoAPI (ex: "bellex-instagram")
instagram_api_key         — Bearer token da EvoAPI
instagram_api_url         — URL base da EvoAPI (ex: "https://evo.meuserver.com")
```

### Comportamento da UI

1. Seção "Instagram" com ícone do Instagram (usar SVG inline ou lucide `Instagram`)
2. Campos: Nome da Instância, URL da EvoAPI, Chave API
3. Botão "Salvar" → upsert em `clinic_settings`
4. Após salvar com credenciais válidas: botão "Conectar / Ver QR Code"
   - Abre Dialog com QR Code buscado via `GET {api_url}/instance/connect/{instance_name}` com header `apikey: {api_key}`
   - Polling a cada 5s para verificar se conectou: `GET {api_url}/instance/connectionState/{instance_name}`
   - Quando `state === "open"`: exibe badge "Conectado" verde, esconde QR
5. Badge de status (Conectado / Desconectado / Não configurado)
6. Botão "Desconectar": `DELETE {api_url}/instance/logout/{instance_name}`

### Webhook a registrar na EvoAPI

Após conectar, registrar automaticamente o webhook da Edge Function:
```
POST {api_url}/webhook/set/{instance_name}
{
  "url": "{SUPABASE_URL}/functions/v1/handle-instagram",
  "webhook_by_events": true,
  "events": ["MESSAGES_UPSERT"]
}
```

Isso garante que o EvoAPI envie DMs para a nossa Edge Function automaticamente.
