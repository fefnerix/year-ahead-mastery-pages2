
-- Fix get_user_progress: MES and TOTAL use sum(done) / (count_days * 2) * 100
CREATE OR REPLACE FUNCTION public.get_user_progress(p_user_id uuid, p_date date DEFAULT NULL::date)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_today date;
  v_month_id UUID;
  v_day_id UUID;
  v_program_id UUID;
  v_day_pct NUMERIC := 0;
  v_week_pct NUMERIC := 0;
  v_month_pct NUMERIC := 0;
  v_year_pct NUMERIC := 0;
  v_day_number INTEGER := 0;
  v_week_name TEXT := '';
  v_month_theme TEXT := '';
  v_today_done INT := 0;
  v_month_done INT := 0;
  v_month_days INT := 0;
  v_total_done INT := 0;
  v_total_days INT := 0;
BEGIN
  v_today := COALESCE(p_date, (now() AT TIME ZONE 'America/Sao_Paulo')::date);

  -- Find the current month by matching year + month_number
  SELECT m.id, m.program_id, COALESCE(m.theme, '')
    INTO v_month_id, v_program_id, v_month_theme
  FROM months m
  WHERE m.year = EXTRACT(YEAR FROM v_today)::int
    AND m.number = EXTRACT(MONTH FROM v_today)::int
  LIMIT 1;

  IF v_month_id IS NULL THEN
    RETURN json_build_object(
      'day_id', NULL, 'month_id', NULL, 'day_pct', 0, 'week_pct', 0,
      'month_pct', 0, 'year_pct', 0, 'day_number', 0, 'week_name', '', 'month_theme', ''
    );
  END IF;

  -- Find today's day
  SELECT d.id, d.number INTO v_day_id, v_day_number
  FROM days d JOIN weeks w ON w.id = d.week_id AND w.month_id = v_month_id
  WHERE d.date = v_today LIMIT 1;

  -- Week name
  IF v_day_id IS NOT NULL THEN
    SELECT COALESCE(w.name, '') INTO v_week_name
    FROM days d JOIN weeks w ON w.id = d.week_id WHERE d.id = v_day_id;
  END IF;

  -- HOY: done_today / 2 * 100
  IF v_day_id IS NOT NULL THEN
    SELECT COUNT(tc.id)::int INTO v_today_done
    FROM tasks t
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE t.day_id = v_day_id AND t.is_active = true;
    
    v_day_pct := LEAST(100, ROUND((v_today_done::numeric / GREATEST(1, 2)) * 100));
  END IF;

  -- MES: sum(checks in month) / (count_days_in_month * 2) * 100
  SELECT COUNT(DISTINCT d.id)::int, COALESCE(SUM(sub.done), 0)::int
    INTO v_month_days, v_month_done
  FROM days d
  JOIN weeks w ON w.id = d.week_id AND w.month_id = v_month_id
  LEFT JOIN LATERAL (
    SELECT COUNT(tc.id)::int AS done
    FROM tasks t
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE t.day_id = d.id AND t.is_active = true
  ) sub ON true
  WHERE d.date <= v_today;

  IF v_month_days > 0 THEN
    v_month_pct := LEAST(100, ROUND((v_month_done::numeric / (v_month_days * 2)) * 100));
  END IF;

  -- TOTAL: sum(checks in cycle) / (count_days_in_cycle * 2) * 100
  SELECT COUNT(DISTINCT d.id)::int, COALESCE(SUM(sub.done), 0)::int
    INTO v_total_days, v_total_done
  FROM days d
  JOIN weeks w ON w.id = d.week_id
  JOIN months m ON m.id = w.month_id AND m.program_id = v_program_id
  LEFT JOIN LATERAL (
    SELECT COUNT(tc.id)::int AS done
    FROM tasks t
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE t.day_id = d.id AND t.is_active = true
  ) sub ON true
  WHERE d.date <= v_today;

  IF v_total_days > 0 THEN
    v_year_pct := LEAST(100, ROUND((v_total_done::numeric / (v_total_days * 2)) * 100));
  END IF;

  -- Week pct (same logic: done / days_in_week * 2)
  IF v_day_id IS NOT NULL THEN
    DECLARE
      v_week_done INT := 0;
      v_week_days INT := 0;
    BEGIN
      SELECT COUNT(DISTINCT d.id)::int, COALESCE(SUM(sub.done), 0)::int
        INTO v_week_days, v_week_done
      FROM days d
      LEFT JOIN LATERAL (
        SELECT COUNT(tc.id)::int AS done
        FROM tasks t
        LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
        WHERE t.day_id = d.id AND t.is_active = true
      ) sub ON true
      WHERE d.week_id = (SELECT d2.week_id FROM days d2 WHERE d2.id = v_day_id)
        AND d.date <= v_today;

      IF v_week_days > 0 THEN
        v_week_pct := LEAST(100, ROUND((v_week_done::numeric / (v_week_days * 2)) * 100));
      END IF;
    END;
  END IF;

  RETURN json_build_object(
    'day_id', v_day_id, 'month_id', v_month_id, 'day_pct', v_day_pct, 'week_pct', v_week_pct,
    'month_pct', v_month_pct, 'year_pct', v_year_pct,
    'day_number', COALESCE(v_day_number, 0), 'week_name', v_week_name, 'month_theme', v_month_theme
  );
