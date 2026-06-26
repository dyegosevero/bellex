-- Renomeia tabelas para nomenclatura correta:
-- clinic_plans  = planos que clínicas assinam dentro de um workspace
-- workspace_plans = planos que a Bellex SA vende para operadores de workspace

ALTER TABLE workspace_plans RENAME TO clinic_plans;
ALTER TABLE sa_plans RENAME TO workspace_plans;

-- Adiciona customer_id em clinic_plans para suportar planos custom por workspace
-- customer_id IS NULL = plano padrão Bellex (visível para todos os workspaces)
-- customer_id = <id> = plano exclusivo daquele workspace
ALTER TABLE clinic_plans
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES workspace_customers(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS clinic_plans_customer_id_idx ON clinic_plans(customer_id);

-- RLS
DROP POLICY IF EXISTS "sa_plans_read" ON workspace_plans;
CREATE POLICY "workspace_plans_read" ON workspace_plans FOR SELECT TO authenticated USING (true);
