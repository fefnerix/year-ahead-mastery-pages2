
-- A.1: Add media columns to weeks
ALTER TABLE public.weeks ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.weeks ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE public.weeks ADD COLUMN IF NOT EXISTS schedule_image_url text;
ALTER TABLE public.weeks ADD COLUMN IF NOT EXISTS schedule_pdf_url text;

-- A.2: Create period_type enum and leaderboard_scores table
DO $$ BEGIN
  CREATE TYPE public.period_type AS ENUM ('week', 'month', 'year');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.leaderboard_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_type public.period_type NOT NULL,
  period_key text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  days_completed integer NOT NULL DEFAULT 0,
  weeks_completed integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_type, period_key)
);

ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read leaderboard (for ranking display)
CREATE POLICY "Anyone can read leaderboard" ON public.leaderboard_scores
  FOR SELECT TO authenticated USING (true);

-- Only system (via security definer functions) writes to leaderboard
-- No direct insert/update/delete policies for regular users

-- A.3: calculate_user_score function
CREATE OR REPLACE FUNCTION public.calculate_user_score(
  p_user_id uuid,
  p_period_type public.period_type,
  p_period_key text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score integer := 0;
  v_days_completed integer := 0;
  v_weeks_completed integer := 0;
  v_task_count integer;
  v_check_count integer;
  v_day_complete boolean;
  v_week_days_complete integer;
  rec record;
BEGIN
  -- Determine which days fall in this period
  FOR rec IN
    SELECT d.id as day_id, d.week_id, d.date
    FROM days d
    JOIN weeks w ON w.id = d.week_id
    JOIN months m ON m.id = w.month_id
    WHERE
      CASE
        WHEN p_period_type = 'week' THEN 'W' || to_char(d.date, 'IYYY-IW') = p_period_key
                                          OR to_char(d.date, 'IYYY') || '-W' || to_char(d.date, 'IW') = p_period_key
        WHEN p_period_type = 'month' THEN to_char(d.date, 'YYYY-MM') = p_period_key
        WHEN p_period_type = 'year' THEN to_char(d.date, 'YYYY') = p_period_key
      END
      AND d.unlock_date <= CURRENT_DATE
  LOOP
    -- Count tasks and checks for this day
    SELECT COUNT(t.id), COUNT(tc.id)
    INTO v_task_count, v_check_count
    FROM tasks t
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE t.day_id = rec.day_id;

    -- 1 point per completed task
    v_score := v_score + v_check_count;

    -- +2 bonus for complete day (5/5)
    IF v_task_count > 0 AND v_check_count = v_task_count THEN
      v_score := v_score + 2;
      v_days_completed := v_days_completed + 1;
    END IF;
  END LOOP;

  -- Check for complete weeks (+10 bonus each)
  FOR rec IN
    SELECT w.id as week_id, COUNT(d.id) as total_days,
      SUM(CASE WHEN (
        SELECT COUNT(tc.id) FROM tasks t2 
        LEFT JOIN task_checks tc ON tc.task_id = t2.id AND tc.user_id = p_user_id
        WHERE t2.day_id = d.id
      ) = (
        SELECT COUNT(t3.id) FROM tasks t3 WHERE t3.day_id = d.id
      ) AND (SELECT COUNT(t4.id) FROM tasks t4 WHERE t4.day_id = d.id) > 0
      THEN 1 ELSE 0 END) as complete_days
    FROM weeks w
    JOIN days d ON d.week_id = w.id AND d.unlock_date <= CURRENT_DATE
    JOIN months m ON m.id = w.month_id
    WHERE
      CASE
        WHEN p_period_type = 'week' THEN to_char(d.date, 'IYYY') || '-W' || to_char(d.date, 'IW') = p_period_key
        WHEN p_period_type = 'month' THEN to_char(d.date, 'YYYY-MM') = p_period_key
        WHEN p_period_type = 'year' THEN to_char(d.date, 'YYYY') = p_period_key
      END
    GROUP BY w.id
    HAVING COUNT(d.id) = 7
  LOOP
    IF rec.complete_days = 7 THEN
      v_score := v_score + 10;
      v_weeks_completed := v_weeks_completed + 1;
    END IF;
  END LOOP;

  -- Upsert score
  INSERT INTO leaderboard_scores (user_id, period_type, period_key, score, days_completed, weeks_completed, updated_at)
  VALUES (p_user_id, p_period_type, p_period_key, v_score, v_days_completed, v_weeks_completed, now())
  ON CONFLICT (user_id, period_type, period_key) DO UPDATE SET
    score = v_score,
    days_completed = v_days_completed,
    weeks_completed = v_weeks_completed,
    updated_at = now();

  RETURN json_build_object('score', v_score, 'days_completed', v_days_completed, 'weeks_completed', v_weeks_completed);
END;
$$;

-- A.4: get_leaderboard function
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_period_type public.period_type,
  p_period_key text,
  p_limit integer DEFAULT 20
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT
      ls.user_id,
      COALESCE(p.display_name, 'Anónimo') as display_name,
      ls.score,
      ls.days_completed,
      ls.weeks_completed,
      COALESCE(us.current_streak, 0) as streak,
      ROW_NUMBER() OVER (ORDER BY ls.score DESC, ls.days_completed DESC, COALESCE(us.current_streak, 0) DESC, ls.weeks_completed DESC) as position
    FROM leaderboard_scores ls
    LEFT JOIN profiles p ON p.user_id = ls.user_id
    LEFT JOIN user_streaks us ON us.user_id = ls.user_id
    WHERE ls.period_type = p_period_type AND ls.period_key = p_period_key
    ORDER BY ls.score DESC, ls.days_completed DESC, COALESCE(us.current_streak, 0) DESC, ls.weeks_completed DESC
    LIMIT p_limit
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

-- A.5: Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('schedules', 'schedules', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('audios', 'audios', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS: public read
CREATE POLICY "Public read covers" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Public read schedules" ON storage.objects FOR SELECT USING (bucket_id = 'schedules');
CREATE POLICY "Public read audios" ON storage.objects FOR SELECT USING (bucket_id = 'audios');
CREATE POLICY "Public read pdfs" ON storage.objects FOR SELECT USING (bucket_id = 'pdfs');

-- Storage RLS: admin write
CREATE POLICY "Admin upload covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin upload schedules" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'schedules' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin upload audios" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audios' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin upload pdfs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdfs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update covers" ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update schedules" ON storage.objects FOR UPDATE USING (bucket_id = 'schedules' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update audios" ON storage.objects FOR UPDATE USING (bucket_id = 'audios' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update pdfs" ON storage.objects FOR UPDATE USING (bucket_id = 'pdfs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete covers" ON storage.objects FOR DELETE USING (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete schedules" ON storage.objects FOR DELETE USING (bucket_id = 'schedules' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete audios" ON storage.objects FOR DELETE USING (bucket_id = 'audios' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete pdfs" ON storage.objects FOR DELETE USING (bucket_id = 'pdfs' AND public.has_role(auth.uid(), 'admin'));

-- Allow profiles to be read by anyone authenticated (needed for leaderboard)
CREATE POLICY "Anyone can read profiles for ranking" ON public.profiles
  FOR SELECT TO authenticated USING (true);
