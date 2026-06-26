-- Security hardening: corrige grants e policies identificados em auditoria

-- 1. Funções de uso IA: só service_role pode chamar (chamadas da API Node.js / edge fn)
REVOKE ALL ON FUNCTION record_workspace_ai_usage(UUID, UUID, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_workspace_ai_usage(UUID, UUID, BIGINT) TO service_role;

REVOKE ALL ON FUNCTION update_workspace_storage_bytes(UUID, UUID, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION update_workspace_storage_bytes(UUID, UUID, BIGINT) TO service_role;

-- 2. register_clinic_auth_user: só authenticated; mas com validação interna de role=admin
REVOKE ALL ON FUNCTION register_clinic_auth_user(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION register_clinic_auth_user(TEXT) TO authenticated;

-- Reescreve a função com validação: só admin da clínica pode registrar o auth user
CREATE OR REPLACE FUNCTION register_clinic_auth_user(p_subdomain TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT c.id INTO v_clinic_id
    FROM clinics c
   WHERE c.subdomain = p_subdomain
   LIMIT 1;

  IF v_clinic_id IS NULL THEN RETURN; END IF;

  -- Só admin desta clínica pode vincular o auth user
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
     WHERE user_id = auth.uid()
       AND clinica_id = v_clinic_id
       AND role = 'admin'
  ) THEN RETURN; END IF;

  UPDATE workspace_clinics
     SET clinic_auth_user_id = auth.uid()
   WHERE subdomain = p_subdomain
     AND (clinic_auth_user_id IS NULL OR clinic_auth_user_id = auth.uid());
END;
$$;

-- 3. workspace_usage: SA (service_role) lê tudo via bypass; JWT normal só vê seu workspace
DROP POLICY IF EXISTS "SA reads all usage" ON workspace_usage;
CREATE POLICY "Owner reads own usage"
  ON workspace_usage FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspace_customers WHERE owner_id = auth.uid()
    )
  );
-- service_role bypassa RLS automaticamente no Supabase (sem necessidade de policy extra)
