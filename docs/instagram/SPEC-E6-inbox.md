# Spec — Sprint 3: Inbox Unificada (IG-13 a IG-17)

## Objetivo

Uma única tela no Bellex onde o atendente vê e responde conversas de WhatsApp e Instagram, com controle manual sobre o agente de IA.

---

## Rota e navegação

```
/inbox                     — lista de conversas
/inbox/:conversationId     — thread aberta
```

Adicionar link "Inbox" no `AppLayout` (sidebar), ícone `MessageSquare`.

---

## IG-13 — Lista de conversas (`/inbox`)

### Query Supabase

```typescript
// Busca conversas com última mensagem e dados do lead
const { data } = await supabase
  .from("conversations")
  .select(`
    id, channel, instagram_username, instance_name, updated_at,
    leads (id, full_name, source, agent_stopped, pipeline_stage_id),
    messages (text, from_me, created_at)
  `)
  .order("updated_at", { ascending: false })
  .limit(1, { foreignTable: "messages" });
  // messages ordenadas DESC para pegar a última
```

### Layout da lista

```
┌─────────────────────────────────────────────────┐
│ [IG] João Silva          há 2 min               │
│ Quero agendar botox...                    [IA ✓]│
├─────────────────────────────────────────────────┤
│ [WA] Maria Oliveira      há 15 min              │
│ Ok, até amanhã!                         [Manual]│
└─────────────────────────────────────────────────┘
```

- Ícone de canal: ícone Instagram (roxo) ou WhatsApp (verde)
- Badge "IA" ou "Manual" (se `agent_stopped = true`)
- Preview da última mensagem (truncada em 50 chars)
- Timestamp relativo (date-fns `formatDistanceToNow`)
- Click → abre `/inbox/:conversationId`

### Filtros na lista

- Canal: Todos / WhatsApp / Instagram
- Status: Todos / Com IA / Manual (agent_stopped)
- Busca por nome do lead

---

## IG-14 — Thread de conversa

### Layout

```
┌── Header ──────────────────────────────────────────┐
│ ← Inbox  [IG] João Silva (@joao.silva)             │
│           Estágio: Qualificado  [Assumir controle] │
└────────────────────────────────────────────────────┘
┌── Messages ─────────────────────────────────────────┐
│                                                     │
│  João: Olá, quero saber sobre botox        14:22   │
│                                                     │
│        IA: Olá João! Temos ótimas opções.  14:22 ▪ │
│                                                     │
│  João: Qual o preço?                       14:23   │
│                                                     │
│        IA: O botox começa em R$ 350...     14:23 ▪ │
│                                                     │
└────────────────────────────────────────────────────┘
┌── Input (só habilitado se agent_stopped=true) ──────┐
│  [Digite uma mensagem...]           [Enviar →]      │
└────────────────────────────────────────────────────┘
```

### Componente de mensagem

```tsx
interface MessageBubble {
  text: string;
  fromMe: boolean;
  createdAt: string;
  channel: "whatsapp" | "instagram";
}

// Alinhamento: from_me=true → direita (cinza), from_me=false → esquerda (branco)
// Timestamp embaixo de cada mensagem
```

---

## IG-15 — Botão "Assumir controle" / "Voltar ao agente"

**Arquivo:** `src/pages/inbox/InboxThread.tsx`

```typescript
const toggleAgentMutation = useMutation({
  mutationFn: async (stopped: boolean) => {
    const { error } = await supabase
      .from("leads")
      .update({ agent_stopped: stopped })
      .eq("id", leadId);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["inbox", conversationId] });
    toast(agentStopped ? "Agente IA retomado" : "Você assumiu o controle");
  },
});
```

**UI:**
- `agent_stopped = false` → botão "Assumir controle" (cor âmbar)
- `agent_stopped = true` → botão "Voltar ao agente" (cor verde) + aviso "Respondendo manualmente"

---

## IG-16 — Realtime (Supabase Realtime)

```typescript
// No componente InboxThread
useEffect(() => {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        queryClient.setQueryData(["messages", conversationId], (old: Message[]) => [
          ...old,
          payload.new as Message,
        ]);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [conversationId]);
```

Habilitar Realtime na tabela `messages` no Supabase Dashboard (Publication: `supabase_realtime`).

---

## IG-17 — Envio manual de mensagem

### Edge Function: `send-instagram-dm`

**Arquivo:** `supabase/functions/send-instagram-dm/index.ts`

```typescript
// Recebe: { conversation_id, text }
// 1. Busca conversa → instância + instagram_user_id + clinic_id
// 2. Busca clinic_settings: instagram_api_key, instagram_api_url
// 3. POST EvoAPI: /message/sendText/{instance_name}
//    body: { number: "{instagram_user_id}@instagram.com", text }
// 4. Salva mensagem: { conversation_id, text, from_me: true }
// 5. Atualiza conversations.updated_at
```

**Chamada no frontend:**

```typescript
const sendMessage = async (text: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  await fetch(`${SUPABASE_URL}/functions/v1/send-instagram-dm`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session!.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ conversation_id: conversationId, text }),
  });
};
```

**Para WhatsApp:** criar `send-whatsapp-dm` com estrutura análoga (usando EvoAPI endpoint de WhatsApp), ou unificar em `send-message` com campo `channel`.

---

## Schema de navegação da Inbox

```
src/pages/inbox/
  InboxList.tsx        — lista /inbox
  InboxThread.tsx      — thread /inbox/:id
  InboxLayout.tsx      — wrapper com sidebar de lista + área de thread (split view em desktop)

src/components/inbox/
  ConversationItem.tsx — card na lista
  MessageBubble.tsx    — bolha de mensagem
  ChannelIcon.tsx      — ícone WA/IG
  AgentStatusBar.tsx   — barra de status do agente + botão assumir/voltar
```
