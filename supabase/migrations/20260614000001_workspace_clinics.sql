-- Workspace clinics & licenses
-- Each Workspace org manages multiple clinics (seats).

CREATE TABLE IF NOT EXISTS public.workspace_clinics (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  client_name  text NOT NULL,
  subdomain    text NOT NULL,
  custom_domain text,
  color        text NOT NULL DEFAULT '#e8957a',
  plan         text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','pro','scale')),
  status       text NOT NULL DEFAULT 'trial' CHECK (status IN ('ativo','trial','inadimplente','suspenso','cancelado')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS workspace_clinics_subdomain_idx ON public.workspace_clinics(subdomain);

CREATE TABLE IF NOT EXISTS public.workspace_licenses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name  text NOT NULL,
  plan         text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','pro','scale')),
  seats_total  int NOT NULL DEFAULT 1,
  seats_used   int NOT NULL DEFAULT 0,
  license_key  text NOT NULL UNIQUE DEFAULT 'LIC-' || upper(substr(gen_random_uuid()::text,1,8)),
  valid_until  date,
  status       text NOT NULL DEFAULT 'trial' CHECK (status IN ('ativo','trial','expirando','suspenso','cancelado')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Auto updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'workspace_clinics_updated_at') THEN
    CREATE TRIGGER workspace_clinics_updated_at
      BEFORE UPDATE ON public.workspace_clinics
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'workspace_licenses_updated_at') THEN
    CREATE TRIGGER workspace_licenses_updated_at
      BEFORE UPDATE ON public.workspace_licenses
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE public.workspace_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all_clinics" ON public.workspace_clinics
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owner_all_licenses" ON public.workspace_licenses
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
