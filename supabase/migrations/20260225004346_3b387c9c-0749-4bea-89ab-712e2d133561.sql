
CREATE OR REPLACE FUNCTION public.get_year_calendar(p_user_id uuid, p_year int)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(row_to_json(r) ORDER BY r.month_number) INTO v_result
  FROM (
    SELECT
      m.id AS month_id,
      m.number AS month_number,
      m.name AS month_name,
      COALESCE(m.theme, '') AS month_theme,
      COALESCE(
        ROUND(
          (COUNT(tc.id)::numeric / NULLIF(COUNT(t.id), 0)) * 100
        ),
        0
      )::int AS month_pct
    FROM months m
    JOIN programs pr ON pr.id = m.program_id AND pr.year = p_year
    LEFT JOIN weeks w ON w.month_id = m.id
    LEFT JOIN days d ON d.week_id = w.id
    LEFT JOIN tasks t ON t.day_id = d.id
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    GROUP BY m.id, m.number, m.name, m.theme
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;
