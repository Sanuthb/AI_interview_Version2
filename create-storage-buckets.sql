-- Create storage buckets for Placement AI
-- Run this in Supabase SQL Editor

-- Create resumes bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,
  5242880, -- 5MB in bytes
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create job-descriptions bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-descriptions',
  'job-descriptions',
  true,
  10485760, -- 10MB in bytes
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Create policies for resumes bucket
CREATE POLICY IF NOT EXISTS "Allow public uploads to resumes"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY IF NOT EXISTS "Allow public reads from resumes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');

CREATE POLICY IF NOT EXISTS "Allow public deletes from resumes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'resumes');

-- Create policies for job-descriptions bucket
CREATE POLICY IF NOT EXISTS "Allow public uploads to job-descriptions"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'job-descriptions');

CREATE POLICY IF NOT EXISTS "Allow public reads from job-descriptions"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-descriptions');

CREATE POLICY IF NOT EXISTS "Allow public deletes from job-descriptions"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'job-descriptions');

