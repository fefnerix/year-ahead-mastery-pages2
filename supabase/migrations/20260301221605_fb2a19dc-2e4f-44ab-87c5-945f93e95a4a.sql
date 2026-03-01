
-- Replace get_my_ranking_summary to read from month_task_checks (monthly checklist)
CREATE OR REPLACE FUNCTION public.get_my_ranking_summary(p_user_id uuid, p_program_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today date;
  v_current_month_id uuid;
  v_month_points int := 0;
  v_month_total int := 0;
  v_total_points int := 0;
  v_total_total int := 0;
  v_streak int := 0;
  v_max_streak int := 0;
  v_position int := 0;
BEGIN
  v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;

  -- Find current month
  SELECT m.id INTO v_current_month_id
  FROM months m
  WHERE m.program_id = p_program_id
    AND m.number = EXTRACT(MONTH FROM v_today)::int
    AND m.year = EXTRACT(YEAR FROM v_today)::int
  LIMIT 1;

  -- Month points: count checked month_task_checks for current month
  IF v_current_month_id IS NOT NULL THEN
    SELECT COUNT(*)::int INTO v_month_points
    FROM month_task_checks mtc
    JOIN month_tasks mt ON mt.id = mtc.month_task_id AND mt.is_active = true
    WHERE mtc.user_id = p_user_id
      AND mtc.month_id = v_current_month_id
      AND mtc.checked = true;

    SELECT COUNT(*)::int INTO v_month_total
    FROM month_tasks mt
    WHERE mt.month_id = v_current_month_id AND mt.is_active = true;
  END IF;

  -- Total points: across all months in program
  SELECT COUNT(*)::int INTO v_total_points
  FROM month_task_checks mtc
  JOIN month_tasks mt ON mt.id = mtc.month_task_id AND mt.is_active = true
  JOIN months m ON m.id = mtc.month_id AND m.program_id = p_program_id
  WHERE mtc.user_id = p_user_id
    AND mtc.checked = true;

  SELECT COUNT(*)::int INTO v_total_total
  FROM month_tasks mt
  JOIN months m ON m.id = mt.month_id AND m.program_id = p_program_id
  WHERE mt.is_active = true;

  -- Streak from user_streaks
  SELECT COALESCE(us.current_streak, 0), COALESCE(us.max_streak, 0)
  INTO v_streak, v_max_streak
  FROM user_streaks us WHERE us.user_id = p_user_id;
  IF NOT FOUND THEN v_streak := 0; v_max_streak := 0; END IF;

  -- Position (by total points across program)
  SELECT COALESCE(pos, 0)::int INTO v_position
  FROM (
    SELECT sub.user_id, ROW_NUMBER() OVER (ORDER BY sub.pts DESC) AS pos
    FROM (
      SELECT mtc.user_id, COUNT(*)::int AS pts
      FROM month_task_checks mtc
      JOIN month_tasks mt ON mt.id = mtc.month_task_id AND mt.is_active = true
      JOIN months m ON m.id = mtc.month_id AND m.program_id = p_program_id
      WHERE mtc.checked = true
      GROUP BY mtc.user_id
    ) sub
  ) ranked WHERE user_id = p_user_id;
  IF NOT FOUND THEN v_position := 0; END IF;

  RETURN json_build_object(
    'month_points', v_month_points,
    'month_total', v_month_total,
    'total_points', v_total_points,
    'total_total', v_total_total,
    'month_pct', CASE WHEN v_month_total > 0 THEN ROUND((v_month_points::numeric / v_month_total) * 100) ELSE 0 END,
    'total_pct', CASE WHEN v_total_total > 0 THEN ROUND((v_total_points::numeric / v_total_total) * 100) ELSE 0 END,
    'streak', v_streak,
    'max_streak', v_max_streak,
    'position', v_position
  );
END;
$$;

-- Replace get_leaderboard_v2 to read from month_task_checks
CREATE OR REPLACE FUNCTION public.get_leaderboard_v2(p_scope text, p_program_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result json;
  v_today date;
  v_current_month_id uuid;
BEGIN
  v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;

  IF p_scope = 'month' THEN
    SELECT m.id INTO v_current_month_id
    FROM months m
    WHERE m.program_id = p_program_id
      AND m.number = EXTRACT(MONTH FROM v_today)::int
      AND m.year = EXTRACT(YEAR FROM v_today)::int
    LIMIT 1;
  END IF;

  SELECT json_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT
      sub.user_id,
      COALESCE(p.display_name, 'Anónimo') AS display_name,
      p.avatar_url,
      sub.points,
      0 AS days_completed,
      COALESCE(us.current_streak, 0) AS streak,
      sub.last_check_at,
      ROW_NUMBER() OVER (
        ORDER BY sub.points DESC, COALESCE(us.current_streak, 0) DESC, sub.last_check_at ASC
      ) AS position
    FROM (
      SELECT mtc.user_id,
        COUNT(*)::int AS points,
        MAX(mtc.checked_at) AS last_check_at
      FROM month_task_checks mtc
      JOIN month_tasks mt ON mt.id = mtc.month_task_id AND mt.is_active = true
      JOIN months m ON m.id = mtc.month_id AND m.program_id = p_program_id
      WHERE mtc.checked = true
        AND CASE
          WHEN p_scope = 'month' THEN mtc.month_id = v_current_month_id
          ELSE true
        END
      GROUP BY mtc.user_id
    ) sub
    LEFT JOIN profiles p ON p.user_id = sub.user_id
    LEFT JOIN user_streaks us ON us.user_id = sub.user_id
    ORDER BY sub.points DESC, COALESCE(us.current_streak, 0) DESC, sub.last_check_at ASC
    LIMIT 20
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;
