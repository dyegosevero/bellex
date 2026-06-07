
ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS reserved_until timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Backfill existing rows
UPDATE public.review_requests
SET delivery_status = CASE
  WHEN confirmed_at IS NOT NULL THEN 'confirmed'
  WHEN send_count > 0 THEN 'delivered'
  ELSE 'queued'
END,
delivered_at = CASE WHEN send_count > 0 AND delivered_at IS NULL THEN last_sent_at ELSE delivered_at END;

-- Trigger to sync delivery_status when confirmed_at is set
CREATE OR REPLACE FUNCTION public.sync_review_delivery_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.confirmed_at IS NOT NULL AND (OLD.confirmed_at IS NULL OR OLD.confirmed_at IS DISTINCT FROM NEW.confirmed_at) THEN
    NEW.delivery_status := 'confirmed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_review_delivery_status ON public.review_requests;
CREATE TRIGGER trg_sync_review_delivery_status
BEFORE UPDATE ON public.review_requests
FOR EACH ROW
EXECUTE FUNCTION public.sync_review_delivery_status();

CREATE INDEX IF NOT EXISTS idx_review_requests_delivery_status
  ON public.review_requests (delivery_status, next_send_at);
