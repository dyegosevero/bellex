# Dermalūm — Guia de Workflows n8n

> Guia prático para configurar as 6 automações de notificações e marketing.  
> Atualizado em 05/04/2026

---

## Visão Geral

O CRM não envia notificações diretamente aos clientes (exceto cobranças via Resend/WhatsApp). Utiliza o n8n como router de entrega:

| Modelo  | Como funciona                                                                 |
| ------- | ----------------------------------------------------------------------------- |
| **Cron** | O n8n chama Edge Functions periodicamente; recebe payloads com tudo pronto   |
| **Webhook** | O CRM envia um POST ao n8n em tempo real com mensagens pré-resolvidas     |

**Princípio fundamental:** Todas as Edge Functions e webhooks retornam **payloads completos** — mensagens já formatadas, variáveis substituídas, subjects resolvidos, remetentes com fallbacks. O n8n **nunca precisa buscar templates, fazer substituições de variáveis, nem consultar tabelas adicionais**. Apenas roteia a entrega.

### Workflows

| #   | Workflow                           | Trigger     | Frequência         |
| --- | ---------------------------------- | ----------- | ------------------ |
| 1   | Agendamentos (Appointments)        | Webhook     | Tempo real         |
| 2   | Automações diárias (Inativos + Aniversário) | Cron | Diário 08:00       |
| 3   | Atendimentos em aberto (Finalização automática) | Cron 30 min | Contínuo          |
| 4   | Enviador de SMS (Lembretes)        | Cron 5 min  | Contínuo           |
| 5   | Marketing (Campanhas)              | Webhook     | Sob demanda        |
| 6   | Google Review (Avaliações)         | Cron        | Diário 10:00       |

### Canais de envio suportados

- **WhatsApp** — via Evolution API (credenciais configuradas no CRM)
- **Email** — via Resend (API Key configurada no CRM)
- **SMS** — via API externa (opcional)

---

## Credenciais

### Base URL

| Tipo           | URL                                                        |
| -------------- | ---------------------------------------------------------- |
| Edge Functions | `https://htqavgknoerylnhfebex.supabase.co/functions/v1`   |

### Autenticação — Edge Functions

As Edge Functions suportam **dois métodos** de autenticação (basta um):

| Método | Header | Quem usa |
|--------|--------|----------|
| **Cron Secret** | `x-cron-secret: <chave>` | n8n (cron jobs) |
| **JWT Admin** | `Authorization: Bearer <token_jwt>` | UI do CRM (admin logado) |

A validação do cron secret é feita em duas camadas:
1. Variável de ambiente `CRON_SECRET` do servidor
2. Fallback: valor `n8n_cron_secret` na tabela `integration_settings` (permite rotação via UI)

> **Exceção:** `send-campaign` aceita **apenas** JWT de admin (não aceita cron secret).

### Dados do WhatsApp (Evolution API)

Estes valores estão em **Configurações > Integrações** no CRM e devem ser replicados no n8n:

| Dado               | Onde buscar no CRM                             |
| ------------------- | ---------------------------------------------- |
| URL base            | Campo "URL de Request" no card WhatsApp        |
| API Key             | Campo "Chave API" no card WhatsApp             |
| Nome da Instância   | Campo "Nome da Instância" no card WhatsApp     |

### Dados de E-mail (Resend)

Usar a API Key e endereço de remetente configurados em **Configurações > E-mail** no CRM.

---

## Tabelas de Referência

### `message_templates` — Templates editáveis na UI

| `slug`                       | Canal    | Uso                     |
| ---------------------------- | -------- | ----------------------- |
| `booking_confirmed_whatsapp` | WhatsApp | Confirmação de marcação |
| `booking_confirmed_email`    | Email    | Confirmação de marcação |
| `booking_confirmed_sms`      | SMS      | Confirmação de marcação |
| `booking_cancelled_whatsapp` | WhatsApp | Cancelamento            |
| `booking_cancelled_email`    | Email    | Cancelamento            |
| `booking_cancelled_sms`      | SMS      | Cancelamento            |
| `booking_changed_whatsapp`   | WhatsApp | Alteração de marcação   |
| `booking_changed_email`      | Email    | Alteração de marcação   |
| `booking_changed_sms`        | SMS      | Alteração de marcação   |
| `booking_reminder_whatsapp`  | WhatsApp | Lembrete                |
| `booking_reminder_email`     | Email    | Lembrete                |
| `booking_reminder_sms`       | SMS      | Lembrete                |
| `birthday_whatsapp`          | WhatsApp | Aniversário             |
| `birthday_email`             | Email    | Aniversário             |
| `birthday_sms`               | SMS      | Aniversário             |
| `inactive_whatsapp`          | WhatsApp | Cliente inativo         |
| `inactive_email`             | Email    | Cliente inativo         |
| `inactive_sms`               | SMS      | Cliente inativo         |

**Variáveis disponíveis nos templates** (resolvidas pelo backend antes do envio):

| Variável              | Descrição                                |
| --------------------- | ---------------------------------------- |
| `{nome}`              | Primeiro nome do cliente                 |
| `{nome_completo}`     | Nome completo do cliente                 |
| `{negocio}`           | Nome da clínica                          |
| `{data}`              | Data da marcação (ex: 15 de março)       |
| `{horario}`           | Hora da marcação (ex: 14:00)             |
| `{servico}`           | Nome do serviço                          |
| `{especialista}`      | Nome do especialista                     |
| `{link_agendamento}`  | URL da página de agendamento             |
| `{link_cancelamento}` | URL de cancelamento (com token)          |
| `{link_cancelar}`     | Alias de `{link_cancelamento}`           |
| `{link_site}`         | URL do website                           |
| `{link_instagram}`    | URL do Instagram                         |
| `{link_facebook}`     | URL do Facebook                          |
| `{telefone}`          | Telefone da clínica                      |

> **Nota:** O n8n **nunca precisa resolver estas variáveis**. O backend faz toda a substituição e envia a mensagem final pronta no payload.

### `notification_settings` — Controlo de ativação

Cada `setting_key` corresponde a um slug de template. O campo `enabled` controla se esse canal está ativo.

### `integration_settings` — Chaves relevantes

| `setting_key`                  | Descrição                             |
| ------------------------------ | ------------------------------------- |
| `whatsapp_enabled`             | WhatsApp ativo (`"true"` / `"false"`) |
| `whatsapp_api_key`             | API key da Evolution API              |
| `whatsapp_request_url`         | URL base da Evolution API             |
| `evolution_instance_name`      | Nome da instância Evolution           |
| `sms_enabled`                  | SMS ativo                             |
| `sms_request_url`              | URL da API SMS                        |
| `n8n_webhook_url_booking`      | URL do webhook n8n para marcações     |
| `n8n_marketing_webhook`        | URL do webhook n8n para campanhas e reviews |
| `n8n_webhook_enabled_birthday` | Aniversários ativo                    |
| `n8n_webhook_enabled_inactive` | Inativos ativo                        |
| `email_provider`               | Provedor de e-mail (sempre `resend`)    |
| `email_reply_to`               | Endereço de resposta de e-mail        |
| `review_enabled`               | Avaliações Google ativas              |
| `review_google_url`            | URL de avaliação Google               |
| `review_channel`               | Canais de review (ex: `"whatsapp,email"`) |
| `review_interval_days`         | Dias entre reenvios de review         |
| `review_max_sends`             | Máximo de envios de review por cliente |

