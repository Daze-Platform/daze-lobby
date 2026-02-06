-- Fix the overly permissive INSERT policy on specifications table
DROP POLICY IF EXISTS "Allow public insert for specifications" ON public.specifications;

-- Replace with authenticated-only insert
CREATE POLICY "Authenticated users can insert specifications"
ON public.specifications
FOR INSERT
TO authenticated
WITH CHECK (has_dashboard_access(auth.uid()));