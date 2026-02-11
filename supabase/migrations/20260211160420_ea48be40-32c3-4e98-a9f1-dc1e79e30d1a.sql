-- Add soft-delete support to clients table
ALTER TABLE public.clients
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update existing RLS policies to exclude soft-deleted clients from normal views
-- (Dashboard users can view hotels policy already exists, we add a filter via the app layer)

-- Create an index for efficient filtering
CREATE INDEX idx_clients_deleted_at ON public.clients (deleted_at);