---

## Garantia de Campos Não-Vazios (Fallbacks)

Todos os payloads utilizam a função `fb()` — uma cadeia de fallbacks que garante que nenhum campo crítico é enviado vazio:

```typescript
// Se o primeiro valor estiver vazio, tenta o seguinte, e assim por diante
function fb(value, ...fallbacks): string
```

| Campo | Cadeia de fallback |
|-------|-------------------|
| `clinic_name` | `clinic_settings.clinic_name` → `"Clínica"` |
| `channels.email.sender` | `email_from_name` → `clinic_name` → `"Clínica"` |
| `channels.email.from` | `email_from_address` → `email_reply_to` |
| `channels.email.reply_to` | `email_reply_to` → `email_from_address` |
| `channels.email.subject` | `template.subject` → fallback por evento → `template.label` → `"Mensagem de {clínica}"` → `"Notificação"` |
| `channels.email.message` | template resolvido → `"Notificação de {clínica}"` |
| `channels.sms.sender` | `sms_sender_name` → `clinic_name` → `"Clínica"` |
| `channels.sms.message` | template resolvido → `"Notificação de {clínica}"` |
| `client.full_name` | nome do cliente → `"Cliente"` |
| `service_name` | nome do serviço → `"Serviço"` |

---

## WORKFLOW 1 — Agendamentos (Appointments)

**Trigger:** Webhook — o CRM envia um POST em tempo real.

> Configurar a URL do webhook n8n em **Configurações > Integrações > Webhook de Marcações** (`n8n_webhook_url_booking`).

### Como funciona

| Ação no CRM          | O que é enviado ao n8n                                                           |
| -------------------- | -------------------------------------------------------------------------------- |
| Nova marcação        | POST com `event: "confirmed"` + POST com `event: "reminder"` (com `send_at`)    |
| Cancelar marcação    | POST com `event: "cancelled"`                                                    |
| Alterar marcação     | POST com `event: "changed"` (inclui `cancel_url`)                                |

> **Nota:** O POST é disparado pelo **frontend** (ficheiro `src/lib/webhook.ts`), não por uma Edge Function. O frontend busca templates, resolve variáveis, aplica fallbacks e envia o payload completo ao n8n.

### Fluxo

```
Webhook POST (payload completo com mensagens pré-resolvidas)
    │
    ▼
Switch por event
    │
    ├── "confirmed" ──▶ Ler channels → Enviar (WA / Email / SMS) conforme enabled
    │
    ├── "cancelled" ──▶ Ler channels → Enviar
    │
    ├── "changed" ────▶ Ler channels → Enviar
    │
    └── "reminder" ───▶ Nó WAIT (espera até send_at) ──▶ Ler channels → Enviar
```

### Estrutura do Payload (todos os eventos)

O CRM envia as **mensagens já resolvidas** (variáveis substituídas, fallbacks aplicados). O n8n **não precisa de buscar templates, resolver variáveis, nem consultar o backend** — apenas rotear a entrega.

```json
{
  "event": "confirmed",
  "notification_type": "booking_confirmed",
  "appointment_id": "uuid",
  "client": {
    "full_name": "Maria Silva",
    "phone": "+351912345678",
    "email": "maria@email.com"
  },
  "service_name": "Limpeza de Pele",
  "specialist_name": "Dr. João",
  "start_time": "2026-03-15T14:00:00+00:00",
  "clinic_name": "Nome da Clínica",
  "channels": {
    "whatsapp": {
      "enabled": true,
      "message": "Olá Maria! A sua marcação de Limpeza de Pele está confirmada para 15 de março às 14:00."
    },
    "email": {
      "enabled": true,
      "message": "<p>Olá Maria! A sua marcação...</p>",
      "subject": "Parabéns! Sua marcação foi confirmada!",
      "sender": "Nome da Clínica",
      "from": "noreply@exemplo.com",
      "reply_to": "info@exemplo.com"
    },
    "sms": {
      "enabled": false,
      "message": "",
      "callback_url": "https://.../functions/v1/sms-callback",
      "sender": "CLINICA"
    }
  }
}
```

### Campos adicionais por evento

| Evento      | `notification_type`    | Campos extra                          |
| ----------- | ---------------------- | ------------------------------------- |
| `confirmed` | `booking_confirmed`    | —                                     |
| `cancelled` | `booking_cancelled`    | — (`cancel_url` removido; `{link_cancelar}` limpo do template) |
| `changed`   | `booking_changed`      | `cancel_url`                          |
| `reminder`  | `booking_reminder`     | `send_at` (ISO datetime), `cancel_url`|

### Exemplo: `reminder`

```json
{
  "event": "reminder",
  "notification_type": "booking_reminder",
  "appointment_id": "uuid",
  "client": { "full_name": "Maria Silva", "phone": "+351912345678", "email": "maria@email.com" },
  "service_name": "Limpeza de Pele",
  "specialist_name": "Dr. João",
  "start_time": "2026-03-15T14:00:00+00:00",
  "clinic_name": "Nome da Clínica",
  "cancel_url": "https://app.exemplo.pt/cancelar/abc123token",
  "send_at": "2026-03-14T14:00:00.000Z",
  "channels": {
    "whatsapp": { "enabled": true, "message": "Lembrete: amanhã tem marcação..." },
    "email": { "enabled": true, "message": "...", "subject": "Não esqueça sua marcação!", "sender": "Nome da Clínica", "from": "noreply@exemplo.com", "reply_to": "info@exemplo.com" },
    "sms": { "enabled": false, "message": "" }
  }
}
```

> `send_at` = `start_time` − `reminder_lead` (configurável em Agenda, ex: `24h`).
> Se `send_at` já passou, o webhook de reminder **não é enviado** pelo CRM.

### Nó Switch

| Campo  | Valor               |
| ------ | ------------------- |
| Tipo   | Switch              |
| Valor  | `{{ $json.event }}` |
| Ramos  | `confirmed`, `cancelled`, `changed`, `reminder` |

### Nó WAIT (apenas ramo reminder)

| Campo       | Valor                 |
| ----------- | --------------------- |
| Tipo        | Wait                  |
| Resume      | At Specific Date/Time |
| Date & Time | `{{ $json.send_at }}` |

### Enviar — Lógica por Canal

