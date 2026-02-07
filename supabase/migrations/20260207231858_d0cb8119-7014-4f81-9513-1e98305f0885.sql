-- Update contracts bucket to allow both PDF and PNG (for signatures)
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['application/pdf', 'image/png']::text[]
WHERE id = 'contracts';