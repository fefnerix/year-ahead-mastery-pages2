
-- Subtask catalog (admin-managed)
CREATE TABLE public.month_task_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_task_id uuid NOT NULL REFERENCES public.month_tasks(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_month_task_subtasks_order ON public.month_task_subtasks (month_task_id, sort_order);

ALTER TABLE public.month_task_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read month_task_subtasks"
  ON public.month_task_subtasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage month_task_subtasks"
  ON public.month_task_subtasks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User checks for subtasks
CREATE TABLE public.month_task_subtask_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month_id uuid NOT NULL REFERENCES public.months(id) ON DELETE CASCADE,
  subtask_id uuid NOT NULL REFERENCES public.month_task_subtasks(id) ON DELETE CASCADE,
  checked boolean NOT NULL DEFAULT true,
  checked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_id, subtask_id)
);

ALTER TABLE public.month_task_subtask_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subtask checks"
  ON public.month_task_subtask_checks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subtask checks"
  ON public.month_task_subtask_checks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subtask checks"
  ON public.month_task_subtask_checks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subtask checks"
  ON public.month_task_subtask_checks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
