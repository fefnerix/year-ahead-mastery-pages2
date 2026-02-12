
-- Create task_checks table for tracking user task completions
CREATE TABLE public.task_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- Enable RLS
ALTER TABLE public.task_checks ENABLE ROW LEVEL SECURITY;

-- Users can read their own checks
CREATE POLICY "Users can read own checks"
  ON public.task_checks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own checks
CREATE POLICY "Users can insert own checks"
  ON public.task_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own checks
CREATE POLICY "Users can delete own checks"
  ON public.task_checks FOR DELETE
  USING (auth.uid() = user_id);

-- Create user_streaks table
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Users can read their own streak
CREATE POLICY "Users can read own streak"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can upsert their own streak
CREATE POLICY "Users can insert own streak"
  ON public.user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON public.user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_task_checks_user_day ON public.task_checks(user_id, day_id);
CREATE INDEX idx_task_checks_user ON public.task_checks(user_id);

-- RPC function to get user progress (day/week/month/year percentages)
CREATE OR REPLACE FUNCTION public.get_user_progress(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_id UUID;
  v_week_id UUID;
  v_month_id UUID;
  v_program_id UUID;
  v_day_pct NUMERIC;
  v_week_pct NUMERIC;
  v_month_pct NUMERIC;
  v_year_pct NUMERIC;
  v_day_number INTEGER;
  v_week_name TEXT;
  v_month_theme TEXT;
BEGIN
  -- Find today's day record
  SELECT d.id, d.week_id, d.number INTO v_day_id, v_week_id, v_day_number
  FROM days d WHERE d.date = p_date LIMIT 1;

  IF v_day_id IS NULL THEN
    RETURN json_build_object(
      'day_id', NULL, 'day_pct', 0, 'week_pct', 0, 'month_pct', 0, 'year_pct', 0,
      'day_number', 0, 'week_name', '', 'month_theme', ''
    );
  END IF;

  -- Get week and month info
  SELECT w.month_id, w.name INTO v_month_id, v_week_name
  FROM weeks w WHERE w.id = v_week_id;

  SELECT m.program_id, m.theme INTO v_program_id, v_month_theme
  FROM months m WHERE m.id = v_month_id;

  -- Day progress: checks / tasks for this day
  SELECT COALESCE(
    ROUND(COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id), 0) * 100),
    0
  ) INTO v_day_pct
  FROM tasks t
  LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
  WHERE t.day_id = v_day_id;

  -- Week progress: average of day percentages for unlocked days in this week
  SELECT COALESCE(ROUND(AVG(day_pct)), 0) INTO v_week_pct
  FROM (
    SELECT d.id,
      COALESCE(ROUND(COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id), 0) * 100), 0) AS day_pct
    FROM days d
    JOIN tasks t ON t.day_id = d.id
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.week_id = v_week_id AND d.unlock_date <= p_date
    GROUP BY d.id
  ) sub;

  -- Month progress: average of week percentages for weeks in this month
  SELECT COALESCE(ROUND(AVG(week_pct)), 0) INTO v_month_pct
  FROM (
    SELECT w.id,
      COALESCE(ROUND(AVG(day_pct)), 0) AS week_pct
    FROM weeks w
    JOIN days d ON d.week_id = w.id AND d.unlock_date <= p_date
    JOIN tasks t ON t.day_id = d.id
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE w.month_id = v_month_id
    GROUP BY w.id
  ) sub;

  -- Year progress: average of month percentages
  SELECT COALESCE(ROUND(AVG(month_pct)), 0) INTO v_year_pct
  FROM (
    SELECT m.id,
      COALESCE(ROUND(AVG(
        COALESCE((
          SELECT ROUND(AVG(day_pct))
          FROM (
            SELECT COALESCE(ROUND(COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id), 0) * 100), 0) AS day_pct
            FROM days d2
            JOIN tasks t ON t.day_id = d2.id
            LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
            WHERE d2.week_id = w.id AND d2.unlock_date <= p_date
            GROUP BY d2.id
          ) wd
        ), 0)
      )), 0) AS month_pct
    FROM months m
    JOIN weeks w ON w.month_id = m.id
    WHERE m.program_id = v_program_id
    GROUP BY m.id
  ) sub;

  RETURN json_build_object(
    'day_id', v_day_id,
    'day_pct', v_day_pct,
    'week_pct', v_week_pct,
    'month_pct', v_month_pct,
    'year_pct', v_year_pct,
    'day_number', v_day_number,
    'week_name', v_week_name,
    'month_theme', v_month_theme
  );
END;
$$;

-- RPC function to get/update user streak
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE := CURRENT_DATE;
  v_day_tasks INTEGER;
  v_day_checks INTEGER;
  v_max_streak INTEGER;
BEGIN
  -- Count consecutive completed days backwards from today
  LOOP
    SELECT COUNT(t.id), COUNT(tc.id)
    INTO v_day_tasks, v_day_checks
    FROM days d
    JOIN tasks t ON t.day_id = d.id
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.date = v_check_date AND d.unlock_date <= CURRENT_DATE;

    EXIT WHEN v_day_tasks = 0 OR v_day_checks < v_day_tasks;

    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  -- Upsert streak record
  INSERT INTO user_streaks (user_id, current_streak, max_streak, last_completed_date, updated_at)
  VALUES (p_user_id, v_streak, v_streak, CASE WHEN v_streak > 0 THEN CURRENT_DATE ELSE NULL END, now())
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = v_streak,
    max_streak = GREATEST(user_streaks.max_streak, v_streak),
    last_completed_date = CASE WHEN v_streak > 0 THEN CURRENT_DATE ELSE user_streaks.last_completed_date END,
    updated_at = now();

  SELECT max_streak INTO v_max_streak FROM user_streaks WHERE user_id = p_user_id;

  RETURN json_build_object('current_streak', v_streak, 'max_streak', v_max_streak);
END;
$$;
