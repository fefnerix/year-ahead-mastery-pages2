
-- Add new columns to tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS task_kind text NOT NULL DEFAULT 'activity',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add check constraint for task_kind values
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_task_kind_check CHECK (task_kind IN ('prayer', 'activity'));
