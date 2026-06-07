CREATE OR REPLACE FUNCTION public.get_appointment_by_cancel_token(p_token uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE result json;
BEGIN
  SELECT json_build_object(
    'id', a.id,
    'start_time', a.start_time,
    'status', a.status,
    'cancellation_token', a.cancellation_token,
    'client_name', c.full_name,
    'client_phone', c.phone,
    'client_email', c.email,
    'service_name', s.name,
    'specialist_name', p.full_name,
    'specialist_id', a.specialist_id
  ) INTO result
  FROM appointments a
  LEFT JOIN clients c ON c.id = a.client_id
  LEFT JOIN services s ON s.id = a.service_id
  LEFT JOIN profiles p ON p.user_id = a.specialist_id
  WHERE a.cancellation_token = p_token;
  RETURN result;
END;
$function$;