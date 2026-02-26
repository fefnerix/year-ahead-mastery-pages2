
-- Part 1A: Add media columns to tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS media_image_url text,
  ADD COLUMN IF NOT EXISTS media_video_url text,
  ADD COLUMN IF NOT EXISTS media_audio_url text;

-- Part 1B: Create task_media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('task_media', 'task_media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for task_media bucket
CREATE POLICY "Anyone can read task_media"
ON storage.objects FOR SELECT
USING (bucket_id = 'task_media');

CREATE POLICY "Admins can upload task_media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task_media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update task_media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'task_media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete task_media"
ON storage.objects FOR DELETE
USING (bucket_id = 'task_media' AND public.has_role(auth.uid(), 'admin'));

-- Part 1C: Update get_user_progress to return month_id
CREATE OR REPLACE FUNCTION public.get_user_progress(p_user_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_day_id UUID;
  v_week_id UUID;
  v_month_id UUID;
  v_program_id UUID;
  v_day_pct NUMERIC := 0;
  v_week_pct NUMERIC := 0;
  v_month_pct NUMERIC := 0;
  v_year_pct NUMERIC := 0;
  v_day_number INTEGER := 0;
  v_week_name TEXT := '';
  v_month_theme TEXT := '';
BEGIN
  -- Find active week (keeping existing logic but now returning month_id)
  SELECT w.id, w.month_id, COALESCE(w.name, '')
    INTO v_week_id, v_month_id, v_week_name
  FROM weeks w WHERE w.status = 'active' LIMIT 1;

  IF v_week_id IS NULL THEN
    RETURN json_build_object('day_id', NULL, 'month_id', NULL, 'day_pct', 0, 'week_pct', 0, 'month_pct', 0, 'year_pct', 0, 'day_number', 0, 'week_name', '', 'month_theme', '');
  END IF;

  SELECT d.id, d.number INTO v_day_id, v_day_number
  FROM days d WHERE d.week_id = v_week_id AND d.unlock_date <= p_date
  ORDER BY d.number DESC LIMIT 1;

  IF v_day_id IS NULL THEN
    SELECT d.id, d.number INTO v_day_id, v_day_number
    FROM days d WHERE d.week_id = v_week_id ORDER BY d.number ASC LIMIT 1;
  END IF;

  IF v_day_id IS NULL THEN
    RETURN json_build_object('day_id', NULL, 'month_id', v_month_id, 'day_pct', 0, 'week_pct', 0, 'month_pct', 0, 'year_pct', 0, 'day_number', 0, 'week_name', v_week_name, 'month_theme', '');
  END IF;

  SELECT m.program_id, COALESCE(m.theme, '') INTO v_program_id, v_month_theme
  FROM months m WHERE m.id = v_month_id;

  -- Day pct (active tasks only)
  SELECT COALESCE(ROUND((COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id),0)) * 100), 0)
    INTO v_day_pct
  FROM tasks t
  LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
  WHERE t.day_id = v_day_id AND t.is_active = true;

  -- Week pct (active tasks only)
  WITH day_progress AS (
    SELECT d.id AS day_id,
           COALESCE(ROUND((COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id),0)) * 100), 0) AS day_pct
    FROM days d
    JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.week_id = v_week_id AND d.unlock_date <= p_date
    GROUP BY d.id
  )
  SELECT COALESCE(ROUND(AVG(day_pct)), v_day_pct) INTO v_week_pct FROM day_progress;

  -- Month pct (active tasks only)
  WITH week_progress AS (
    SELECT w.id AS week_id,
           COALESCE(ROUND(AVG(dp.day_pct)), 0) AS week_pct
    FROM weeks w
    JOIN (
      SELECT d.week_id, d.id AS day_id,
             COALESCE(ROUND((COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id),0)) * 100), 0) AS day_pct
      FROM days d
      JOIN tasks t ON t.day_id = d.id AND t.is_active = true
      LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
      WHERE d.unlock_date <= p_date
      GROUP BY d.week_id, d.id
    ) dp ON dp.week_id = w.id
    WHERE w.month_id = v_month_id
    GROUP BY w.id
  )
  SELECT COALESCE(ROUND(AVG(week_pct)), 0) INTO v_month_pct FROM week_progress;

  -- Year pct (active tasks only)
  WITH month_progress AS (
    SELECT m.id AS month_id,
           COALESCE(ROUND(AVG(wp.week_pct)), 0) AS month_pct
    FROM months m
    LEFT JOIN (
      SELECT w.month_id,
             COALESCE(ROUND(AVG(dp.day_pct)), 0) AS week_pct
      FROM weeks w
      JOIN (
        SELECT d.week_id, d.id AS day_id,
               COALESCE(ROUND((COUNT(tc.id)::NUMERIC / NULLIF(COUNT(t.id),0)) * 100), 0) AS day_pct
        FROM days d
        JOIN tasks t ON t.day_id = d.id AND t.is_active = true
        LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
        WHERE d.unlock_date <= p_date
        GROUP BY d.week_id, d.id
      ) dp ON dp.week_id = w.id
      GROUP BY w.month_id
    ) wp ON wp.month_id = m.id
    WHERE m.program_id = v_program_id
    GROUP BY m.id
  )
  SELECT COALESCE(ROUND(AVG(month_pct)), 0) INTO v_year_pct FROM month_progress;

  RETURN json_build_object(
    'day_id', v_day_id, 'month_id', v_month_id, 'day_pct', v_day_pct, 'week_pct', v_week_pct,
    'month_pct', v_month_pct, 'year_pct', v_year_pct,
    'day_number', v_day_number, 'week_name', v_week_name, 'month_theme', v_month_theme
  );
END;
$function$;
