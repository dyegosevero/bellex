ALTER TABLE public.charges
  ADD COLUMN IF NOT EXISTS payment_method text;
