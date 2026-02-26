-- Fix existing months: one should be month 2 (Febrero), fix the duplicate
-- First, update the Marzo month to have number=3
UPDATE months SET number = 3, name = 'Marzo' WHERE id = '8a6537d5-177b-474e-9d77-e01e9d97ee11';

-- Create seed function for program months
CREATE OR REPLACE FUNCTION public.seed_program_months(p_program_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month_numbers int[] := ARRAY[3,4,5,6,7,8,9,10,11,12,1,2];
  v_month_names text[] := ARRAY[
    'Marzo','Abril','Mayo','Junio','Julio','Agosto',
    'Septiembre','Octubre','Noviembre','Diciembre','Enero','Febrero'
  ];
  i int;
  v_existing int;
BEGIN
  FOR i IN 1..12 LOOP
    -- Check if month with this number already exists for this program
    SELECT COUNT(*) INTO v_existing
    FROM months
    WHERE program_id = p_program_id AND number = v_month_numbers[i];
    
    IF v_existing = 0 THEN
      INSERT INTO months (program_id, number, name)
      VALUES (p_program_id, v_month_numbers[i], v_month_names[i]);
    END IF;
  END LOOP;
END;
$$;

-- Seed the existing program
SELECT seed_program_months('a0000000-0000-0000-0000-000000000001');

-- Update get_year_calendar to order in cycle order (Mar..Feb)
CREATE OR REPLACE FUNCTION public.get_year_calendar(p_user_id uuid, p_year integer)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(row_to_json(r) ORDER BY r.cycle_order) INTO v_result
  FROM (
    SELECT
      m.id AS month_id,
      m.number AS month_number,
      m.name AS month_name,
      COALESCE(m.theme, '') AS month_theme,
      COALESCE(
        ROUND((COUNT(tc.id)::numeric / NULLIF(COUNT(t.id), 0)) * 100),
        0
      )::int AS month_pct,
      CASE WHEN m.number >= 3 THEN m.number - 3 ELSE m.number + 9 END AS cycle_order
    FROM months m
    JOIN programs pr ON pr.id = m.program_id AND pr.year = p_year
    LEFT JOIN weeks w ON w.month_id = m.id
    LEFT JOIN days d ON d.week_id = w.id
    LEFT JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    GROUP BY m.id, m.number, m.name, m.theme
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;
