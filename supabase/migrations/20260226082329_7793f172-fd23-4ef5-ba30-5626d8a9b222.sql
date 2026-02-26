
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
    SELECT sub.user_id,
      COALESCE(p.display_name, 'Anónimo') AS display_name,
      p.avatar_url,
      sub.points,
      sub.days_completed,
      COALESCE(us.current_streak, 0) AS streak,
      sub.last_check_at,
      ROW_NUMBER() OVER (
        ORDER BY sub.points DESC, COALESCE(us.current_streak, 0) DESC, sub.last_check_at ASC
      ) AS position
    FROM (
      SELECT tc.user_id,
        COUNT(DISTINCT tc.task_id)::int AS points,
        COUNT(DISTINCT CASE
          WHEN day_done.done_tasks >= 2 THEN tc.day_id END)::int AS days_completed,
        MAX(tc.checked_at) AS last_check_at
      FROM task_checks tc
      JOIN tasks t ON t.id = tc.task_id AND t.is_active = true
      JOIN days d ON d.id = tc.day_id
      JOIN weeks w ON w.id = d.week_id
      JOIN months m ON m.id = w.month_id AND m.program_id = p_program_id
      LEFT JOIN LATERAL (
        SELECT COUNT(DISTINCT tc2.task_id)::int AS done_tasks
        FROM task_checks tc2
        JOIN tasks t3 ON t3.id = tc2.task_id AND t3.is_active = true
        WHERE tc2.day_id = tc.day_id AND tc2.user_id = tc.user_id
      ) day_done ON true
      WHERE CASE
        WHEN p_scope = 'day' THEN d.date = v_today
        WHEN p_scope = 'month' THEN m.id = v_current_month_id
        ELSE true
      END
      GROUP BY tc.user_id
    ) sub
    LEFT JOIN profiles p ON p.user_id = sub.user_id
    LEFT JOIN user_streaks us ON us.user_id = sub.user_id
    ORDER BY sub.points DESC, COALESCE(us.current_streak, 0) DESC, sub.last_check_at ASC
    LIMIT 20
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;
