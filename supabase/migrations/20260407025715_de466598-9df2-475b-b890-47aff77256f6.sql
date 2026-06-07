-- Ensure all columns added after initial table creation exist on external databases
-- (CREATE TABLE IF NOT EXISTS skips the entire statement if the table already exists)

ALTER TABLE public.reminder_history
ADD COLUMN IF NOT EXISTS channels_payload jsonb DEFAULT NULL;