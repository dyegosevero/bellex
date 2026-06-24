# Backlog — Integração Instagram (Bellex)

## Contexto

O Bellex já possui integração com **WhatsApp via Evolution API** (EvoAPI). A Evolution API v2 suporta Instagram DM nativamente usando o mesmo protocolo — isso significa que podemos reutilizar praticamente toda a infraestrutura existente (Edge Functions, tabelas `conversations`/`messages`, CRM pipeline, agente de IA).

**Stack de referência:** Evolution API v2 · Supabase Edge Functions (Deno) · n8n · OpenAI

---

## Épicos

### E1 — Configuração da Instância Instagram (Admin UI)
Permitir que o admin da clínica conecte sua conta do Instagram Business via QR Code ou Token, dentro da tela de Integrações (`AdminIntegracoes`).

### E2 — Webhook Receiver (Edge Function `handle-instagram`)
Edge Function que recebe eventos da EvoAPI quando chegam DMs no Instagram. Mesma estrutura do `handle-whatsapp`: parse do payload → lead lookup/criação → salva conversa/mensagens → encaminha ao n8n.

### E3 — Banco de Dados (schema)
Ajustes no schema para suportar `channel = 'instagram'` nativamente: a tabela `conversations` já tem o campo `channel`, mas precisamos garantir índices, policies e campos específicos de Instagram (como `instagram_user_id`, `username`).

### E4 — CRM: Lead Capture via Instagram DM
Quando um usuário envia um DM, o sistema cria/associa automaticamente um lead no CRM com `source = 'instagram'`, username e foto de perfil (quando disponível via API do Instagram).

### E5 — Agente IA para Instagram
Workflow n8n paralelo ao de WhatsApp ("Bellex — Instagram AI Agent") que atende DMs com o mesmo agente GPT-4o — responder dúvidas, capturar contato, criar agendamento, mover lead no pipeline.

### E6 — Caixa de Entrada Unificada (Inbox)
UI no Bellex para visualizar e responder conversas de WhatsApp e Instagram no mesmo lugar. Permite ao atendente assumir o controle do agente IA (human takeover).

### E7 — Campanhas de Marketing via Instagram DM
Extensão do módulo de Marketing existente para enviar campanhas em massa via DM do Instagram (com filtros de audiência já existentes).

### E8 — Métricas e Relatórios Instagram
Dashboard com: total de DMs recebidos/respondidos, taxa de resposta do agente, leads gerados pelo Instagram, conversões.

---

## Itens do Backlog

### Sprint 1 — Foundation (E1 + E2 + E3)

| ID | Item | Estimativa | Épico |
|----|------|-----------|-------|
| IG-01 | Migration: adicionar `instagram_user_id` e `instagram_username` na tabela `conversations`; índice em `channel='instagram'` | 1h | E3 |
| IG-02 | Migration: tabela `ig_webhook_events` (análoga a `wp_webhook_events`) para log de eventos brutos do Instagram | 1h | E3 |
| IG-03 | Migration: campo `source` na tabela `leads` (`'manual'|'whatsapp'|'instagram'|'organic'`) | 30min | E3 |
| IG-04 | Edge Function `handle-instagram`: recebe webhook EvoAPI, parseia DM, salva conversa/mensagem, encaminha n8n | 4h | E2 |
| IG-05 | Admin UI: seção "Instagram" na `IntegrationsTab` com criação/conexão de instância EvoAPI tipo Instagram via QR ou token | 3h | E1 |
| IG-06 | Admin UI: status da instância Instagram (conectado/desconectado), botão de desconectar, botão de reconectar | 2h | E1 |

### Sprint 2 — CRM + IA (E4 + E5)

| ID | Item | Estimativa | Épico |
|----|------|-----------|-------|
| IG-07 | `handle-instagram`: criar/buscar lead por `instagram_user_id` (não por telefone) + enriquecer com `username` e `source='instagram'` | 3h | E4 |
| IG-08 | CRM: exibir origem do lead (badge Instagram/WhatsApp/Manual) no card e detalhe do lead | 1h | E4 |
| IG-09 | CRM: filtro por `source` na tela de leads | 1h | E4 |
| IG-10 | n8n Workflow "Bellex — Instagram AI Agent": clone do WhatsApp Agent, com tool `tool_enviar_instagram_dm` (HTTP para EvoAPI `/message/sendText` com instanceType=instagram) | 4h | E5 |
| IG-11 | DataTable n8n: config do agente Instagram (`instagram_instance_name`, `instagram_api_url`, `instagram_api_key`) | 1h | E5 |
| IG-12 | Testes E2E: DM recebido → lead criado no CRM → agente responde via DM | 2h | E5 |

### Sprint 3 — Inbox Unificada (E6)

| ID | Item | Estimativa | Épico |
|----|------|-----------|-------|
| IG-13 | Página `/inbox` no Bellex: lista de conversas (WhatsApp + Instagram) agrupadas por lead, ordenadas por última mensagem | 4h | E6 |
| IG-14 | Painel de conversa: thread de mensagens com indicador de canal (ícone WA/IG), campo de resposta manual | 4h | E6 |
| IG-15 | Botão "Assumir controle" / "Voltar ao agente" — seta flag `agent_stopped=true/false` no lead, pausando/retomando o agente IA | 2h | E6 |
| IG-16 | Real-time: subscribe no Supabase Realtime (`messages` table) para atualizar inbox sem reload | 2h | E6 |
| IG-17 | Enviar mensagem manual: POST para Edge Function `send-instagram-dm` que chama EvoAPI | 2h | E6 |

### Sprint 4 — Campanhas + Relatórios (E7 + E8)

| ID | Item | Estimativa | Épico |
|----|------|-----------|-------|
| IG-18 | Campanha de Marketing: adicionar canal "Instagram DM" nas opções de campanha existentes | 2h | E7 |
| IG-19 | Edge Function `send-campaign` (já existente): adicionar branch para Instagram DM via EvoAPI | 3h | E7 |
| IG-20 | Relatório Instagram: card com DMs recebidos/respondidos no período; gráfico diário; tabela de leads | 3h | E8 |
| IG-21 | Relatório Instagram: taxa de conversão (DM → agendamento confirmado) | 2h | E8 |

---

## Dependências Externas

- **Evolution API v2** com suporte a Instagram (precisa de permissão da Meta para Instagram Business)
- **Conta Instagram Business** (não Personal) vinculada a uma **Facebook Page**
- **Meta App** com permissões: `instagram_basic`, `instagram_manage_messages`, `pages_messaging`
- A EvoAPI v2 gerencia a autenticação OAuth com a Meta internamente — o admin só precisa escanear QR ou colar token

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Meta bloqueia contas que enviam campanhas em massa (E7) | Rate limiting agressivo + opt-out + respeitar políticas Meta Business |
| EvoAPI muda endpoint de Instagram entre versões | Abstrair em lib interna, não hardcodar URL |
| Instagram não permite DMs para usuários que não seguem a conta | Avisar admin na UI; campanhas só para leads que já iniciaram conversa |
