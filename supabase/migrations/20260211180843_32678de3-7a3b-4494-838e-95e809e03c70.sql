
-- Create venue_menus table for multiple menus per venue
CREATE TABLE public.venue_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.venue_menus ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view menus for venues they can access (through client association)
CREATE POLICY "Users can view venue menus for their client"
ON public.venue_menus
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.venues v
    JOIN public.user_clients uc ON uc.client_id = v.client_id
    WHERE v.id = venue_menus.venue_id AND uc.user_id = auth.uid()
  )
  OR public.has_dashboard_access(auth.uid())
);

-- RLS: Users can insert menus for venues belonging to their client
CREATE POLICY "Users can insert venue menus for their client"
ON public.venue_menus
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.venues v
    JOIN public.user_clients uc ON uc.client_id = v.client_id
    WHERE v.id = venue_menus.venue_id AND uc.user_id = auth.uid()
  )
  OR public.has_dashboard_access(auth.uid())
);

-- RLS: Users can delete menus for venues belonging to their client
CREATE POLICY "Users can delete venue menus for their client"
ON public.venue_menus
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.venues v
    JOIN public.user_clients uc ON uc.client_id = v.client_id
    WHERE v.id = venue_menus.venue_id AND uc.user_id = auth.uid()
  )
  OR public.has_dashboard_access(auth.uid())
);

-- Migrate existing menu data from venues.menu_pdf_url to venue_menus
INSERT INTO public.venue_menus (venue_id, file_url, file_name, label)
SELECT id, menu_pdf_url, 'Menu', 'Menu'
FROM public.venues
WHERE menu_pdf_url IS NOT NULL;
