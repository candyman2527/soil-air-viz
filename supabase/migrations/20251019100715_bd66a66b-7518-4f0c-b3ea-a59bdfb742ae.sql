-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  true,
  10485760, -- 10MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a']
);

-- RLS Policies for audio-files bucket
CREATE POLICY "Authenticated users can view audio files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'audio-files');

CREATE POLICY "Admins can upload audio files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-files' AND (
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
));

CREATE POLICY "Admins can update audio files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'audio-files' AND (
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
));

CREATE POLICY "Admins can delete audio files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'audio-files' AND (
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
));