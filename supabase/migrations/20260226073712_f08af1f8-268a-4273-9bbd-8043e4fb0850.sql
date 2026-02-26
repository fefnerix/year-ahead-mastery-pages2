
-- New leaderboard RPC: get_leaderboard_v2(p_scope, p_program_id)
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

  -- Resolve current month for 'day' and 'month' scopes
  IF p_scope IN ('day', 'month') THEN
    SELECT m.id INTO v_current_month_id
    FROM months m
    WHERE m.program_id = p_program_id
      AND m.number = EXTRACT(MONTH FROM v_today)::int
    LIMIT 1;
  END IF;

  SELECT json_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT
      sub.user_id,
      COALESCE(p.display_name, 'Anónimo') AS display_name,
      sub.points,
      sub.days_completed,
      ROW_NUMBER() OVER (ORDER BY sub.points DESC, sub.days_completed DESC) AS position
    FROM (
      SELECT
        tc.user_id,
        COUNT(tc.id)::int AS raw_checks,
        -- points = 1 per check + 1 bonus per day where user completed all active tasks (2/2)
        COUNT(tc.id)::int + COUNT(DISTINCT CASE
          WHEN day_total.total_tasks > 0 AND day_total.total_tasks = day_done.done_tasks
          THEN tc.day_id
        END)::int AS points,
        COUNT(DISTINCT CASE
          WHEN day_total.total_tasks > 0 AND day_total.total_tasks = day_done.done_tasks
          THEN tc.day_id
        END)::int AS days_completed
      FROM task_checks tc
      JOIN tasks t ON t.id = tc.task_id AND t.is_active = true
      JOIN days d ON d.id = tc.day_id
      JOIN weeks w ON w.id = d.week_id
      JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
      -- subquery: total active tasks per day
      LEFT JOIN LATERAL (
        SELECT COUNT(t2.id)::int AS total_tasks
        FROM tasks t2
        WHERE t2.day_id = tc.day_id AND t2.is_active = true
      ) day_total ON true
      -- subquery: completed tasks per day per user
      LEFT JOIN LATERAL (
        SELECT COUNT(tc2.id)::int AS done_tasks
        FROM task_checks tc2
        JOIN tasks t3 ON t3.id = tc2.task_id AND t3.is_active = true
        WHERE tc2.day_id = tc.day_id AND tc2.user_id = tc.user_id
      ) day_done ON true
      WHERE
        CASE
          WHEN p_scope = 'day' THEN d.date = v_today
          WHEN p_scope = 'month' THEN m.id = v_current_month_id
          ELSE true -- total
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

-- New RPC: get_my_ranking_summary(p_user_id, p_program_id)
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

  -- Current month
  SELECT m.id INTO v_current_month_id
  FROM months m
  WHERE m.program_id = p_program_id AND m.number = EXTRACT(MONTH FROM v_today)::int
  LIMIT 1;

  -- Helper: compute points for a scope
  -- Today points
  SELECT COALESCE(SUM(checks), 0)::int + COALESCE(SUM(CASE WHEN checks = total AND total > 0 THEN 1 ELSE 0 END), 0)::int
  INTO v_today_points
  FROM (
    SELECT d.id,
      COUNT(tc.id)::int AS checks,
      (SELECT COUNT(*) FROM tasks t2 WHERE t2.day_id = d.id AND t2.is_active = true)::int AS total
    FROM days d
    JOIN weeks w ON w.id = d.week_id
    JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.date = v_today
    GROUP BY d.id
  ) x;

  -- Today max possible
  SELECT COALESCE(SUM(total), 0)::int + COALESCE(SUM(CASE WHEN total > 0 THEN 1 ELSE 0 END), 0)::int
  INTO v_today_max
  FROM (
    SELECT d.id, COUNT(t.id)::int AS total
    FROM days d
    JOIN weeks w ON w.id = d.week_id
    JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    WHERE d.date = v_today
    GROUP BY d.id
  ) x;

  -- Month points
  SELECT COALESCE(SUM(checks), 0)::int + COALESCE(SUM(CASE WHEN checks = total AND total > 0 THEN 1 ELSE 0 END), 0)::int
  INTO v_month_points
  FROM (
    SELECT d.id,
      COUNT(tc.id)::int AS checks,
      (SELECT COUNT(*) FROM tasks t2 WHERE t2.day_id = d.id AND t2.is_active = true)::int AS total
    FROM days d
    JOIN weeks w ON w.id = d.week_id
    JOIN months m ON m.id = w.month_id AND m.id = v_current_month_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.date <= v_today
    GROUP BY d.id
  ) x;

  -- Month max
  SELECT COALESCE(SUM(total), 0)::int + COALESCE(SUM(CASE WHEN total > 0 THEN 1 ELSE 0 END), 0)::int
  INTO v_month_max
  FROM (
    SELECT d.id, COUNT(t.id)::int AS total
    FROM days d
    JOIN weeks w ON w.id = d.week_id
    JOIN months m ON m.id = w.month_id AND m.id = v_current_month_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    WHERE d.date <= v_today
    GROUP BY d.id
  ) x;

  -- Total points
  SELECT COALESCE(SUM(checks), 0)::int + COALESCE(SUM(CASE WHEN checks = total AND total > 0 THEN 1 ELSE 0 END), 0)::int
  INTO v_total_points
  FROM (
    SELECT d.id,
      COUNT(tc.id)::int AS checks,
      (SELECT COUNT(*) FROM tasks t2 WHERE t2.day_id = d.id AND t2.is_active = true)::int AS total
    FROM days d
    JOIN weeks w ON w.id = d.week_id
    JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.date <= v_today
    GROUP BY d.id
  ) x;

  -- Total max
  SELECT COALESCE(SUM(total), 0)::int + COALESCE(SUM(CASE WHEN total > 0 THEN 1 ELSE 0 END), 0)::int
  INTO v_total_max
  FROM (
    SELECT d.id, COUNT(t.id)::int AS total
    FROM days d
    JOIN weeks w ON w.id = d.week_id
    JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    WHERE d.date <= v_today
    GROUP BY d.id
  ) x;

  -- Streak (consecutive days with all tasks done, 2/2)
  v_check_date := v_today;
  LOOP
    SELECT
      COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.day_id = d.id AND t.is_active = true), 0)::int,
      COALESCE((SELECT COUNT(*) FROM task_checks tc JOIN tasks t ON t.id = tc.task_id AND t.is_active = true WHERE tc.day_id = d.id AND tc.user_id = p_user_id), 0)::int
    INTO v_day_tasks, v_day_checks
    FROM days d
    JOIN weeks w ON w.id = d.week_id
    JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
    WHERE d.date = v_check_date
    LIMIT 1;

    IF NOT FOUND OR v_day_tasks = 0 OR v_day_checks < v_day_tasks THEN
      EXIT;
    END IF;
    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  -- Max streak from user_streaks
  SELECT COALESCE(us.max_streak, 0) INTO v_max_streak
  FROM user_streaks us WHERE us.user_id = p_user_id;
  IF NOT FOUND THEN v_max_streak := 0; END IF;
  IF v_streak > v_max_streak THEN v_max_streak := v_streak; END IF;

  -- Position in total leaderboard
  SELECT COALESCE(pos, 0)::int INTO v_position
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY points DESC) AS pos
    FROM (
      SELECT
        tc.user_id,
        COUNT(tc.id)::int + COUNT(DISTINCT CASE
          WHEN (SELECT COUNT(*) FROM task_checks tc2 JOIN tasks t3 ON t3.id = tc2.task_id AND t3.is_active = true WHERE tc2.day_id = tc.day_id AND tc2.user_id = tc.user_id)
             = (SELECT COUNT(*) FROM tasks t4 WHERE t4.day_id = tc.day_id AND t4.is_active = true)
          AND (SELECT COUNT(*) FROM tasks t5 WHERE t5.day_id = tc.day_id AND t5.is_active = true) > 0
          THEN tc.day_id
        END)::int AS points
      FROM task_checks tc
      JOIN tasks t ON t.id = tc.task_id AND t.is_active = true
      JOIN days d ON d.id = tc.day_id
      JOIN weeks w ON w.id = d.week_id
      JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
      GROUP BY tc.user_id
    ) scores
  ) ranked
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN v_position := 0; END IF;

  RETURN json_build_object(
    'today_points', v_today_points,
    'month_points', v_month_points,
    'total_points', v_total_points,
    'today_pct', CASE WHEN v_today_max > 0 THEN ROUND((v_today_points::numeric / v_today_max) * 100) ELSE 0 END,
    'month_pct', CASE WHEN v_month_max > 0 THEN ROUND((v_month_points::numeric / v_month_max) * 100) ELSE 0 END,
    'total_pct', CASE WHEN v_total_max > 0 THEN ROUND((v_total_points::numeric / v_total_max) * 100) ELSE 0 END,
    'streak', v_streak,
    'max_streak', v_max_streak,
    'position', v_position
  );
END;
$function$;
