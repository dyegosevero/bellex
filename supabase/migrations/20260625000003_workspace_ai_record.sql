-- Função para registrar uso de IA pelo API Node.js (via service_role, sem auth.uid())
-- Diferente do trigger (que usa auth.uid()), esta função recebe explicitamente os IDs
CREATE OR REPLACE FUNCTION record_workspace_ai_usage(
  p_workspace_id UUID,
  p_clinic_id    UUID,
  p_tokens       BIGINT DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month DATE := date_trunc('month', NOW())::DATE;
BEGIN
  INSERT INTO workspace_usage(workspace_id, clinic_id, month, conversations, tokens_used)
  VALUES (p_workspace_id, p_clinic_id, v_month, 1, p_tokens)
  ON CONFLICT (workspace_id, clinic_id, month)
  DO UPDATE SET
    conversations = workspace_usage.conversations + 1,
    tokens_used   = workspace_usage.tokens_used + p_tokens,
    updated_at    = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION record_workspace_ai_usage TO service_role, authenticated;

-- Função para snapshot de storage (chamada pela edge function daily)
CREATE OR REPLACE FUNCTION update_workspace_storage_bytes(
  p_workspace_id UUID,
  p_clinic_id    UUID,
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
  VALUES (p_workspace_id, p_clinic_id, v_month, p_bytes)
  ON CONFLICT (workspace_id, clinic_id, month)
  DO UPDATE SET
    storage_bytes = p_bytes,
    updated_at    = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION update_workspace_storage_bytes TO service_role;
