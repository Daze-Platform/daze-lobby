-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Admins and Ops Managers can create specifications" 
  ON public.specifications;

-- Create new policy allowing public INSERT access
CREATE POLICY "Allow public insert for specifications"
  ON public.specifications FOR INSERT
  WITH CHECK (true);