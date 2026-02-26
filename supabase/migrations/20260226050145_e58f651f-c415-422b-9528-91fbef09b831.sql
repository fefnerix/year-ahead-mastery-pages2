
-- Fix calculate_user_score: add is_active = true filter to tasks
CREATE OR REPLACE FUNCTION public.calculate_user_score(p_user_id uuid, p_period_type period_type, p_period_key text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_score integer := 0;
  v_days_completed integer := 0;
  v_weeks_completed integer := 0;
  v_task_count integer;
  v_check_count integer;
  rec record;
BEGIN
  -- Determine which days fall in this period
  FOR rec IN
    SELECT d.id as day_id, d.week_id, d.date
    FROM days d
    JOIN weeks w ON w.id = d.week_id
    JOIN months m ON m.id = w.month_id
    WHERE
      CASE
        WHEN p_period_type = 'week' THEN 'W' || to_char(d.date, 'IYYY-IW') = p_period_key
                                          OR to_char(d.date, 'IYYY') || '-W' || to_char(d.date, 'IW') = p_period_key
        WHEN p_period_type = 'month' THEN to_char(d.date, 'YYYY-MM') = p_period_key
        WHEN p_period_type = 'year' THEN to_char(d.date, 'YYYY') = p_period_key
      END
      AND d.unlock_date <= CURRENT_DATE
  LOOP
    -- Count ACTIVE tasks and checks for this day
    SELECT COUNT(t.id), COUNT(tc.id)
    INTO v_task_count, v_check_count
    FROM tasks t
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE t.day_id = rec.day_id AND t.is_active = true;

    -- 1 point per completed task
    v_score := v_score + v_check_count;

    -- +2 bonus for complete day
    IF v_task_count > 0 AND v_check_count = v_task_count THEN
      v_score := v_score + 2;
      v_days_completed := v_days_completed + 1;
    END IF;
  END LOOP;

  -- Check for complete weeks (+10 bonus each)
  FOR rec IN
    SELECT w.id as week_id, COUNT(d.id) as total_days,
      SUM(CASE WHEN (
        SELECT COUNT(tc.id) FROM tasks t2 
        LEFT JOIN task_checks tc ON tc.task_id = t2.id AND tc.user_id = p_user_id
        WHERE t2.day_id = d.id AND t2.is_active = true
      ) = (
        SELECT COUNT(t3.id) FROM tasks t3 WHERE t3.day_id = d.id AND t3.is_active = true
      ) AND (SELECT COUNT(t4.id) FROM tasks t4 WHERE t4.day_id = d.id AND t4.is_active = true) > 0
      THEN 1 ELSE 0 END) as complete_days
    FROM weeks w
    JOIN days d ON d.week_id = w.id AND d.unlock_date <= CURRENT_DATE
    JOIN months m ON m.id = w.month_id
    WHERE
      CASE
        WHEN p_period_type = 'week' THEN to_char(d.date, 'IYYY') || '-W' || to_char(d.date, 'IW') = p_period_key
        WHEN p_period_type = 'month' THEN to_char(d.date, 'YYYY-MM') = p_period_key
        WHEN p_period_type = 'year' THEN to_char(d.date, 'YYYY') = p_period_key
      END
    GROUP BY w.id
    HAVING COUNT(d.id) = 7
  LOOP
    IF rec.complete_days = 7 THEN
      v_score := v_score + 10;
      v_weeks_completed := v_weeks_completed + 1;
    END IF;
  END LOOP;

  -- Upsert score
  INSERT INTO leaderboard_scores (user_id, period_type, period_key, score, days_completed, weeks_completed, updated_at)
  VALUES (p_user_id, p_period_type, p_period_key, v_score, v_days_completed, v_weeks_completed, now())
  ON CONFLICT (user_id, period_type, period_key) DO UPDATE SET
    score = v_score,
    days_completed = v_days_completed,
    weeks_completed = v_weeks_completed,
    updated_at = now();

  RETURN json_build_object('score', v_score, 'days_completed', v_days_completed, 'weeks_completed', v_weeks_completed);
END;
$function$;

-- Fix update_user_streak: add is_active = true filter
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE := CURRENT_DATE;
  v_day_tasks INTEGER;
  v_day_checks INTEGER;
  v_max_streak INTEGER;
BEGIN
  LOOP
    SELECT COUNT(t.id), COUNT(tc.id)
    INTO v_day_tasks, v_day_checks
    FROM days d
    JOIN tasks t ON t.day_id = d.id AND t.is_active = true
    LEFT JOIN task_checks tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE d.date = v_check_date AND d.unlock_date <= CURRENT_DATE;

    EXIT WHEN v_day_tasks = 0 OR v_day_checks < v_day_tasks;

    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  INSERT INTO user_streaks (user_id, current_streak, max_streak, last_completed_date, updated_at)
  VALUES (p_user_id, v_streak, v_streak, CASE WHEN v_streak > 0 THEN CURRENT_DATE ELSE NULL END, now())
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = v_streak,
    max_streak = GREATEST(user_streaks.max_streak, v_streak),
    last_completed_date = CASE WHEN v_streak > 0 THEN CURRENT_DATE ELSE user_streaks.last_completed_date END,
    updated_at = now();

  SELECT max_streak INTO v_max_streak FROM user_streaks WHERE user_id = p_user_id;

  RETURN json_build_object('current_streak', v_streak, 'max_streak', v_max_streak);
END;
$function$;
