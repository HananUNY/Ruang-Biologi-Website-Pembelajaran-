ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS syllabus_url text,
ADD COLUMN IF NOT EXISTS syllabus_name text DEFAULT 'Dokumen Silabus';
