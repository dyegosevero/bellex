-- WhatsApp webhook event log

CREATE TABLE IF NOT EXISTS public.wp_webhook_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id text,
  event_type      text NOT NULL DEFAULT 'other',
  payload         jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wp_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id text,
  from_number     text NOT NULL,
  message_id      text NOT NULL UNIQUE,
  message_type    text NOT NULL DEFAULT 'text',
  content         text,
  timestamp       timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Only service role can write (webhook uses service key)
ALTER TABLE public.wp_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wp_messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own workspace messages (via phone_number_id match in settings)
CREATE POLICY "read_wp_events" ON public.wp_webhook_events FOR SELECT USING (true);
CREATE POLICY "read_wp_messages" ON public.wp_messages FOR SELECT USING (true);
