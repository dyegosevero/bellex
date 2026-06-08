-- Add consent_text_id to services (single document per service for now, extensible later)
-- Also add description to consent_texts for richer metadata

ALTER TABLE consent_texts
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Junction table: one service can have many documents, one document can be used by many services
CREATE TABLE IF NOT EXISTS service_consent_texts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  consent_text_id uuid NOT NULL REFERENCES consent_texts(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, consent_text_id)
);

ALTER TABLE service_consent_texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage service_consent_texts"
  ON service_consent_texts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