END;
$function$;

-- Update get_month_calendar to include has_notes
CREATE OR REPLACE FUNCTION public.get_month_calendar(p_user_id uuid, p_month_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
  v_today date;
BEGIN
  v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;

  SELECT json_agg(row_to_json(r) ORDER BY r.day_number) INTO v_result
  FROM (
    SELECT
      d.id AS day_id,
      d.date,
      d.week_id,
      d.number AS day_number,
      w.name AS week_name,
      w.number AS week_number,
      COALESCE(
        ROUND((COUNT(tc.id)::numeric / NULLIF(COUNT(t.id), 0)) * 100),
        0
      )::int AS day_pct,
      CASE
        WHEN d.date > v_today THEN 'future'
        WHEN COUNT(t.id) > 0 AND COUNT(tc.id) = COUNT(t.id) THEN 'complete'
        WHEN COUNT(tc.id) > 0 THEN 'partial'
        ELSE 'pending'
      END AS status,
      EXISTS (
        SELECT 1 FROM task_notes tn 
        WHERE tn.day_id = d.id AND tn.user_id = p_user_id AND tn.content <> ''
      ) AS has_notes,
      EXISTS (
        SELECT 1 FROM journal_entries je 
        WHERE je.day_id = d.id AND je.user_id = p_user_id AND je.content <> ''
      ) AS has_journal
    FROM days d
    JOIN weeks w ON w.id = d.week_id AND w.month_id = p_month_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    GROUP BY d.id, d.date, d.week_id, d.number, w.name, w.number
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

-- Simplify ranking: 1pt per task, no bonus (max 2/day)
CREATE OR REPLACE FUNCTION public.get_leaderboard_v2(p_scope text, p_program_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
  v_today date;
  v_current_month_id uuid;
BEGIN
  v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;

  IF p_scope IN ('day', 'month') THEN
    SELECT m.id INTO v_current_month_id
    FROM months m
    WHERE m.program_id = p_program_id
      AND m.number = EXTRACT(MONTH FROM v_today)::int
      AND m.year = EXTRACT(YEAR FROM v_today)::int
    LIMIT 1;
  END IF;

  SELECT json_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT sub.user_id, COALESCE(p.display_name, 'Anónimo') AS display_name,
      sub.points,
      sub.days_completed,
      ROW_NUMBER() OVER (ORDER BY sub.points DESC, sub.days_completed DESC) AS position
    FROM (
      SELECT tc.user_id,
        COUNT(tc.id)::int AS points,
        COUNT(DISTINCT CASE
          WHEN day_total.total_tasks > 0 AND day_total.total_tasks = day_done.done_tasks THEN tc.day_id END)::int AS days_completed
      FROM task_checks tc
      JOIN tasks t ON t.id = tc.task_id AND t.is_active = true
      JOIN days d ON d.id = tc.day_id
      JOIN weeks w ON w.id = d.week_id
      JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
      LEFT JOIN LATERAL (SELECT COUNT(t2.id)::int AS total_tasks FROM tasks t2 WHERE t2.day_id = tc.day_id AND t2.is_active = true) day_total ON true
      LEFT JOIN LATERAL (SELECT COUNT(tc2.id)::int AS done_tasks FROM task_checks tc2 JOIN tasks t3 ON t3.id = tc2.task_id AND t3.is_active = true WHERE tc2.day_id = tc.day_id AND tc2.user_id = tc.user_id) day_done ON true
      WHERE CASE
        WHEN p_scope = 'day' THEN d.date = v_today
        WHEN p_scope = 'month' THEN m.id = v_current_month_id
        ELSE true
      END
      GROUP BY tc.user_id
    ) sub
    LEFT JOIN profiles p ON p.user_id = sub.user_id
    ORDER BY sub.points DESC, sub.days_completed DESC
    LIMIT 20
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

-- Simplify ranking summary: 1pt per task, no bonus
CREATE OR REPLACE FUNCTION public.get_my_ranking_summary(p_user_id uuid, p_program_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_today date;
  v_current_month_id uuid;
  v_today_points int := 0;
  v_month_points int := 0;
  v_total_points int := 0;
  v_today_max int := 0;
  v_month_max int := 0;
  v_total_max int := 0;
  v_streak int := 0;
  v_max_streak int := 0;
  v_position int := 0;
  v_check_date date;
  v_day_tasks int;
  v_day_checks int;
BEGIN
  v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;

  SELECT m.id INTO v_current_month_id
  FROM months m
  WHERE m.program_id = p_program_id 
    AND m.number = EXTRACT(MONTH FROM v_today)::int
    AND m.year = EXTRACT(YEAR FROM v_today)::int
  LIMIT 1;

  -- Today: 1pt per check, max = count active tasks
  SELECT COALESCE(COUNT(tc.id), 0)::int, COALESCE(COUNT(t.id), 0)::int
  INTO v_today_points, v_today_max
  FROM days d
  JOIN weeks w ON w.id = d.week_id JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
  LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
  LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
  WHERE d.date = v_today;

  -- Month
  SELECT COALESCE(COUNT(tc.id), 0)::int, COALESCE(COUNT(t.id), 0)::int
  INTO v_month_points, v_month_max
  FROM days d
  JOIN weeks w ON w.id = d.week_id JOIN months m ON m.id = w.month_id AND m.id = v_current_month_id
  LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
  LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
  WHERE d.date <= v_today;

  -- Total
  SELECT COALESCE(COUNT(tc.id), 0)::int, COALESCE(COUNT(t.id), 0)::int
  INTO v_total_points, v_total_max
  FROM days d
  JOIN weeks w ON w.id = d.week_id JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
  LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
  LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
  WHERE d.date <= v_today;

  -- Streak
  v_check_date := v_today;
  LOOP
    SELECT
      COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.day_id = d.id AND t.is_active = true), 0)::int,
      COALESCE((SELECT COUNT(*) FROM task_checks tc JOIN tasks t ON t.id = tc.task_id AND t.is_active = true WHERE tc.day_id = d.id AND tc.user_id = p_user_id), 0)::int
    INTO v_day_tasks, v_day_checks
    FROM days d JOIN weeks w ON w.id = d.week_id JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
    WHERE d.date = v_check_date LIMIT 1;
    IF NOT FOUND OR v_day_tasks = 0 OR v_day_checks < v_day_tasks THEN EXIT; END IF;
    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  SELECT COALESCE(us.max_streak, 0) INTO v_max_streak FROM user_streaks us WHERE us.user_id = p_user_id;
  IF NOT FOUND THEN v_max_streak := 0; END IF;
  IF v_streak > v_max_streak THEN v_max_streak := v_streak; END IF;

  -- Position (1pt per check, no bonus)
  SELECT COALESCE(pos, 0)::int INTO v_position
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY points DESC) AS pos
    FROM (
      SELECT tc.user_id, COUNT(tc.id)::int AS points
      FROM task_checks tc JOIN tasks t ON t.id = tc.task_id AND t.is_active = true
      JOIN days d ON d.id = tc.day_id JOIN weeks w ON w.id = d.week_id
      JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
      GROUP BY tc.user_id
    ) scores
  ) ranked WHERE user_id = p_user_id;
  IF NOT FOUND THEN v_position := 0; END IF;

  RETURN json_build_object(
    'today_points', v_today_points, 'month_points', v_month_points, 'total_points', v_total_points,
    'today_pct', CASE WHEN v_today_max > 0 THEN ROUND((v_today_points::numeric / v_today_max) * 100) ELSE 0 END,
    'month_pct', CASE WHEN v_month_max > 0 THEN ROUND((v_month_points::numeric / v_month_max) * 100) ELSE 0 END,
    'total_pct', CASE WHEN v_total_max > 0 THEN ROUND((v_total_points::numeric / v_total_max) * 100) ELSE 0 END,
    'streak', v_streak, 'max_streak', v_max_streak, 'position', v_position
  );
END;
$function$;
