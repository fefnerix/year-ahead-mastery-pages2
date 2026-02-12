
-- Create week_blocks table
CREATE TABLE public.week_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_index int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_week_blocks_week_order ON public.week_blocks (week_id, order_index);

ALTER TABLE public.week_blocks ENABLE ROW LEVEL SECURITY;

-- Users can read visible blocks
CREATE POLICY "Users can read visible blocks" ON public.week_blocks
  FOR SELECT USING (is_visible = true);

-- Admins can CRUD all blocks
CREATE POLICY "Admins can manage blocks" ON public.week_blocks
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_week_blocks_updated_at
  BEFORE UPDATE ON public.week_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
