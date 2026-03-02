
CREATE OR REPLACE FUNCTION public.get_my_ranking_summary(p_user_id uuid, p_program_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_today date;
  v_current_month_id uuid;
  v_month_points int := 0;
  v_month_total int := 0;
  v_total_points int := 0;
  v_program_total int := 0;
  v_num_months int := 0;
  v_current_month_tasks int := 0;
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

  -- Count months in program
  SELECT COUNT(*)::int INTO v_num_months
  FROM months m
  WHERE m.program_id = p_program_id;

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

    v_current_month_tasks := v_month_total;
  END IF;

  -- Total points: across all months in program
  SELECT COUNT(*)::int INTO v_total_points
  FROM month_task_checks mtc
  JOIN month_tasks mt ON mt.id = mtc.month_task_id AND mt.is_active = true
  JOIN months m ON m.id = mtc.month_id AND m.program_id = p_program_id
  WHERE mtc.user_id = p_user_id
    AND mtc.checked = true;

  -- Program total: for months with tasks, use their real count; for months without, project using current month's count
  SELECT COALESCE(SUM(
    CASE WHEN sub.task_count > 0 THEN sub.task_count
         ELSE v_current_month_tasks
    END
  ), 0)::int INTO v_program_total
  FROM (
    SELECT m.id, COUNT(mt.id)::int AS task_count
    FROM months m
    LEFT JOIN month_tasks mt ON mt.month_id = m.id AND mt.is_active = true
    WHERE m.program_id = p_program_id
    GROUP BY m.id
  ) sub;

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
    'total_total', v_program_total,
    'month_pct', CASE WHEN v_month_total > 0 THEN ROUND((v_month_points::numeric / v_month_total) * 100) ELSE 0 END,
    'total_pct', CASE WHEN v_program_total > 0 THEN ROUND((v_total_points::numeric / v_program_total) * 100) ELSE 0 END,
    'streak', v_streak,
    'max_streak', v_max_streak,
    'position', v_position
  );
END;
$function$;
