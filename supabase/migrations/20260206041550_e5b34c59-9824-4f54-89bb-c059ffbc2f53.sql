-- Create venues table for the Venue Manager
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  menu_pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on venues
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Clients can view their hotel's venues
CREATE POLICY "Clients can view their hotel venues"
ON public.venues
FOR SELECT
USING (
  hotel_id IN (
    SELECT hotel_id FROM client_hotels WHERE user_id = auth.uid()
  )
  OR has_dashboard_access(auth.uid())
);

-- Clients can insert venues for their hotel
CREATE POLICY "Clients can create venues for their hotel"
ON public.venues
FOR INSERT
WITH CHECK (
  hotel_id IN (
    SELECT hotel_id FROM client_hotels WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'ops_manager')
);

-- Clients can update their hotel's venues
CREATE POLICY "Clients can update their hotel venues"
ON public.venues
FOR UPDATE
USING (
  hotel_id IN (
    SELECT hotel_id FROM client_hotels WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'ops_manager')
);

-- Clients can delete their hotel's venues
CREATE POLICY "Clients can delete their hotel venues"
ON public.venues
FOR DELETE
USING (
  hotel_id IN (
    SELECT hotel_id FROM client_hotels WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'ops_manager')
);

-- Add brand_palette to hotels table
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS brand_palette JSONB DEFAULT '[]'::jsonb;

-- Add trigger for updated_at on venues
CREATE TRIGGER update_venues_updated_at
BEFORE UPDATE ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();