import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

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
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split("T")[0];

      // Find yesterday's day
      const { data: day, error: dayErr } = await supabase
        .from("days")
        .select("id, number, week_id")
        .eq("date", dateStr)
        .maybeSingle();

      if (dayErr) throw dayErr;
      if (!day) return null;

      // Get week name
      const { data: week } = await supabase
        .from("weeks")
        .select("name")
        .eq("id", day.week_id)
        .single();

      // Count tasks and checks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("day_id", day.id);

      const { data: checks } = await supabase
        .from("task_checks")
        .select("id")
        .eq("day_id", day.id)
        .eq("user_id", user!.id);

      const total = tasks?.length ?? 0;
      const completed = checks?.length ?? 0;

      // If already complete, don't show
      if (total > 0 && completed >= total) return null;
      // If no tasks, don't show
      if (total === 0) return null;

      return {
        day_id: day.id,
        day_number: day.number,
        week_id: day.week_id,
        week_name: week?.name ?? "",
        completed_count: completed,
        total_count: total,
      };
    },
    enabled: !!user,
  });
}
