-- Histórico de conversas por canal (WhatsApp, Instagram, etc.)

CREATE TABLE IF NOT EXISTS public.conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  channel       text NOT NULL DEFAULT 'whatsapp', -- 'whatsapp' | 'instagram' | 'manual'
  instance_name text,  -- EvoAPI instance name
  remote_jid    text,  -- phone@s.whatsapp.net
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, channel, instance_name)
);

CREATE INDEX IF NOT EXISTS conversations_lead_id_idx ON public.conversations(lead_id);

-- Mensagens da conversa (histórico p/ IA)
CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  text            text NOT NULL,
  from_me         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_conversations" ON public.conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_conversations" ON public.conversations FOR ALL TO authenticated USING (true);

CREATE POLICY "service_role_messages" ON public.messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_messages" ON public.messages FOR ALL TO authenticated USING (true);