O n8n **só precisa verificar `channels.<canal>.enabled`** e rotear para o canal correto. Toda a mensagem, subject, remetente já vem pronta.

#### WhatsApp (se `channels.whatsapp.enabled === true`)

| Campo   | Valor                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------- |
| Method  | `POST`                                                                                         |
| URL     | `{{ waBaseUrl }}/message/sendText/{{ instanceName }}`                                          |
| Headers | `Content-Type: application/json`, `apikey: {{ waApiKey }}`                                     |
| Body    | `{ "number": "{{ $json.client.phone.replace(/\\D/g, '') }}", "text": "{{ $json.channels.whatsapp.message }}" }` |

#### Email (se `channels.email.enabled === true`)

| Campo     | Valor                                          |
| --------- | ---------------------------------------------- |
| From      | `{{ $json.channels.email.sender }} <{{ $json.channels.email.from }}>` |
| Reply-To  | `{{ $json.channels.email.reply_to }}`          |
| To        | `{{ $json.client.email }}`                     |
| Subject   | `{{ $json.channels.email.subject }}`           |
| HTML Body | `{{ $json.channels.email.message }}`           |

#### SMS (se `channels.sms.enabled === true`)

| Campo   | Valor                                                                               |
| ------- | ----------------------------------------------------------------------------------- |
| Method  | `POST`                                                                              |
| URL     | `{{ smsUrl }}` (da integration_settings)                                            |
| Body    | `{ "callback": "{{ $json.channels.sms.callback_url }}", "mensagem": "{{ $json.channels.sms.message }}", "remetente": "{{ $json.channels.sms.sender }}", "destinatario": "{{ $json.client.phone }}" }` |

> **Importante:** A Evolution API usa header `apikey` (minúsculo, sem Bearer) e body com `number` + `text`.

---

## WORKFLOW 2 — Automações Diárias (Inativos + Aniversário)

**Trigger:** Cron — todos os dias às 08:00

Este workflow trata de duas automações diárias numa única chamada:
- **Aniversariantes** do dia → mensagem de parabéns
- **Clientes inativos** → mensagem de reativação

Inclui também o **relatório semanal de inativos** (enviado às segundas-feiras diretamente via Resend pela Edge Function).

### Fluxo

```
Cron 08:00
    │
    ▼
Nó 1: HTTP Request — Chamar Edge Function daily-notifications
    │
    ▼
Nó 2: IF birthdays_count > 0
    │   ├── Sim ──▶ Nó 3: Loop cada aniversariante
    │   │              ├── Nó 4: Switch por canal (whatsapp / email / sms)
    │   │              │     └── Enviar via canal correspondente
    │   │              └── Nó 5: HTTP Request — notification-callback (reportar envio)
    │   └── Não ──▶ (skip)
    │
    ▼
Nó 6: IF inactive_count > 0
    │   ├── Sim ──▶ Nó 7: Loop cada inativo
    │   │              ├── Nó 8: Switch por canal (whatsapp / email / sms)
    │   │              │     └── Enviar via canal correspondente
    │   │              └── Nó 9: HTTP Request — notification-callback (reportar envio)
    │   └── Não ──▶ (skip)
```

> A Edge Function `daily-notifications` faz tudo numa **única chamada**: busca clientes, busca templates, resolve variáveis, aplica fallbacks, filtra duplicatas e retorna os payloads prontos para envio. O n8n apenas roteia e envia.

### Nó 1 — Chamar Edge Function (Aniversários + Inativos)

| Campo   | Valor                                                                       |
| ------- | --------------------------------------------------------------------------- |
| Method  | `POST`                                                                      |
| URL     | `https://htqavgknoerylnhfebex.supabase.co/functions/v1/daily-notifications` |
| Headers | `x-cron-secret: <chave>`                                                    |

**O que a Edge Function faz internamente (o n8n não precisa saber, mas para referência):**

1. Busca `notification_settings` para saber quais canais estão ativos
2. Busca `message_templates` para os slugs `birthday_*` e `inactive_*`
3. Busca `clinic_settings`, `booking_page_settings`, `smtp_settings` para vars e remetentes
4. Busca `notification_logs` do dia para desduplicar
5. Filtra clientes aniversariantes e inativos
6. Para cada cliente, resolve o template (substitui `{nome}`, `{negocio}`, etc.)
7. Aplica fallbacks em todos os campos (sender, from, reply_to, subject, message)
8. Remove canais já enviados hoje (marca como `skipped: true`)
9. Retorna tudo pronto no payload

**Resposta:**

```json
{
  "success": true,
  "version": "v3-fallback",
  "clinic_name": "Nome da Clínica",
  "birthday_enabled": true,
  "inactive_enabled": true,
  "birthdays_count": 1,
  "inactive_count": 5,
  "birthdays": [
    {
      "id": "uuid",
      "full_name": "Maria Silva",
      "email": "maria@email.com",
      "phone": "+351912345678",
      "birth_date": "1990-03-12",
      "channels": {
        "whatsapp": {
          "enabled": true,
          "message": "Feliz aniversário Maria! A equipa da Nome da Clínica deseja-lhe um excelente dia! 🎂"
        },
        "email": {
          "enabled": true,
          "message": "<p>Feliz aniversário Maria!...</p>",
          "subject": "Feliz Aniversário! 🎂",
          "sender": "Nome da Clínica",
          "from": "noreply@exemplo.com",
          "reply_to": "info@exemplo.com"
        },
        "sms": {
          "enabled": false,
          "message": ""
        }
      }
    }
  ],
  "inactive": [
    {
      "client_id": "uuid",
      "client_name": "João Santos",
      "phone": "+351923456789",
      "email": "joao@email.com",
      "last_visit": "2025-11-15T10:00:00Z",
      "days_inactive": 113,
      "channels": {
        "whatsapp": {
          "enabled": true,
          "message": "Olá João, sentimos sua falta na Nome da Clínica..."
        },
        "email": {
          "enabled": true,
          "message": "<p>Olá João...</p>",
          "subject": "Sentimos sua falta 💛",
          "sender": "Nome da Clínica",
          "from": "noreply@exemplo.com",
          "reply_to": "info@exemplo.com"
        },
        "sms": {
          "enabled": false,
          "message": ""
        }
      }
    }
  ]
}
```

### Enviar — Lógica por Canal

O n8n **só precisa verificar `channels.<canal>.enabled`** e rotear para o canal correto. Toda a mensagem, subject, remetente já vem pronta.

#### WhatsApp (se `channels.whatsapp.enabled === true`)

| Campo   | Valor                                                       |
| ------- | ----------------------------------------------------------- |
| Method  | `POST`                                                      |
| URL     | `{{ waBaseUrl }}/message/sendText/{{ instanceName }}`       |
| Headers | `Content-Type: application/json`, `apikey: {{ waApiKey }}`  |
| Body    | `{ "number": "{{ phone.replace(/\\D/g, '') }}", "text": "{{ channels.whatsapp.message }}" }` |

