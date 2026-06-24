# Spec — Sprint 4: Campanhas + Relatórios (IG-18 a IG-21)

## IG-18 — Campanha de Marketing via Instagram DM

### Restrições da Meta (críticas)

- Instagram só permite enviar DMs para usuários que **já iniciaram conversa** com a conta Business nas últimas 7 dias (janela de mensagens)
- Campanhas em massa via DM sem consentimento = risco de ban da conta
- Recomendação: campanhas via Instagram DM apenas para `leads` com `source='instagram'` que têm uma `conversation` ativa

### Alteração no módulo de Marketing

**Arquivo:** `src/components/marketing/CampaignEditor.tsx` (ou onde o canal é escolhido)

Adicionar opção "Instagram DM" no select de canal. Quando selecionado:
- Audiência automaticamente filtrada para leads com `source='instagram'`
- Aviso: "Apenas clientes que já enviaram mensagem nos últimos 7 dias receberão a campanha"

**Filtro de audiência para Instagram:**

```sql
-- Leads elegíveis para campanha Instagram DM
SELECT DISTINCT l.id, l.full_name, c.instagram_user_id
FROM leads l
JOIN conversations c ON c.lead_id = l.id AND c.channel = 'instagram'
JOIN messages m ON m.conversation_id = c.id AND m.from_me = false
WHERE m.created_at > now() - interval '7 days'
  AND l.opt_in = true  -- ou includeNoOptin flag
```

---

## IG-19 — Edge Function `send-campaign` — branch Instagram

**Arquivo:** `supabase/functions/send-campaign/index.ts` (já existente)

Adicionar branch para `channel = 'instagram'`:

```typescript
if (channel === "instagram") {
  // Buscar credenciais Instagram da clínica
  const apiUrl = settings["instagram_api_url"];
  const apiKey = settings["instagram_api_key"];
  const instanceName = settings["instagram_instance_name"];

  // Buscar instagram_user_id do lead via conversations
  const { data: conv } = await supabase
    .from("conversations")
    .select("instagram_user_id")
    .eq("lead_id", recipientId)
    .eq("channel", "instagram")
    .single();

  if (!conv?.instagram_user_id) {
    // Lead sem conversa Instagram ativa — pular
    results.push({ id: recipientId, status: "skipped", reason: "no_instagram_conversation" });
    continue;
  }

  // Enviar via EvoAPI
  const res = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: { apikey: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      number: `${conv.instagram_user_id}@instagram.com`,
      text: messageText,
    }),
  });

  const ok = res.ok;
  results.push({ id: recipientId, status: ok ? "sent" : "failed" });

  // Rate limiting: 500ms entre mensagens para evitar ban
  await new Promise(r => setTimeout(r, 500));
}
```

---

## IG-20 — Relatório Instagram: cards + gráfico diário

**Arquivo:** `src/components/reports/InstagramReport.tsx` (novo componente na tab de Relatórios)

### Dados necessários

```typescript
// Hook
export function useInstagramMetrics(dateRange: DateRange) {
  return useQuery({
    queryKey: ["instagram-metrics", dateRange],
    queryFn: async () => {
      // Total de DMs recebidos no período
      const { count: totalReceived } = await supabase
        .from("messages")
        .select("*, conversations!inner(channel)", { count: "exact", head: true })
        .eq("conversations.channel", "instagram")
        .eq("from_me", false)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());

      // Total de DMs enviados (IA + manual)
      const { count: totalSent } = await supabase
        .from("messages")
        .select("*, conversations!inner(channel)", { count: "exact", head: true })
        .eq("conversations.channel", "instagram")
        .eq("from_me", true)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());

      // Novos leads via Instagram
      const { count: newLeads } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("source", "instagram")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());

      return { totalReceived, totalSent, newLeads };
    },
  });
}
```

### KPI Cards

- **DMs Recebidos** (total no período)
- **DMs Respondidos** (total `from_me=true`)
- **Taxa de Resposta** (`totalSent / totalReceived * 100`)
- **Leads Gerados** (novos leads com `source='instagram'`)

### Gráfico diário

BarChart agrupado por dia: DMs recebidos vs respondidos. Permite ver picos e identificar dias sem cobertura.

---

## IG-21 — Taxa de conversão DM → Agendamento

### Definição de conversão

Um lead vindo do Instagram (`source='instagram'`) que criou um `appointment` no período = conversão.

```typescript
// Leads Instagram que criaram agendamento
const { count: conversions } = await supabase
  .from("appointments")
  .select("*, leads!inner(source)", { count: "exact", head: true })
  .eq("leads.source", "instagram")
  .gte("created_at", dateRange.from.toISOString())
  .lte("created_at", dateRange.to.toISOString());

const conversionRate = newLeads > 0
  ? ((conversions / newLeads) * 100).toFixed(1)
  : "0.0";
```

### Exibição

- KPI card: "Taxa de Conversão DM → Agendamento — X%"
- Tabela: leads do Instagram no período com colunas: Nome, Username, Data DM, Agendou? (sim/não), Valor

---

## Pré-requisitos para Sprint 4

- Sprint 1 e 2 concluídas (leads com `source='instagram'` existindo)
- Pelo menos uma campanha de WhatsApp funcionando (base para o branch Instagram)
- Aprovação do Meta App com `instagram_manage_messages` (pode demorar 2-5 dias úteis de revisão)
