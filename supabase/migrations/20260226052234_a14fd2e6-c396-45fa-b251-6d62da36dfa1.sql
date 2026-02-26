CREATE OR REPLACE FUNCTION public.resolve_day_id(p_week_id uuid, p_day_number int)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT d.id
  FROM public.days d
  WHERE d.week_id = p_week_id
    AND d.number = p_day_number
  LIMIT 1;
$$;