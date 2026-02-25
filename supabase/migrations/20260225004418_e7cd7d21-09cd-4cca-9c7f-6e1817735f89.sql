
CREATE OR REPLACE FUNCTION public.get_month_calendar(p_user_id uuid, p_month_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
      LEAST(
        COALESCE(ROUND((COUNT(tc.id)::numeric / 5) * 100), 0),
        100
      )::int AS day_pct,
      CASE
        WHEN d.date > v_today THEN 'future'
        WHEN COUNT(tc.id) >= 5 THEN 'complete'
        WHEN COUNT(tc.id) > 0 THEN 'partial'
        ELSE 'pending'
      END AS status
    FROM days d
    JOIN weeks w ON w.id = d.week_id AND w.month_id = p_month_id
    LEFT JOIN tasks t ON t.day_id = d.id
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    GROUP BY d.id, d.date, d.week_id, d.number, w.name, w.number
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;
