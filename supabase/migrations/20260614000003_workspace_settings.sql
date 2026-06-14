-- Workspace integrations settings (Resend, WhatsApp, etc.)

CREATE TABLE IF NOT EXISTS public.workspace_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  resend_key text,
  resend_from text NOT NULL DEFAULT 'noreply@bellex.app',
  wp_token   text,
  wp_phone_id text,
  brand_color text NOT NULL DEFAULT '#e8957a',
  workspace_name text NOT NULL DEFAULT 'Meu Workspace',
  agent_enabled boolean NOT NULL DEFAULT false,
  agent_name text NOT NULL DEFAULT 'Assistente',
  agent_prompt text,
  notify_email boolean NOT NULL DEFAULT true,
  notify_whatsapp boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all_settings" ON public.workspace_settings
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'workspace_settings_updated_at') THEN
    CREATE TRIGGER workspace_settings_updated_at
      BEFORE UPDATE ON public.workspace_settings
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;
