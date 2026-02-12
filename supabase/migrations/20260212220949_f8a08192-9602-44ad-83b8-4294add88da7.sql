
CREATE TABLE public.document_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  completeness_score INTEGER NOT NULL DEFAULT 0,
  missing_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dashboard users can view document analyses"
ON public.document_analyses FOR SELECT
USING (public.has_dashboard_access(auth.uid()));

CREATE POLICY "Dashboard users can insert document analyses"
ON public.document_analyses FOR INSERT
WITH CHECK (public.has_dashboard_access(auth.uid()));

CREATE POLICY "Dashboard users can update document analyses"
ON public.document_analyses FOR UPDATE
USING (public.has_dashboard_access(auth.uid()));

CREATE POLICY "Dashboard users can delete document analyses"
ON public.document_analyses FOR DELETE
USING (public.has_dashboard_access(auth.uid()));

CREATE INDEX idx_document_analyses_document_id ON public.document_analyses(document_id);
CREATE INDEX idx_document_analyses_client_id ON public.document_analyses(client_id);
