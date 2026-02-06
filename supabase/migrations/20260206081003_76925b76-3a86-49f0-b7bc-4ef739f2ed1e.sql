-- Allow clients to update legal entity fields on their assigned hotel
CREATE POLICY "Clients can update legal entity fields on their hotel"
ON public.hotels
FOR UPDATE
USING (
  id IN (
    SELECT hotel_id 
    FROM public.client_hotels 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT hotel_id 
    FROM public.client_hotels 
    WHERE user_id = auth.uid()
  )
);