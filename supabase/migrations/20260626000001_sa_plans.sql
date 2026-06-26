-- Tabela de planos que a Bellex vende para operadores de Workspace (Modelo 2)
-- Separada de workspace_plans (que é para planos das clínicas dentro de cada workspace)
CREATE TABLE IF NOT EXISTS sa_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_monthly INTEGER NOT NULL,
  seats INTEGER NOT NULL,
  storage_gb INTEGER NOT NULL,
  ai_conversations_month INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#60a5fa',
  features TEXT[] NOT NULL DEFAULT '{}',
  popular BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sa_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_plans_read" ON sa_plans FOR SELECT TO authenticated USING (true);

-- Seed: Modelo 2 (Workspace White-Label)
INSERT INTO sa_plans (name, slug, price_monthly, seats, storage_gb, ai_conversations_month, color, features, popular, sort_order)
VALUES
  ('WS Starter', 'starter', 750,  5,  25,  1000, '#60a5fa', ARRAY['Até 5 clínicas ativas','Suporte por e-mail','Branding personalizado','Agente IA por clínica'], false, 1),
  ('WS Pro',     'pro',    1000, 10,  50,  2500, '#a78bfa', ARRAY['Até 10 clínicas ativas','Suporte prioritário','Branding personalizado','Agente IA por clínica','Relatórios avançados'], true, 2),
  ('WS Scale',   'scale',  1500, 20, 100, 5000, '#e8957a', ARRAY['Até 20 clínicas ativas','Suporte dedicado','White-label total','Agente IA por clínica','SLA garantido'], false, 3)
ON CONFLICT (slug) DO NOTHING;

-- workspace_plans permanece intacta: são os planos que cada workspace vende para suas clínicas
