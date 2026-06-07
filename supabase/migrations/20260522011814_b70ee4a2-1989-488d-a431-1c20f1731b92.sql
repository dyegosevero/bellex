-- 1. Marker on appointment_products
ALTER TABLE public.appointment_products
  ADD COLUMN IF NOT EXISTS stock_deducted_at timestamptz;

-- 2. Setting on clinic_settings (default: do NOT allow negative stock)
ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS allow_negative_stock boolean NOT NULL DEFAULT false;

-- 3. Idempotent stock deduction with negative-stock guard
CREATE OR REPLACE FUNCTION public.deduct_appointment_stock(p_appointment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  item RECORD;
  v_allow_negative boolean;
  v_current integer;
  v_product_name text;
BEGIN
  SELECT COALESCE(allow_negative_stock, false) INTO v_allow_negative
  FROM clinic_settings LIMIT 1;

  FOR item IN
    SELECT ap.id, ap.product_id, ap.quantity, p.name, p.stock_quantity
    FROM appointment_products ap
    JOIN products p ON p.id = ap.product_id
    WHERE ap.appointment_id = p_appointment_id
      AND ap.stock_deducted_at IS NULL
    FOR UPDATE OF ap
  LOOP
    IF NOT v_allow_negative AND item.stock_quantity < item.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para "%": disponível %, necessário %',
        item.name, item.stock_quantity, item.quantity
        USING ERRCODE = 'check_violation';
    END IF;

    UPDATE products
      SET stock_quantity = CASE
        WHEN v_allow_negative THEN stock_quantity - item.quantity
        ELSE GREATEST(0, stock_quantity - item.quantity)
      END,
      updated_at = now()
    WHERE id = item.product_id;

    UPDATE appointment_products
      SET stock_deducted_at = now()
    WHERE id = item.id;
  END LOOP;
END;
$function$;

-- 4. Auto-restore stock when a deducted appointment_product is removed
CREATE OR REPLACE FUNCTION public.restore_stock_on_appointment_product_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.stock_deducted_at IS NOT NULL AND OLD.product_id IS NOT NULL THEN
    UPDATE products
      SET stock_quantity = stock_quantity + OLD.quantity,
          updated_at = now()
    WHERE id = OLD.product_id;
  END IF;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trg_restore_stock_on_ap_delete ON public.appointment_products;
CREATE TRIGGER trg_restore_stock_on_ap_delete
BEFORE DELETE ON public.appointment_products
FOR EACH ROW
EXECUTE FUNCTION public.restore_stock_on_appointment_product_delete();