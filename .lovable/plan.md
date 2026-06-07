## Objetivo

Impedir que o cron envie de novo o pedido de avaliação aos **19 clientes que já receberam** o email (confirmado pelo log do Resend), sincronizando a tabela `review_requests` com a realidade.

## Diagnóstico

- Resend log: 31 envios do email "A sua opinião é importante! ⭐", para **19 emails únicos** (8 já em duplicado, vários no dia 15/16).
- `review_requests`: 66 rows, **nenhuma** com `send_count > 0`. 52 estão `failed` (resetadas pela migração anterior) e 7 `queued` — todas elegíveis para re-envio pelo cron.
- A única ponte entre CSV e tabela é `email → clients.id → review_requests.client_id`.

## Passos

### 1. Carregar a lista de emails já enviados numa tabela temporária

Subir os 19 emails únicos (com `send_count` real do CSV e `last_sent_at` máximo) para uma tabela temporária via `supabase--insert`. Algo como:

```sql
CREATE TEMP TABLE _already_sent (email text PRIMARY KEY, sends int, last_sent timestamptz);
INSERT INTO _already_sent VALUES
  ('dyego@efkz.com.br', 5, '2026-05-11 19:37:07+00'),
  ('carlagabi1971@gmail.com', 2, '2026-05-14 09:01:16+00'),
  ... (19 linhas)
```

> Limitação: `supabase--insert` não cria tabelas. Faço o UPDATE direto com um `VALUES (...)` inline em vez da temp table — mesmo efeito, uma só query.

### 2. UPDATE em massa nas rows correspondentes

Para cada `review_requests` cujo `client_id` casa com um cliente desses emails **e ainda não foi `confirmed`**:

- `delivery_status = 'delivered'`
- `send_count = GREATEST(send_count, <sends do CSV>)`
- `last_sent_at = <last_sent do CSV>`
- `delivered_at = <last_sent do CSV>`
- `reserved_until = NULL`
- `last_error = NULL`
- `next_send_at` = se `send_count >= review_max_sends` → `NULL`; senão `last_sent_at + review_interval_days`
- mantém `confirmed_at` intocado

### 3. Verificação pós-update

Query rápida para confirmar:
- 0 rows desses 19 emails ainda em `queued`/`failed`/`reserved`
- `send_count` >= 1 para todos
- Contagem antes/depois por `delivery_status`

## Por que assim e não automatizar via callback

O n8n não vai mandar `request_id` para envios passados — esses 31 emails foram emitidos antes da nova lógica. É um **fix de dados único**, manual. A partir daqui, o fluxo novo (`send-review-requests` com `send_count` otimista + lock de 24h) cuida do resto.

## Riscos / cuidados

- Clientes sem `clients.email` (ou email diferente do que foi para o Resend) **não serão marcados** — improvável aqui porque o n8n usou o email da própria tabela `clients`.
- Se `review_max_sends = 1` (típico), todos os 19 ficam com `next_send_at = NULL` → nunca mais recebem. Confirmar este valor em `integration_settings` antes do UPDATE (faço SELECT primeiro).

## Entregável

Uma única chamada `supabase--insert` com o UPDATE pronto, mais um `supabase--read_query` antes (para ler `review_max_sends` / `review_interval_days`) e outro depois (verificação).
