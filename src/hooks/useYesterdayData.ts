import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getTodayBRT } from "@/lib/dates";

interface YesterdayData {
  day_id: string;
  day_number: number;
  week_id: string;
  week_name: string;
  completed_count: number;
  total_count: number;
}

export function useYesterdayProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["yesterday-progress", user?.id],
    queryFn: async (): Promise<YesterdayData | null> => {
      const todaySP = getTodayBRT();

      const { data: activeWeek, error: weekErr } = await supabase
        .from("weeks")
        .select("id, name")
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (weekErr) throw weekErr;
      if (!activeWeek) return null;

      const { data: day, error: dayErr } = await supabase
        .from("days")
        .select("id, number, week_id")
        .eq("week_id", activeWeek.id)
        .lt("unlock_date", todaySP)
        .order("number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dayErr) throw dayErr;
      if (!day) return null;

      const [{ data: tasks }, { data: checks }] = await Promise.all([
        supabase.from("tasks").select("id").eq("day_id", day.id).eq("is_active", true),
        supabase
          .from("task_checks")
          .select("id")
          .eq("day_id", day.id)
          .eq("user_id", user!.id),
      ]);

      const total = tasks?.length ?? 0;
      const completed = checks?.length ?? 0;

      if (total === 0 || completed >= total) return null;

      return {
        day_id: day.id,
        day_number: day.number,
        week_id: day.week_id,
        week_name: activeWeek.name ?? "",
        completed_count: completed,
        total_count: total,
      };
    },
    enabled: !!user,
  });
}
