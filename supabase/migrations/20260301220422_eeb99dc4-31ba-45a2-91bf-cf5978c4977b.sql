
-- Table for month-level resources (PDFs, images, videos, audios, links)
CREATE TABLE public.month_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_id UUID NOT NULL REFERENCES public.months(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'image', 'video', 'audio', 'file', 'link'
  title TEXT,
  description TEXT,
  url TEXT NOT NULL,
  file_path TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.month_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage month_resources"
  ON public.month_resources FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read month_resources"
  ON public.month_resources FOR SELECT
  USING (true);

-- Index for performance
CREATE INDEX idx_month_resources_month_id ON public.month_resources(month_id);
