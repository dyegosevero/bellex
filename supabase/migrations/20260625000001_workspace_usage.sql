-- Tabela de uso mensal por workspace (para o SuperAdmin visualizar)
CREATE TABLE IF NOT EXISTS workspace_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspace_customers(id) ON DELETE CASCADE,
  clinic_id     UUID,                          -- NULL = totais do workspace
  month         DATE NOT NULL,                 -- primeiro dia do mês: 2026-06-01
  conversations INT NOT NULL DEFAULT 0,        -- atendimentos IA naquele mês
  tokens_used   BIGINT NOT NULL DEFAULT 0,     -- tokens OpenAI consumidos
  storage_bytes BIGINT NOT NULL DEFAULT 0,     -- bytes em storage (snapshot)
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, clinic_id, month)
);

-- RLS: superadmin lê tudo; workspace owner lê só o seu
ALTER TABLE workspace_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SA reads all usage"
  ON workspace_usage FOR SELECT
  USING (true);  -- protegido na camada de serviço (service_role)

CREATE POLICY "Owners can upsert own usage"
  ON workspace_usage FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM workspace_customers WHERE owner_id = auth.uid()
    )
  );

-- Função para incrementar conversas (chamada pelo Clinic app quando uma conversa é criada)
CREATE OR REPLACE FUNCTION increment_workspace_conversations(
  p_workspace_id UUID,
  p_clinic_id    UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month DATE := date_trunc('month', NOW())::DATE;
BEGIN
  INSERT INTO workspace_usage(workspace_id, clinic_id, month, conversations)
  VALUES (p_workspace_id, p_clinic_id, v_month, 1)
  ON CONFLICT (workspace_id, clinic_id, month)
  DO UPDATE SET
    conversations = workspace_usage.conversations + 1,
    updated_at    = NOW();
END;
$$;

-- Função para atualizar storage snapshot
CREATE OR REPLACE FUNCTION update_workspace_storage(
  p_workspace_id UUID,
  p_bytes        BIGINT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month DATE := date_trunc('month', NOW())::DATE;
BEGIN
  INSERT INTO workspace_usage(workspace_id, clinic_id, month, storage_bytes)
  VALUES (p_workspace_id, NULL, v_month, p_bytes)
  ON CONFLICT (workspace_id, clinic_id, month)
  DO UPDATE SET
    storage_bytes = p_bytes,
    updated_at    = NOW();
END;
$$;

-- View agregada para o SA Dashboard
CREATE OR REPLACE VIEW workspace_usage_summary AS
SELECT
  wc.id              AS workspace_id,
  wc.client_name,
  wc.plan,
  wc.status,
  wc.owner_id,
  COALESCE(SUM(wu.conversations), 0)::INT   AS conversations_month,
  COALESCE(SUM(wu.tokens_used),   0)::BIGINT AS tokens_month,
  COALESCE(MAX(wu.storage_bytes), 0)::BIGINT AS storage_bytes
FROM workspace_customers wc
LEFT JOIN workspace_usage wu
  ON wu.workspace_id = wc.id
  AND wu.month = date_trunc('month', NOW())::DATE
GROUP BY wc.id, wc.client_name, wc.plan, wc.status, wc.owner_id;

GRANT SELECT ON workspace_usage_summary TO anon, authenticated;
GRANT ALL    ON workspace_usage TO authenticated;
GRANT EXECUTE ON FUNCTION increment_workspace_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION update_workspace_storage TO authenticated;
