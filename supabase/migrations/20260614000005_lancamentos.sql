-- FIN-01 / FIN-02: tabela de lançamentos financeiros manuais
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor NUMERIC NOT NULL CHECK (valor >= 0),
  descricao TEXT NOT NULL,
  categoria TEXT,
  forma_pagamento TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  recorrencia TEXT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  charge_id UUID REFERENCES public.charges(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lancamentos_own" ON public.lancamentos
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE INDEX IF NOT EXISTS lancamentos_created_by_data_idx ON public.lancamentos (created_by, data DESC);
CREATE INDEX IF NOT EXISTS lancamentos_tipo_idx ON public.lancamentos (tipo);