#### Email (se `channels.email.enabled === true`)

| Campo     | Valor                                          |
| --------- | ---------------------------------------------- |
| From      | `{{ channels.email.sender }} <{{ channels.email.from }}>` |
| Reply-To  | `{{ channels.email.reply_to }}`                |
| To        | `{{ email }}`                                  |
| Subject   | `{{ channels.email.subject }}`                 |
| HTML Body | `{{ channels.email.message }}`                 |

#### SMS (se `channels.sms.enabled === true`)

| Campo   | Valor                                                                               |
| ------- | ----------------------------------------------------------------------------------- |
| Method  | `POST`                                                                              |
| URL     | `{{ smsUrl }}`                                                                      |
| Body    | `{ "callback": "{{ channels.sms.callback_url }}", "mensagem": "{{ channels.sms.message }}", "remetente": "{{ channels.sms.sender }}", "destinatario": "{{ phone }}" }` |

### Após Envio — Reportar Resultado (Obrigatório)

Após cada envio bem-sucedido, o n8n deve chamar o callback para registar o envio e evitar duplicatas no dia seguinte:

```
POST https://htqavgknoerylnhfebex.supabase.co/functions/v1/notification-callback
Header: x-cron-secret: <chave>
```

```json
{
  "client_id": "uuid",
  "notification_type": "birthday",
  "channel": "whatsapp",
  "status": "sent"
}
```

> O campo `status` deve ser a string `"sent"` ou `"failed"`. Apenas `"sent"` ativa a desduplicação.


---

## WORKFLOW 3 — Atendimentos em Aberto (Finalização Automática)

**Trigger:** Cron a cada 30 min

### Conceito

Quando um especialista esquece de finalizar um atendimento (`status: "em_atendimento"`), a Edge Function deteta e age:

| Tempo passado do horário previsto | Ação automática da Edge Function                          |
| --------------------------------- | --------------------------------------------------------- |
| **< 30 min**                      | Ignorado                                                   |
| **30–59 min**                     | ⚠️ Retornado como `warning` (n8n notifica staff)           |
| **≥ 60 min**                      | 🔴 Encerrado automaticamente (`concluido`) + nota no atendimento |

### Fluxo

```
Cron 30min
    │
    ▼
HTTP Request — Chamar check-stuck-appointments
(a Edge Function faz tudo: detecta, encerra e retorna relatório)
```

### Nó 1 — Cron

| Campo   | Valor         |
| ------- | ------------- |
| Trigger | Every 30 min  |

### Nó 2 — HTTP Request: Chamar Edge Function

| Campo   | Valor                                                                             |
| ------- | --------------------------------------------------------------------------------- |
| Method  | `POST`                                                                            |
| URL     | `https://htqavgknoerylnhfebex.supabase.co/functions/v1/check-stuck-appointments` |
| Headers | `x-cron-secret: <chave>`                                                          |

**O que a Edge Function faz internamente:**

1. Busca agendamentos com `status = 'em_atendimento'`
2. Calcula `expected_end` = `end_time` (ou `start_time` + soma de durações dos serviços)
3. Se atraso ≥ 60min: atualiza status para `concluido` e adiciona nota automática
4. Se atraso 30–59min: registra como warning
5. Busca contactos de staff (admins + atendimento) com nome, telefone e email
6. Retorna tudo pronto

**Resposta:**

```json
{
  "success": true,
  "clinic_name": "Nome da Clínica",
  "checked_at": "2026-03-12T15:30:00Z",
  "warnings_count": 1,
  "auto_closed_count": 0,
  "warnings": [
    {
      "appointment_id": "uuid",
      "client_name": "Maria Silva",
      "client_phone": "+351912345678",
      "specialist_name": "Dr. João",
      "service_names": "Limpeza de Pele",
      "start_time": "2026-03-12T14:00:00Z",
      "expected_end": "2026-03-12T14:30:00Z",
      "minutes_overdue": 35,
      "action": "warning"
    }
  ],
  "auto_closed": [],
  "notify_staff": [
    {
      "user_id": "uuid",
      "role": "admin",
      "full_name": "Ana Admin",
      "phone": "+351910000000",
      "email": "admin@exemplo.com"
    }
  ]
}
```

---

## WORKFLOW 4 — Enviador de SMS (Lembretes)

**Trigger:** Cron — a cada 5 minutos (contínuo)

Este workflow implementa um **modelo de polling** para envio de lembretes de agendamento. O n8n consulta a Edge Function `pending-reminders` periodicamente e envia os lembretes que estão prontos.

### Vantagens sobre o modelo Wait

- Elimina dependência de Data Tables do n8n
- Lembretes sobrevivem a reinicializações do n8n
- Mensagens são resolvidas na criação (editar template não afeta pendentes)
- Visibilidade total no banco de dados (`reminder_history`)

### Fluxo

```
Schedule Trigger (5 min)
        │
        ▼
  HTTP Request: GET /pending-reminders
  (header: x-cron-secret)
        │
        ▼
  IF total > 0 ?
   ├─ NÃO → Stop
   └─ SIM ▼
     Split In Batches (reminders[])
        │
        ▼
     Para cada lembrete:
        │
        ├── channels_payload.channels.sms.enabled?
        │    └── SIM → Enviar SMS
        │
        ├── channels_payload.channels.whatsapp.enabled?
        │    └── SIM → Enviar WhatsApp (Evolution API)
        │
        ├── channels_payload.channels.email.enabled?
        │    └── SIM → Enviar E-mail (Resend)
        │
        ▼
     HTTP Request: POST /reminder-callback
     (atualizar status no banco)
```

### Nó 1 — Schedule Trigger

| Campo | Valor |
|-------|-------|
| Tipo | Schedule Trigger |
| Intervalo | A cada 5 minutos |
| Cron | `*/5 * * * *` |

### Nó 2 — HTTP Request: Buscar Lembretes Pendentes

| Campo | Valor |
|-------|-------|
| Método | `GET` |
| URL | `https://htqavgknoerylnhfebex.supabase.co/functions/v1/pending-reminders` |
| Headers | `x-cron-secret: <chave>` |
| Query (opcional) | `window_minutes=5` |

**Resposta:**

