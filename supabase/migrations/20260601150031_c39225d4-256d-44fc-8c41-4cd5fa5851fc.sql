-- Add consent policy to services and new consent text type
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS consent_policy text NOT NULL DEFAULT 'none'
    CHECK (consent_policy IN ('none','once','always'));

-- Backfill: services that previously required consent default to 'once' (Estética Avançada behavior)
UPDATE public.services
   SET consent_policy = 'once'
 WHERE requires_consent_form = true
   AND consent_policy = 'none';

-- Seed new consent text option (only service, no images)
INSERT INTO public.consent_texts (slug, label, content)
SELECT 'treatment_only',
       'Tratamento (sem autorização de imagem)',
       'Eu, {nome}, portador(a) do Cartão de Cidadão nº {cartao_cidadao}, autorizo a realização do serviço "{servico}" pela profissional {especialista}, na data {data}, declarando estar informado(a) dos cuidados, riscos e contraindicações associados ao procedimento.'
WHERE NOT EXISTS (SELECT 1 FROM public.consent_texts WHERE slug = 'treatment_only');