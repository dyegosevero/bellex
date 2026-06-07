-- Allow staff (admin, especialista, atendimento) to manage calendar blocks
DROP POLICY IF EXISTS "Staff manage calendar_blocks" ON public.calendar_blocks;
CREATE POLICY "Staff manage calendar_blocks"
ON public.calendar_blocks
FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));