```json
{
  "ok": true,
  "total": 2,
  "reminders": [
    {
      "id": "uuid-do-lembrete",
      "appointment_id": "uuid-da-marcacao",
      "client_name": "Maria Silva",
      "service_name": "Limpeza de Pele",
      "specialist_name": "Dra. Ana",
      "start_time": "2026-04-06T14:00:00+01:00",
      "send_at": "2026-04-05T14:00:00.000Z",
      "channels_summary": {
        "sms": true,
        "whatsapp": true,
        "email": true
      },
      "channels_payload": {
        "client": {
          "full_name": "Maria Silva",
          "phone": "+351912345678",
          "email": "maria@email.com"
        },
        "clinic_name": "Derma Lum",
        "cancel_url": "https://sistema.com/cancelar/token-uuid",
        "channels": {
          "sms": {
            "enabled": true,
            "message": "Olá Maria! Lembramos da sua marcação amanhã às 14:00...",
            "sender": "DermaLum",
            "callback_url": "https://xxx.supabase.co/functions/v1/sms-callback"
          },
          "whatsapp": {
            "enabled": true,
            "message": "Olá Maria! 🌟 Lembramos da sua marcação..."
          },
          "email": {
            "enabled": true,
            "message": "<html>...</html>",
            "subject": "Não esqueça sua marcação!",
            "sender": "Derma Lum",
            "from": "notificacoes@dermalum.com",
            "reply_to": "contato@dermalum.com"
          }
        }
      }
    }
  ]
}
```

### Nó 3 — Envio por Canal

Para cada lembrete, verificar os canais habilitados e enviar:

#### SMS
- **Condição**: `{{ $json.channels_payload.channels.sms.enabled }}`
- Destinatário: `{{ $json.channels_payload.client.phone }}`
- Mensagem: `{{ $json.channels_payload.channels.sms.message }}`
- Remetente: `{{ $json.channels_payload.channels.sms.sender }}`

#### WhatsApp
- **Condição**: `{{ $json.channels_payload.channels.whatsapp.enabled }}`
- Destinatário: `{{ $json.channels_payload.client.phone }}`
- Mensagem: `{{ $json.channels_payload.channels.whatsapp.message }}`

#### E-mail
- **Condição**: `{{ $json.channels_payload.channels.email.enabled }}`
- Destinatário: `{{ $json.channels_payload.client.email }}`
- Assunto: `{{ $json.channels_payload.channels.email.subject }}`
- HTML: `{{ $json.channels_payload.channels.email.message }}`
- De: `{{ $json.channels_payload.channels.email.sender }} <{{ $json.channels_payload.channels.email.from }}>`
- Reply-To: `{{ $json.channels_payload.channels.email.reply_to }}`

### Nó 4 — Callback: Atualizar Status

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| URL | `https://htqavgknoerylnhfebex.supabase.co/functions/v1/reminder-callback` |
| Headers | `x-cron-secret: <chave>`, `Content-Type: application/json` |

```json
{
  "appointment_id": "{{ $json.appointment_id }}",
  "status": "sent",
  "status_detail": "Enviado com sucesso via todos os canais",
  "sms_external_id": "{{ $json.sms_result_id }}",
  "whatsapp_external_id": "{{ $json.whatsapp_result_id }}",
  "email_external_id": "{{ $json.email_result_id }}"
}
```

### Status do Lembrete (ciclo de vida)

```
pending → dispatched → sent/partial/failed
   │
   └── cancelled (se a marcação for cancelada ou alterada)
```

| Status | Quem define | Significado |
|---|---|---|
| `pending` | Sistema (ao criar agendamento) | Aguardando o momento de envio |
| `dispatched` | `pending-reminders` endpoint | Entregue ao n8n, aguardando confirmação |
| `sent` | n8n (via `reminder-callback`) | Enviado com sucesso |
| `partial` | n8n (via `reminder-callback`) | Enviado parcialmente |
| `failed` | n8n (via `reminder-callback`) | Falha no envio |
| `cancelled` | Sistema (ao cancelar/alterar marcação) | Lembrete cancelado |

### Notas sobre Lembretes

1. **Mensagens pré-resolvidas**: As mensagens são montadas com as variáveis substituídas no momento da criação do agendamento. Editar um template **não** afeta lembretes já agendados.
2. **Deduplicação**: O endpoint `pending-reminders` marca os lembretes como `dispatched` atomicamente ao retorná-los.
3. **Cancelamento automático**: Quando uma marcação é cancelada ou alterada, os lembretes pendentes são automaticamente marcados como `cancelled`.
4. **Safety net**: O endpoint `bulk-reminders` pode ser chamado periodicamente (ex: 1x/dia) para criar lembretes que possam ter sido perdidos.

---

## WORKFLOW 5 — Marketing (Campanhas)

**Trigger:** Webhook — a Edge Function `send-campaign` envia um POST com todos os destinatários.

> Configurar a URL do webhook n8n em **Configurações > Integrações > Webhook de Marketing** (`n8n_marketing_webhook`). Se não estiver definido, usa o webhook principal (`n8n_webhook_url`).

### Como funciona

Quando o admin clica **"Enviar Campanha"** (ou **"Enviar Teste"**), o CRM:

1. Filtra os destinatários por audiência (todos, novos, ativos, inativos)
2. Insere cada destinatário na tabela `campaign_recipients` com status `pending`
3. Envia **um único POST** ao webhook do n8n com todos os destinatários
4. Os destinatários ficam como `pending` — o n8n processa e reporta o resultado via **callback**

O HTML do email vem **completamente renderizado** (header, CTA, footer, social links embutidos). Todas as variáveis (`{nome}`, `{email}`, `{telefone}`, `{negocio}`) são **substituídas server-side** por recipient — o n8n recebe o conteúdo final pronto para envio, sem necessidade de fazer replace.

### Fluxo Completo

```
Admin clica "Enviar"
    │
    ▼
Edge Function send-campaign
    → Insere recipients como "pending"
    → POST único ao webhook n8n com todos os recipients
    → Campanha fica com status "sending"
    │
    ▼
n8n Webhook recebe payload
    │
    ▼
Switch por channel (email / sms / whatsapp)
    │
    ▼
SplitInBatches (recipients[])
    │
    ├── Para cada recipient: enviar via Resend / SMS API / Evolution
    │   └── Acumular resultado (Set node: client_id + status + error)
    │
    ▼
Após processar TODOS os recipients:
    POST /functions/v1/campaign-callback
    Header: x-cron-secret: <chave>
    Body: array com todos os resultados
    │
    ▼
campaign-callback atualiza cada recipient e recalcula status da campanha
    → "sent" (todos ok) | "partial" (alguns falharam) | "failed" (todos falharam)
```

### Estrutura do Payload — Email (POST único)

O HTML do email vem **completamente renderizado** pela Edge Function — todas as variáveis (`{nome}`, `{email}`, `{telefone}`, `{negocio}`) já estão substituídas por recipient. O n8n envia o `html_body` tal qual.

```json
{
  "event": "marketing_campaign",
  "campaign_id": "uuid",
  "channel": "email",
  "test_only": false,
  "batch_size": 1,
  "send_delay_seconds": 2,
  "subject": "Celebre o Dia do Pai! 🎁",
  "from_name": "Nome da Clínica",
  "from_email": "noreply@exemplo.com",
  "reply_to": "info@exemplo.com",
  "recipients": [
    {
      "client_id": "uuid",
      "nome": "Maria Silva",
      "email": "maria@email.com",
      "html_body": "<!DOCTYPE html><html>...Olá {nome}...</html>"
    }
  ]
}
```

