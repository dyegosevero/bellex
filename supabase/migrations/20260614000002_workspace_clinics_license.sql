-- Link clinics to licenses + auto seat accounting

ALTER TABLE public.workspace_clinics
  ADD COLUMN IF NOT EXISTS license_id uuid REFERENCES public.workspace_licenses(id) ON DELETE SET NULL;

-- Function: increment seats_used when clinic is created with a license
CREATE OR REPLACE FUNCTION public.clinic_seat_increment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.license_id IS NOT NULL THEN
    UPDATE public.workspace_licenses
      SET seats_used = seats_used + 1
      WHERE id = NEW.license_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Function: adjust seats_used when clinic license changes or is deleted
CREATE OR REPLACE FUNCTION public.clinic_seat_decrement()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- On delete: release seat from old license
  IF TG_OP = 'DELETE' THEN
    IF OLD.license_id IS NOT NULL THEN
      UPDATE public.workspace_licenses
        SET seats_used = GREATEST(seats_used - 1, 0)
        WHERE id = OLD.license_id;
    END IF;
    RETURN OLD;
  END IF;
  -- On update: handle license change
  IF TG_OP = 'UPDATE' AND OLD.license_id IS DISTINCT FROM NEW.license_id THEN
    IF OLD.license_id IS NOT NULL THEN
      UPDATE public.workspace_licenses
        SET seats_used = GREATEST(seats_used - 1, 0)
        WHERE id = OLD.license_id;
    END IF;
    IF NEW.license_id IS NOT NULL THEN
      UPDATE public.workspace_licenses
        SET seats_used = seats_used + 1
        WHERE id = NEW.license_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'clinic_seat_on_insert') THEN
    CREATE TRIGGER clinic_seat_on_insert
      AFTER INSERT ON public.workspace_clinics
      FOR EACH ROW EXECUTE FUNCTION public.clinic_seat_increment();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'clinic_seat_on_change') THEN
    CREATE TRIGGER clinic_seat_on_change
      AFTER UPDATE OR DELETE ON public.workspace_clinics
      FOR EACH ROW EXECUTE FUNCTION public.clinic_seat_decrement();
  END IF;
END $$;
