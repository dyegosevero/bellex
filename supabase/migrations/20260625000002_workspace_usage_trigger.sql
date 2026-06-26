-- Fase 2: linkar clinic auth user ao workspace e contar conversas via trigger

-- 1. Adiciona coluna na workspace_clinics para guardar o auth.uid() da clínica
ALTER TABLE workspace_clinics
  ADD COLUMN IF NOT EXISTS clinic_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_clinics_auth_user
  ON workspace_clinics(clinic_auth_user_id);

-- 2. Trigger em conversations: ao criar, incrementa o workspace_usage
CREATE OR REPLACE FUNCTION trg_conversation_increment_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workspace_id UUID;
  v_clinic_id    UUID;
  v_month        DATE := date_trunc('month', NOW())::DATE;
BEGIN
  -- Busca workspace e clinic pelo auth user que criou a conversa
  SELECT customer_id, id
    INTO v_workspace_id, v_clinic_id
    FROM workspace_clinics
   WHERE clinic_auth_user_id = auth.uid()
   LIMIT 1;

  -- Só registra se a clínica está mapeada a um workspace
  IF v_workspace_id IS NOT NULL THEN
    INSERT INTO workspace_usage(workspace_id, clinic_id, month, conversations)
    VALUES (v_workspace_id, v_clinic_id, v_month, 1)
    ON CONFLICT (workspace_id, clinic_id, month)
    DO UPDATE SET
      conversations = workspace_usage.conversations + 1,
      updated_at    = NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_conversation_usage ON conversations;

CREATE TRIGGER trg_conversation_usage
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION trg_conversation_increment_usage();

-- 3. Função para o Clinic app registrar seu auth.uid() ao fazer login
-- (chamada client-side via rpc quando isClinicSubdomain)
CREATE OR REPLACE FUNCTION register_clinic_auth_user(p_subdomain TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE workspace_clinics
     SET clinic_auth_user_id = auth.uid()
   WHERE subdomain = p_subdomain
     AND (clinic_auth_user_id IS NULL OR clinic_auth_user_id = auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION register_clinic_auth_user TO authenticated;
