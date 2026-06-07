CREATE OR REPLACE FUNCTION public.pending_billings(p_specialist_id uuid DEFAULT NULL)
RETURNS TABLE(
  appointment_id uuid,
  client_id uuid,
  client_name text,
  specialist_id uuid,
  specialist_name text,
  service_name text,
  start_time timestamptz,
  end_time timestamptz,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    a.id AS appointment_id,
    a.client_id,
    c.full_name AS client_name,
    a.specialist_id,
    p.full_name AS specialist_name,
    s.name AS service_name,
    a.start_time,
    COALESCE(a.end_time, a.start_time + interval '30 minutes') AS end_time,
    a.status
  FROM appointments a
  LEFT JOIN clients c  ON c.id = a.client_id
  LEFT JOIN services s ON s.id = a.service_id
  LEFT JOIN profiles p ON p.user_id = a.specialist_id
  WHERE a.status IN ('realizado','em_atendimento')
    AND COALESCE(a.end_time, a.start_time + interval '30 minutes') < now()
    AND NOT EXISTS (
      SELECT 1 FROM charges ch WHERE ch.appointment_id = a.id
    )
    AND (p_specialist_id IS NULL OR a.specialist_id = p_specialist_id)
  ORDER BY a.end_time ASC;
$function$;