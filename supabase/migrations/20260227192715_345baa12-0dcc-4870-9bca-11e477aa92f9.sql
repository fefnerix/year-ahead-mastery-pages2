
-- Create month_task_assets table for 1:N assets per task
CREATE TABLE public.month_task_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_task_id uuid NOT NULL REFERENCES public.month_tasks(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('image','video','audio','file','link')),
  title text,
  description text,
  url text NOT NULL,
  file_path text,
  mime_type text,
  size_bytes bigint,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for ordered lookup
CREATE INDEX idx_month_task_assets_task_order ON public.month_task_assets (month_task_id, sort_order);

-- Enable RLS
ALTER TABLE public.month_task_assets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read
CREATE POLICY "Authenticated users can read month_task_assets"
  ON public.month_task_assets FOR SELECT
  USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage month_task_assets"
  ON public.month_task_assets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Migrate existing legacy fields into assets
INSERT INTO public.month_task_assets (month_task_id, kind, url, sort_order)
SELECT id, 'image', image_url, 0
FROM public.month_tasks WHERE image_url IS NOT NULL AND image_url <> '';

INSERT INTO public.month_task_assets (month_task_id, kind, url, sort_order)
SELECT id, 'video', video_url, 1
FROM public.month_tasks WHERE video_url IS NOT NULL AND video_url <> '';

INSERT INTO public.month_task_assets (month_task_id, kind, url, sort_order)
SELECT id, 'audio', audio_url, 2
FROM public.month_tasks WHERE audio_url IS NOT NULL AND audio_url <> '';

INSERT INTO public.month_task_assets (month_task_id, kind, url, sort_order)
SELECT id, 'file', file_url, 3
FROM public.month_tasks WHERE file_url IS NOT NULL AND file_url <> '';
