-- Migration: CRM Pipeline + OmniChannel Mensagens
-- Tables: pipeline_stages, leads, conversations, messages, whatsapp_instances

-- ──────────────────────────────────────────────
-- pipeline_stages
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label       TEXT        NOT NULL,
  color       TEXT        NOT NULL DEFAULT '#6b7280',
  position    INTEGER     NOT NULL DEFAULT 0,
  agent_enabled  BOOLEAN NOT NULL DEFAULT false,
  agent_model    TEXT,
  agent_prompt   TEXT,
  agent_schedule TEXT,   -- 'immediate' | 'business_hours'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default stages
INSERT INTO public.pipeline_stages (label, color, position, agent_enabled, agent_prompt, agent_schedule)
VALUES
  ('Novo Lead',    '#3b82f6', 0, true,  'Olá {nome}! Vi que você entrou em contato conosco. Em que posso te ajudar hoje? 😊', 'immediate'),
  ('Qualificando', '#f59e0b', 1, false, null, null),
  ('Proposta',     '#8b5cf6', 2, false, null, null),
  ('Fechado',      '#10b981', 3, false, null, null)
ON CONFLICT DO NOTHING;

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Staff can view pipeline stages" ON public.pipeline_stages
  FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Admin can manage pipeline stages" ON public.pipeline_stages
  FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ──────────────────────────────────────────────
-- leads
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT        NOT NULL,
  phone        TEXT,
  email        TEXT,
  source       TEXT        NOT NULL DEFAULT 'manual',  -- 'whatsapp' | 'instagram' | 'manual' | 'webhook'
  stage_id     UUID        REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  last_message TEXT,
  notes        TEXT,
  archived     BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_stage_id_idx ON public.leads(stage_id);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads(created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view leads" ON public.leads;
CREATE POLICY "Staff can view leads" ON public.leads
  FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can insert leads" ON public.leads;
CREATE POLICY "Staff can insert leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can update leads" ON public.leads;
CREATE POLICY "Staff can update leads" ON public.leads
  FOR UPDATE TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admin can delete leads" ON public.leads;
CREATE POLICY "Admin can delete leads" ON public.leads
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Service role bypass (for webhook)
DROP POLICY IF EXISTS "Service role can manage leads" ON public.leads;
CREATE POLICY "Service role can manage leads" ON public.leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- conversations
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id         UUID        REFERENCES public.leads(id) ON DELETE CASCADE,
  channel         TEXT        NOT NULL DEFAULT 'whatsapp',  -- 'whatsapp' | 'instagram'
  status          TEXT        NOT NULL DEFAULT 'open',       -- 'open' | 'archived' | 'resolved'
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_lead_id_idx ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON public.conversations(last_message_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view conversations" ON public.conversations;
CREATE POLICY "Staff can view conversations" ON public.conversations
  FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can insert conversations" ON public.conversations;
CREATE POLICY "Staff can insert conversations" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can update conversations" ON public.conversations;
CREATE POLICY "Staff can update conversations" ON public.conversations
  FOR UPDATE TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Service role can manage conversations" ON public.conversations;
CREATE POLICY "Service role can manage conversations" ON public.conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- messages
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id  UUID        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  text             TEXT        NOT NULL,
  from_me          BOOLEAN     NOT NULL DEFAULT false,
  status           TEXT        NOT NULL DEFAULT 'sent',  -- 'sent' | 'delivered' | 'read' | 'failed'
  media_url        TEXT,
  media_type       TEXT,       -- 'image' | 'audio' | 'document'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at ASC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view messages" ON public.messages;
CREATE POLICY "Staff can view messages" ON public.messages
  FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can insert messages" ON public.messages;
CREATE POLICY "Staff can insert messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Service role can manage messages" ON public.messages;
CREATE POLICY "Service role can manage messages" ON public.messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- whatsapp_instances
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_name  TEXT        NOT NULL UNIQUE,
  api_url        TEXT        NOT NULL DEFAULT 'https://api.evolution-api.com',
  api_key        TEXT,
  status         TEXT        NOT NULL DEFAULT 'disconnected',  -- 'connected' | 'disconnected' | 'connecting'
  phone_number   TEXT,
  qr_code        TEXT,        -- base64 QR Code for connection
  webhook_url    TEXT,        -- URL for incoming message webhooks
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage whatsapp instances" ON public.whatsapp_instances;
CREATE POLICY "Admin can manage whatsapp instances" ON public.whatsapp_instances
  FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Staff can view whatsapp instances" ON public.whatsapp_instances;
CREATE POLICY "Staff can view whatsapp instances" ON public.whatsapp_instances
  FOR SELECT TO authenticated USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Service role can manage whatsapp instances" ON public.whatsapp_instances;
CREATE POLICY "Service role can manage whatsapp instances" ON public.whatsapp_instances
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- Realtime subscriptions
-- ──────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