### Estrutura do Payload — SMS / WhatsApp

```json
{
  "event": "marketing_campaign",
  "campaign_id": "uuid",
  "channel": "sms",
  "test_only": false,
  "batch_size": 1,
  "send_delay_seconds": 2,
  "sender_name": "NomeDaClinica",
  "recipients": [
    {
      "client_id": "uuid",
      "nome": "Maria Silva",
      "telefone": "+351912345678",
      "message": "Olá {nome}, temos novidades..."
    }
  ]
}
```

### Campos por canal

| Campo | E-mail | SMS | WhatsApp |
|-------|--------|-----|----------|
| `subject` | ✅ Assunto | — | — |
| `from_name` | ✅ Nome do remetente | — | — |
| `from_email` | ✅ Endereço do remetente | — | — |
| `reply_to` | ✅ Reply-To | — | — |
| `sender_name` | — | ✅ Sender ID | ✅ |
| `recipients[].email` | ✅ To | — | — |
| `recipients[].html_body` | ✅ HTML pronto | — | — |
| `recipients[].telefone` | — | ✅ | ✅ |
| `recipients[].message` | — | ✅ Texto | ✅ Texto |
| `recipients[].nome` | ✅ Para replace `{nome}` | ✅ | ✅ |

### Nós do Workflow

**Webhook:** Método POST, Path `/marketing-campaign`

**Switch:** `{{ $json.channel }}` → ramos `email`, `sms`, `whatsapp`

**E-mail (Resend):**

Para cada recipient, substituir `{nome}` no `html_body` e enviar:

```json
{
  "from": "{{ $json.from_name }} <{{ $json.from_email }}>",
  "to": "{{ $item.email }}",
  "reply_to": "{{ $json.reply_to }}",
  "subject": "{{ $json.subject }}",
  "html": "{{ $item.html_body }}"
}
```

**SMS:**
```json
{
  "callback": "https://htqavgknoerylnhfebex.supabase.co/functions/v1/sms-callback",
  "mensagem": "{{ $item.message }}",
  "remetente": "{{ $json.sender_name }}",
  "destinatario": "{{ $item.telefone }}"
}
```

**WhatsApp (Evolution API):**
```json
{
  "number": "{{ $item.telefone.replace(/\\D/g, '') }}",
  "text": "{{ $item.message }}"
}
```

### Controle Anti-Bloqueio

Os campos `batch_size` e `send_delay_seconds` vêm no payload para o n8n usar no `SplitInBatches` e no nó `Wait`:

| Campo no payload | Default | Descrição |
|-----------------|---------|-----------|
| `batch_size` | 1 | Nº de recipients a processar por iteração do SplitInBatches |
| `send_delay_seconds` | 2 | Segundos de pausa entre cada batch (usar nó Wait) |

A interface mostra uma **estimativa em tempo real** (ETA) antes do envio.

### Callback: Reportar Resultados

**IMPORTANTE:** Após processar todos os recipients, o n8n deve enviar um **único POST** com os resultados de todos os envios. Isto actualiza o status de cada destinatário e recalcula o status global da campanha.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| URL | `https://htqavgknoerylnhfebex.supabase.co/functions/v1/campaign-callback` |
| Headers | `x-cron-secret: <chave>`, `Content-Type: application/json` |

**Payload — Array de resultados:**

```json
[
  {
    "campaign_id": "uuid-da-campanha",
    "client_id": "uuid-do-cliente",
    "status": "sent",
    "external_id": "resend_msg_id_123"
  },
  {
    "campaign_id": "uuid-da-campanha",
    "client_id": "uuid-do-cliente-2",
    "status": "failed",
    "error_message": "Invalid email address"
  }
]
```

**Campos por item:**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `campaign_id` | ✅ | UUID da campanha |
| `client_id` | ✅ | UUID do cliente |
| `status` | ✅ | `sent`, `failed`, `delivered`, `opened`, `clicked` |
| `error_message` | Só para `failed` | Mensagem de erro |
| `external_id` | Não | ID do serviço externo (Resend, Evolution, etc.) |
| `sent_at` | Não | Timestamp ISO (default: agora) |

**Resposta:**

```json
{
  "success": true,
  "updated": 150,
  "errors": ["Erro ao atualizar uuid-x: ..."]
}
```

### Como acumular resultados no n8n

O n8n precisa acumular os resultados de cada envio individual e enviá-los todos de uma vez no final. Método recomendado:

1. **Antes do SplitInBatches**: Criar variável `$workflow.results = []`
2. **Após cada envio** (Set node): Adicionar ao array:
   ```
   $workflow.results.push({
     campaign_id: $json.campaign_id,
     client_id: $item.client_id,
     status: $prevNode.success ? "sent" : "failed",
     error_message: $prevNode.success ? undefined : $prevNode.error,
     external_id: $prevNode.response?.id
   })
   ```
3. **Após o último batch** (If node: `{{ $json.noItemsLeft }}`):
   - HTTP Request POST para `/functions/v1/campaign-callback`
   - Body: `{{ JSON.stringify($workflow.results) }}`

**Alternativa simples (sem variável global):**
- Usar um nó **Code** após o SplitInBatches que concatena todos os outputs anteriores num único array e faz o POST.

### Ciclo de vida dos recipients

```
pending → sent/failed/delivered/opened/clicked
```

| Status | Quem define | Significado |
|--------|-------------|-------------|
| `pending` | `send-campaign` (ao despachar) | Aguardando envio pelo n8n |
| `sent` | n8n (via `campaign-callback`) | Enviado com sucesso |
| `failed` | n8n (via `campaign-callback`) ou `send-campaign` (se webhook falhar) | Falha no envio |
| `delivered` | n8n (via `campaign-callback`) | Entregue ao destinatário |
| `opened` | n8n (via `campaign-callback`) | E-mail aberto |
| `clicked` | n8n (via `campaign-callback`) | Link clicado |

### Status da campanha (recalculado pelo callback)

| Status | Condição |
|--------|----------|
| `sending` | Ainda há recipients `pending` |
| `sent` | Todos os recipients com status positivo (sent/delivered/opened/clicked) |
| `partial` | Mix de sucessos e falhas, nenhum pending |
| `failed` | Todos os recipients falharam |

### Filtros de Audiência

| Filtro | Lógica |
|--------|--------|
| `all` | Todos os clientes com contacto válido |
| `new` | Primeira visita nos últimos 30 dias |
| `active` | Última visita nos últimos 30 dias |
| `inactive` | Última visita há mais de 30 dias (ou sem visitas) |

### Autenticação

- `send-campaign` aceita **apenas** JWT de admin (Authorization header) — invocada pelo frontend
- `campaign-callback` aceita **apenas** `x-cron-secret` — invocada pelo n8n

