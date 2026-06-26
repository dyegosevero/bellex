-- Configurações globais do SA (persiste no banco, não no localStorage)
CREATE TABLE IF NOT EXISTS sa_configuration (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sa_configuration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read" ON sa_configuration
  FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION upsert_sa_config(p_key TEXT, p_value TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO sa_configuration (key, value, updated_at)
  VALUES (p_key, p_value, now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION upsert_sa_config(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION upsert_sa_config(TEXT, TEXT) TO authenticated;

INSERT INTO sa_configuration (key, value) VALUES
  ('alert_email', ''),
  ('storage_alert_pct', '80'),
  ('ia_alert_pct', '90')
ON CONFLICT (key) DO NOTHING;
