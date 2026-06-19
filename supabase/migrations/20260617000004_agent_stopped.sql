ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS agent_stopped boolean NOT NULL DEFAULT false;