---

## WORKFLOW 6 — Google Review (Avaliações)

**Trigger:** Cron — Diário às 10:00 AM

Este workflow automatiza pedidos de avaliação Google para clientes que concluíram atendimentos. É um workflow **independente** — não partilha webhook com o Marketing. O n8n faz o Cron, recebe o payload na resposta e trata o envio.

### Como funciona

1. O admin ativa "Pedido de Avaliação Google" em **Marketing → Avaliações**
2. Configura: negócio Google (Place ID), canais, intervalo, máx. envios, mensagens por canal
3. O cron job do n8n chama a Edge Function `send-review-requests` diariamente às 10:00
4. A Edge Function:
   a. Cria `review_requests` para atendimentos concluídos há 24h+ (cada cliente entra na lista **apenas 1 vez**, nunca mais)
   b. Busca pedidos pendentes (due to send)
   c. Resolve mensagens com variáveis
   d. Atualiza `send_count` e `next_send_at`
   e. **Devolve tudo no response** — array `recipients` com payloads prontos por canal
5. O n8n itera o array `recipients` e envia por canal (Switch)
6. O cliente recebe mensagem com 2 links:
   - `{link_google}` → Abre a página de avaliação Google
   - `{link_confirmar}` → Confirma que avaliou (para o ciclo de reenvio)
7. Ao clicar em `{link_confirmar}`, a Edge Function `confirm-review` marca `confirmed_at` e pára de reenviar

### Fluxo

```
Cron (diário às 10:00)
    │
    ▼
HTTP Request: POST /functions/v1/send-review-requests
    Header: x-cron-secret: <chave>
    │
    ▼
Response JSON com array "recipients"
    │
    ▼
Split In Batches (recipients)
    │
    ▼
Switch (channel)
    ├── email ──▶ HTTP Request (Resend)
    ├── sms ────▶ HTTP Request (API SMS)
    └── whatsapp ▶ HTTP Request (Evolution API)
```

### Nó 1 — Cron: Chamar Edge Function

| Campo   | Valor                                                                             |
| ------- | --------------------------------------------------------------------------------- |
| Trigger | Schedule — Diário às 10:00                                                        |
| Method  | `POST`                                                                            |
| URL     | `https://htqavgknoerylnhfebex.supabase.co/functions/v1/send-review-requests`     |
| Headers | `x-cron-secret: <chave>`                                                          |

**Resposta:**
```json
{
  "recipients": [ ... ],
  "created": 3,
  "due": 8
}
```

### Modelo pessimista (4 estados)

Os registos têm `delivery_status`: `queued` → `reserved` → `delivered` → `confirmed` (ou `failed`).

1. n8n faz `POST` ao endpoint `send-review-requests` → recebe lote em `recipients[]`. Os registos ficam **`reserved`** por 10 min e não voltam noutra chamada.
2. Para cada item, o n8n envia pelo(s) canal(is) indicado(s).
3. **Imediatamente após cada envio**, o n8n faz `POST` ao Callback (ver abaixo) com `request_id` + `status`.
4. Sem callback em 10 min, o item volta para a fila e será reenviado no próximo ciclo.
5. O contador `send_count` só sobe quando o callback confirma `status=sent`.

### Callback de Confirmação

| Campo   | Valor                                                                       |
| ------- | --------------------------------------------------------------------------- |
| Method  | `POST`                                                                      |
| URL     | `https://<projeto>.supabase.co/functions/v1/review-callback`                |
| Headers | `x-cron-secret: <chave>`, `Content-Type: application/json`                  |

**Body:**
```json
{
  "request_id": "<uuid recebido em recipients[].request_id>",
  "status": "sent",
  "error": "mensagem opcional se status=failed"
}
```

- `status: "sent"` → marca `delivered`, incrementa `send_count`, agenda próximo reenvio.
- `status: "failed"` → marca `failed`, agenda retry em 15 min, **não** incrementa `send_count`.

**Múltiplos canais por request_id:** se enviares por 3 canais, agrega no n8n e chama o callback **uma vez** com `sent` se pelo menos 1 canal entregou, ou `failed` se todos falharam. Chamar 3x faz `send_count` subir 3x.

### Estrutura de cada item em `recipients`

**WhatsApp/SMS:**
```json
{
  "event": "review_request",
  "channel": "whatsapp",
  "client_id": "uuid-do-cliente",
  "client_name": "Maria Silva",
  "phone": "+351912345678",
  "message": "Olá Maria! 😊\n\nObrigado por ter escolhido os nossos serviços...\n\nhttps://search.google.com/local/writereview?placeid=ChIJ...\n\nSe já avaliou: https://.../confirm-review?token=abc123"
}
```

**E-mail:**
```json
{
  "event": "review_request",
  "channel": "email",
  "client_id": "uuid-do-cliente",
  "client_name": "Maria Silva",
  "to": "maria@email.com",
  "subject": "Dermalūm — A sua opinião é importante! ⭐",
  "sender_name": "Dermalūm",
  "message": "Olá Maria! 😊\n\nObrigado por ter escolhido os nossos serviços..."
}
```

### Envio por Canal

#### WhatsApp
```json
POST {{ waBaseUrl }}/message/sendText/{{ instanceName }}
Header: apikey: {{ waApiKey }}

{
  "number": "{{ $json.phone.replace(/\\D/g, '') }}",
  "text": "{{ $json.message }}"
}
```

#### E-mail (Resend)
```json
{
  "from": "{{ $json.sender_name }} <{{ fromEmail }}>",
  "to": "{{ $json.to }}",
  "subject": "{{ $json.subject }}",
  "html": "{{ $json.message }}"
}
```

#### SMS
```json
{
  "mensagem": "{{ $json.message }}",
  "remetente": "{{ senderName }}",
  "destinatario": "{{ $json.phone }}"
}
```

### Configurações (integration_settings)

| Chave | Default | Descrição |
|-------|---------|-----------|
| `review_enabled` | `"false"` | Ativa/desativa o sistema |
| `review_google_url` | — | URL de avaliação Google (auto-gerada do Place ID) |
| `review_place_id` | — | Place ID do Google Maps |
| `review_place_name` | — | Nome do negócio no Google |
| `review_channel` | `"whatsapp"` | Canais separados por vírgula (ex: `"whatsapp,email"`) |
| `review_interval_days` | `"7"` | Dias entre reenvios |
| `review_max_sends` | `"3"` | Máximo de envios por cliente |
| `review_message` | (template default) | Mensagem genérica (fallback) |
| `review_message_whatsapp` | — | Mensagem específica para WhatsApp |
| `review_message_email` | — | Mensagem específica para E-mail |
| `review_message_sms` | — | Mensagem específica para SMS |

### Variáveis de Template (Reviews)

