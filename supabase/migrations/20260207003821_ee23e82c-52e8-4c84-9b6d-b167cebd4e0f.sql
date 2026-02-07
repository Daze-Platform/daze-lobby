-- Create documents table for hotel document uploads
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  category TEXT DEFAULT 'Other',
  uploaded_by_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Dashboard users (admin, ops_manager, support) can view all documents
CREATE POLICY "Dashboard users can view documents"
ON public.documents
FOR SELECT
USING (has_dashboard_access(auth.uid()));

-- Clients can view documents for their hotel
CREATE POLICY "Clients can view their hotel documents"
ON public.documents
FOR SELECT
USING (hotel_id IN (
  SELECT hotel_id FROM client_hotels WHERE user_id = auth.uid()
));

-- Dashboard users can insert documents
CREATE POLICY "Dashboard users can insert documents"
ON public.documents
FOR INSERT
WITH CHECK (has_dashboard_access(auth.uid()));

-- Clients can insert documents for their hotel
CREATE POLICY "Clients can insert their hotel documents"
ON public.documents
FOR INSERT
WITH CHECK (hotel_id IN (
  SELECT hotel_id FROM client_hotels WHERE user_id = auth.uid()
));

-- Dashboard users can delete documents
CREATE POLICY "Dashboard users can delete documents"
ON public.documents
FOR DELETE
USING (has_dashboard_access(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for hotel documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('hotel-documents', 'hotel-documents', false);

-- Storage policies for hotel-documents bucket
CREATE POLICY "Dashboard users can view hotel documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'hotel-documents' 
  AND has_dashboard_access(auth.uid())
);

CREATE POLICY "Dashboard users can upload hotel documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'hotel-documents'
  AND has_dashboard_access(auth.uid())
);

CREATE POLICY "Clients can view their hotel documents in storage"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'hotel-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT hotel_id::text FROM client_hotels WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Clients can upload their hotel documents to storage"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'hotel-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT hotel_id::text FROM client_hotels WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Dashboard users can delete hotel documents from storage"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'hotel-documents'
  AND has_dashboard_access(auth.uid())
);