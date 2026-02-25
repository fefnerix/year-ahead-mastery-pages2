
ALTER TABLE public.months
  ADD COLUMN IF NOT EXISTS macro_text text,
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS video_url text;
