UPDATE public.review_requests
SET delivery_status = 'failed',
    reserved_until = NULL,
    last_error = COALESCE(last_error, 'lock reset by anti-duplicate migration')
WHERE delivery_status = 'reserved'
  AND (reserved_until IS NULL OR reserved_until < now());