INSERT INTO public.business_hours (weekday, start_time, end_time, active)
SELECT wd, '09:00'::time, '18:00'::time, false
FROM generate_series(0, 6) wd
WHERE NOT EXISTS (SELECT 1 FROM public.business_hours WHERE weekday = wd);