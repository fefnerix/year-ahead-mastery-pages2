
-- Add month_id to month_tasks for per-month task configuration
ALTER TABLE public.month_tasks ADD COLUMN month_id uuid REFERENCES public.months(id) ON DELETE CASCADE;

-- Create index for efficient lookups
CREATE INDEX idx_month_tasks_month_id ON public.month_tasks(month_id);
