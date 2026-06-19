-- Chave OpenAI por workspace e por clínica (override)
ALTER TABLE public.workspace_settings
  ADD COLUMN IF NOT EXISTS openai_api_key text;

ALTER TABLE public.workspace_clinics
  ADD COLUMN IF NOT EXISTS openai_api_key text; -- null = herda do workspace
