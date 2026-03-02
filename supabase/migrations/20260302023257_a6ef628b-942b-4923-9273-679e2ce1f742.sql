-- Performance indexes for most-used queries

-- month_tasks: filtered by month_id + is_active, ordered by sort_order
CREATE INDEX IF NOT EXISTS idx_month_tasks_month_active ON public.month_tasks (month_id, sort_order) WHERE is_active = true;

-- month_task_checks: filtered by user_id + month_id
CREATE INDEX IF NOT EXISTS idx_month_task_checks_user_month ON public.month_task_checks (user_id, month_id);

-- month_task_checks: filtered by month_id + checked (for leaderboard RPC)
CREATE INDEX IF NOT EXISTS idx_month_task_checks_month_checked ON public.month_task_checks (month_id) WHERE checked = true;

-- month_task_assets: batch fetch by task ids
CREATE INDEX IF NOT EXISTS idx_month_task_assets_task ON public.month_task_assets (month_task_id, sort_order);

-- month_task_notes: user notes per month
CREATE INDEX IF NOT EXISTS idx_month_task_notes_user_month ON public.month_task_notes (user_id, month_id);

-- month_task_subtask_checks: user subtask checks per month
CREATE INDEX IF NOT EXISTS idx_subtask_checks_user_month ON public.month_task_subtask_checks (user_id, month_id);

-- task_checks: filtered by day + user (for daily progress)
CREATE INDEX IF NOT EXISTS idx_task_checks_day_user ON public.task_checks (day_id, user_id);

-- journal_entries: filtered by user + month
CREATE INDEX IF NOT EXISTS idx_journal_user_month ON public.journal_entries (user_id, month_id);

-- access_entitlements: filtered by user + status
CREATE INDEX IF NOT EXISTS idx_entitlements_user_status ON public.access_entitlements (user_id, status);

-- days: filtered by week_id + ordered by number
CREATE INDEX IF NOT EXISTS idx_days_week_number ON public.days (week_id, number);

-- tasks: filtered by day_id + is_active
CREATE INDEX IF NOT EXISTS idx_tasks_day_active ON public.tasks (day_id, "order") WHERE is_active = true;