| Variável | Descrição |
|----------|-----------|
| `{nome}` | Primeiro nome do cliente |
| `{nome_completo}` | Nome completo do cliente |
| `{link_google}` | URL de avaliação Google |
| `{link_confirmar}` | URL de confirmação (para parar de reenviar) |
| `{negocio}` | Nome da clínica |

### Edge Function: confirm-review

**Endpoint público** (sem autenticação — link enviado ao cliente):

```
GET /functions/v1/confirm-review?token=<uuid>
```

1. Busca `review_requests` pelo `confirmation_token`
2. Se já confirmado → mostra "Já registámos a sua avaliação"
3. Se válido → marca `confirmed_at = now()`, `next_send_at = null`
4. Retorna página HTML estilizada com mensagem de agradecimento

### Ciclo de Reenvio

```
Atendimento concluído → review_request criado (send_count=0)
    │
    ▼
1º envio → send_count=1, next_send_at = now + interval_days
    │
    ▼
2º envio → send_count=2, next_send_at = now + interval_days
    │
    ▼
... até send_count >= max_sends → next_send_at = null (para)
    │
    └── OU cliente clica {link_confirmar} → confirmed_at = now, next_send_at = null
```

---

## Callback de Notificações — `notification-callback`

Edge Function usada pelo n8n para reportar resultados de envio. Previne duplicatas no dia.

| Campo   | Valor                                                                             |
| ------- | --------------------------------------------------------------------------------- |
| Method  | `POST`                                                                            |
| URL     | `https://htqavgknoerylnhfebex.supabase.co/functions/v1/notification-callback`    |
| Headers | `x-cron-secret: <chave>`, `Content-Type: application/json`                        |

### Payload — Envio individual

```json
{
  "client_id": "uuid",
  "notification_type": "birthday",
  "channel": "whatsapp",
  "status": "sent"
}
```

### Payload — Envio em lote (array direto)

```json
[
  { "client_id": "uuid", "notification_type": "birthday", "channel": "whatsapp", "status": "sent" },
  { "client_id": "uuid", "notification_type": "birthday", "channel": "email", "status": "sent" },
  { "client_id": "uuid", "notification_type": "inactive", "channel": "sms", "status": "failed" }
]
```

> **Atenção:** O formato batch é um **array direto** (não um objeto com chave `batch`).
> O campo `status` deve ser a string `"sent"` ou `"failed"` — **não aceita booleanos**.
> Apenas registos com `status: "sent"` ativam a desduplicação.

---

## Resumo

| #   | Workflow                          | Trigger     | Frequência         | Edge Function / Origem       | O que retorna                       |
| --- | --------------------------------- | ----------- | ------------------ | ---------------------------- | ----------------------------------- |
| 1   | Agendamentos (Appointments)       | Webhook     | Tempo real         | Frontend (`webhook.ts`)      | Payload com channels pré-resolvidos |
| 2   | Automações diárias (Inativos + Aniversário) | Cron | Diário 08:00 | `daily-notifications`        | Clientes + channels pré-resolvidos |
| 3   | Atendimentos em aberto            | Cron 30 min | Horário comercial  | `check-stuck-appointments`   | Warnings + auto_closed + staff      |
| 4   | Enviador de SMS (Lembretes)       | Cron 5 min  | Contínuo           | `pending-reminders`          | Lembretes com channels pré-resolvidos |
| 5   | Marketing (Campanhas)             | Webhook     | Sob demanda        | `send-campaign` (lotes)      | Conteúdo + recipients por lote      |
| 6   | Google Review (Avaliações)        | Cron 10:00  | Diário             | `send-review-requests`       | Array `recipients` com payloads prontos |

---

## Checklist de Configuração

### No CRM:

- [ ] Configurar Resend (API Key + remetente) em **Configurações > E-mail**
- [ ] Configurar WhatsApp (Evolution API) em **Configurações > Integrações**
- [ ] Colar a URL do Webhook do n8n em **Integrações > Webhook de Marcações**
- [ ] Colar a URL do Webhook do n8n em **Integrações > Webhook de Marketing** (usado por WF5 e WF6)
- [ ] Ativar Aniversariantes e/ou Inativos no card **Automação Diária**
- [ ] Definir tempo de lembrete em **Configurações > Agenda** (ex: `24h`)
- [ ] Editar e ativar templates em **Configurações > Notificações**
- [ ] Ativar Avaliações Google em **Marketing > Avaliações** (configurar Place ID, canais, mensagens)

### No n8n:

- [ ] Criar credencial HTTP Header Auth com `x-cron-secret` para Edge Functions
- [ ] Criar credencial Evolution API (URL + apikey) para WhatsApp
- [ ] Workflow 1: Webhook → switch (event) → enviar por canal (mensagens pré-resolvidas)
- [ ] Workflow 2: Cron diário → `daily-notifications` → loop → enviar → callback + relatório semanal (seg)
- [ ] Workflow 3: Cron 30min → chamar `check-stuck-appointments`
- [ ] Workflow 4: Cron 5min → `pending-reminders` → loop → enviar por canal → `reminder-callback`
- [ ] Workflow 5: Webhook → switch (channel) → split batches → enviar
- [ ] Workflow 6: Cron 6h → `send-review-requests` (payloads enviados ao webhook de marketing)
- [ ] Copiar URLs dos webhooks dos Workflows 1 e 5 para o CRM
- [ ] Testar cada workflow manualmente
- [ ] Ativar os triggers

---

## Notas

1. **Todos os payloads incluem mensagens pré-resolvidas.** O n8n **nunca precisa** buscar templates, resolver variáveis, nem consultar tabelas.
2. **Templates são editáveis na UI** — mas o backend resolve-os antes de enviar o payload.
3. **Canais podem ser desativados.** Cada canal em `channels` tem o campo `enabled`. Se `false`, não enviar.
4. **Lembretes usam polling** (Workflow 4). O endpoint `pending-reminders` marca como `dispatched` atomicamente para deduplicação.
5. **Se `send_at` já passou**, o reminder não é enviado pelo CRM no Workflow 1.
6. **WhatsApp na UI** usa links `wa.me` (abre o app do utilizador) — não usa a API.
7. **Atendimentos esquecidos:** A Edge Function auto-encerra após 60min. O n8n só notifica o staff.
8. **Campanhas de marketing** são enviadas em lotes com delay configurável.
9. **Google Reviews** é um workflow independente (Cron diário às 10:00). A Edge Function devolve o array `recipients` no response — o n8n itera e envia por canal.
10. **Nenhum campo de payload é enviado vazio.** Todos os campos possuem fallbacks encadeados via função `fb()`.
11. **Callback é obrigatório para desduplicação** do Workflow 2. Sem chamar `notification-callback`, o sistema reenviará as mesmas notificações.
12. **Cobranças (send-charge)** são enviadas diretamente pela Edge Function — não passam pelo n8n.
