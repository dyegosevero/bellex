-- Chave OpenAI e configurações por tenant
-- Inserir via integration_settings com setting_key = 'openai_api_key'

-- Garante unicidade por setting_key para upserts funcionarem
CREATE UNIQUE INDEX IF NOT EXISTS integration_settings_key_unique
  ON public.integration_settings(setting_key);

-- Seed das chaves necessárias para o agente
INSERT INTO public.integration_settings (setting_key, setting_value)
VALUES
  ('openai_api_key', ''),
  ('agent_memory_limit', '20'),
  ('agent_response_delay_ms', '1200')
ON CONFLICT (setting_key) DO NOTHING;
