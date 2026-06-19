-- Instagram DM support

-- Campos extras em conversations para Instagram
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS instagram_user_id text,
  ADD COLUMN IF NOT EXISTS instagram_username text;

CREATE INDEX IF NOT EXISTS conversations_instagram_user_id_idx
  ON public.conversations(instagram_user_id)
  WHERE instagram_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS conversations_channel_idx
  ON public.conversations(channel);

-- Log de eventos brutos do Instagram (espelho do wp_webhook_events)
CREATE TABLE IF NOT EXISTS public.ig_webhook_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name text,
  event_type    text NOT NULL DEFAULT 'other',
  payload       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ig_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_ig_events" ON public.ig_webhook_events FOR SELECT USING (true);
