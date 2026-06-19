# Spec — Sprint 2: CRM + IA (IG-07 a IG-12)

## Objetivo

Leads do Instagram aparecem no CRM com origem identificada. O agente de IA responde automaticamente via DM usando o mesmo fluxo do WhatsApp.

---

## IG-07 — Lead enrichment via Instagram

Já coberto em `handle-instagram` (spec Sprint 1):
- Cria lead com `source = 'instagram'`
- Salva `instagram_user_id` e `instagram_username` na `conversations`

**Ponto de atenção:** o Instagram não fornece telefone via DM. O lead criado não terá `phone` preenchido. O atendente pode adicionar manualmente depois. O agente pode perguntar o telefone no fluxo de agendamento.

---

## IG-08 — CRM: badge de origem do lead

**Arquivo:** `src/components/crm/LeadCard.tsx` (e detalhe do lead)

Adicionar badge de origem visível no card do lead e na página de detalhe:

```tsx
const SOURCE_CONFIG = {
  whatsapp: { label: "WhatsApp", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  instagram: { label: "Instagram", color: "bg-purple-500/10 text-purple-700 border-purple-500/30" },
  organic:   { label: "Orgânico", color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  manual:    { label: "Manual",   color: "bg-muted text-muted-foreground border-border" },
};

// No card:
{lead.source && SOURCE_CONFIG[lead.source] && (
  <Badge variant="outline" className={`text-[10px] ${SOURCE_CONFIG[lead.source].color}`}>
    {SOURCE_CONFIG[lead.source].label}
  </Badge>
)}
```

---

## IG-09 — CRM: filtro por source

**Arquivo:** `src/pages/CRM.tsx` (ou onde estão os filtros de leads)

Adicionar Select com opções: Todos / WhatsApp / Instagram / Orgânico / Manual.

Query Supabase: `.eq("source", selectedSource)` quando não for "all".

---

## IG-10 — n8n Workflow: Bellex — Instagram AI Agent

### Estrutura do workflow (clone do WhatsApp com ajustes)

```
Webhook (POST /bellex-instagram)
  │
  ▼
Captura Campos
  { lead_id, conversation_id, clinic_id, agent_id,
    instagram_user_id, instagram_username, message,
    instance_name, instagram_api_key, instagram_api_url }
  │
  ▼
Get Config Agente (DataTable — tableId: "agent_configs", filtro: agent_id)
  │
  ▼
Validado? (IF: instagram_api_key notEmpty)
  │
  ├─ false → Stop (sem credenciais)
  │
  └─ true ▼
Configuração do Agente (Set)
  {
    phone: {{ $json.instagram_user_id }},
    clinic_id: {{ $json.clinic_id }},
    agent_name: {{ $('Get Config').item.json.agent_name }},
    system_prompt: {{ $('Get Config').item.json.system_prompt }},
    api_url: {{ $json.instagram_api_url }},
    api_key: {{ $json.instagram_api_key }},
    instance_name: {{ $json.instance_name }}
  }
  │
  ▼
AI Agent (LangChain)
  ├── LM: OpenAI GPT-4o
  ├── Memory: Redis (key: instagram:{{ phone }})
  ├── tool_buscar_servicos     → GET {SUPABASE_FUNCTIONS_URL}/agent-services
  ├── tool_buscar_horarios     → GET {SUPABASE_FUNCTIONS_URL}/agent-availability
  ├── tool_criar_agendamento   → POST {SUPABASE_FUNCTIONS_URL}/agent-appointment
  ├── tool_move_lead           → PATCH leads/{lead_id}/stage
  └── tool_request_human       → seta agent_stopped=true no lead
  │
  ▼
Strip Markdown (Code node — remove **, *, #, etc.)
  │
  ▼
Enviar DM Instagram (HTTP Request)
  POST {{ $('Configuração do Agente').item.json.api_url }}/message/sendText/{{ instance_name }}
  Headers: { apikey: {{ api_key }} }
  Body: {
    "number": "{{ instagram_user_id }}@instagram.com",
    "text": "{{ $json.text }}"
  }
  │
  ▼
Salvar no Banco (HTTP Request)
  POST {SUPABASE_FUNCTIONS_URL}/save-message (ou direto via Supabase REST)
  { conversation_id, text, from_me: true }
```

### Diferenças em relação ao WhatsApp Agent

| Aspecto | WhatsApp | Instagram |
|---------|----------|-----------|
| JID formato | `5511999@s.whatsapp.net` | `123456@instagram.com` |
| Redis key prefix | `whatsapp:` | `instagram:` |
| Endpoint send | `/message/sendText/{instance}` body `number` com `@s.whatsapp.net` | `/message/sendText/{instance}` body `number` com `@instagram.com` |
| Mídia suportada | Texto, imagem, áudio, doc | Texto, imagem (sem áudio por enquanto) |

### DataTable entries necessárias (n8n)

```json
{
  "tableId": "agent_configs",
  "rows": [
    {
      "agent_id": "{{uuid-do-agente}}",
      "channel": "instagram",
      "agent_name": "Bellex IA — Instagram",
      "system_prompt": "Você é assistente da clínica Bellex...",
      "instagram_instance_name": "bellex-instagram"
    }
  ]
}
```

---

## IG-11 — Variáveis n8n necessárias

Além das já existentes para WhatsApp:

```
N8N_INSTAGRAM_WEBHOOK_URL  — URL do webhook do workflow Instagram (gerado ao ativar)
```

Em Supabase secrets:
```
N8N_INSTAGRAM_WEBHOOK_URL=https://n8n.meuserver.com/webhook/bellex-instagram
```

---

## IG-12 — Testes E2E

### Cenário 1: DM recebido → lead criado → agente responde

1. Enviar DM para o Instagram Business da clínica de uma conta de teste
2. EvoAPI recebe e dispara webhook para `handle-instagram`
3. Verificar: `ig_webhook_events` tem o registro bruto
4. Verificar: `leads` tem novo lead com `source='instagram'`
5. Verificar: `conversations` tem registro com `channel='instagram'`
6. Verificar: `messages` tem a mensagem com `from_me=false`
7. Verificar: n8n recebeu o payload no webhook
8. Verificar: IA gerou resposta e enviou DM de volta via EvoAPI
9. Verificar: `messages` tem resposta da IA com `from_me=true`

### Cenário 2: Lead já existente envia nova mensagem

1. Mesmo usuário Instagram envia segunda mensagem
2. Verificar: nenhum lead duplicado criado
3. Verificar: nova mensagem adicionada à `conversation` existente
4. Verificar: Redis mantém contexto da conversa anterior (memória do agente)

### Cenário 3: agent_stopped = true (human takeover)

1. Atendente clica "Assumir controle" na inbox
2. Usuário Instagram envia mensagem
3. Verificar: `handle-instagram` salva mensagem mas NÃO encaminha ao n8n
4. Verificar: mensagem aparece na inbox sem resposta automática
