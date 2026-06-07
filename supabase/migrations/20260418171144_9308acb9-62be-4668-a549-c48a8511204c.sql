-- Add per-channel transactional notification preferences (booking confirmations, reminders, cancellations)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS notify_whatsapp boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_sms boolean NOT NULL DEFAULT true;

-- Update upsert_booking_client RPC to accept per-channel notification preferences
CREATE OR REPLACE FUNCTION public.upsert_booking_client(
  p_full_name text,
  p_phone text,
  p_email text,
  p_opt_in boolean DEFAULT false,
  p_birth_date date DEFAULT NULL,
  p_citizen_card_number text DEFAULT NULL,
  p_notify_whatsapp boolean DEFAULT true,
  p_notify_email boolean DEFAULT true,
  p_notify_sms boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  IF p_full_name IS NULL OR p_full_name = '' THEN RAISE EXCEPTION 'full_name is required'; END IF;
  IF p_phone IS NULL OR p_phone = '' THEN RAISE EXCEPTION 'phone is required'; END IF;
  IF p_email IS NULL OR p_email = '' THEN RAISE EXCEPTION 'email is required'; END IF;

  SELECT id INTO v_id FROM clients WHERE email = p_email LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE clients SET
      opt_in = CASE WHEN p_opt_in THEN true ELSE opt_in END,
      notify_whatsapp = COALESCE(p_notify_whatsapp, notify_whatsapp),
      notify_email = COALESCE(p_notify_email, notify_email),
      notify_sms = COALESCE(p_notify_sms, notify_sms),
      updated_at = now()
    WHERE id = v_id;
    RETURN v_id;
  END IF;

  INSERT INTO clients (
    full_name, phone, email, opt_in, birth_date, citizen_card_number,
    notify_whatsapp, notify_email, notify_sms
  ) VALUES (
    p_full_name, p_phone, p_email, COALESCE(p_opt_in, false), p_birth_date, p_citizen_card_number,
    COALESCE(p_notify_whatsapp, true), COALESCE(p_notify_email, true), COALESCE(p_notify_sms, true)
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;