import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface DayWithProgress {
  id: string;
  number: number;
  date: string;
  unlock_date: string;
  tasks_total: number;
  tasks_completed: number;
  is_unlocked: boolean;
  is_today: boolean;
}

interface RetoData {
  week: {
    id: string;
    name: string;
    number: number;
    objective: string | null;
    cover_url: string | null;
    audio_url: string | null;
    schedule_image_url: string | null;
    schedule_pdf_url: string | null;
  };
  days: DayWithProgress[];
  weekProgress: number;
}

export function useRetoData(weekId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reto", weekId, user?.id],
    queryFn: async (): Promise<RetoData> => {
      // Fetch week
      const { data: week, error: weekError } = await supabase
        .from("weeks")
        .select("id, name, number, objective, cover_url, audio_url, schedule_image_url, schedule_pdf_url")
        .eq("id", weekId!)
        .single();

      if (weekError) throw weekError;

      // Fetch days
      const { data: days, error: daysError } = await supabase
        .from("days")
        .select("id, number, date, unlock_date")
        .eq("week_id", weekId!)
        .order("number");

      if (daysError) throw daysError;

      const today = new Date().toISOString().split("T")[0];

      // For each day, count tasks and checks
      const daysWithProgress: DayWithProgress[] = await Promise.all(
        (days ?? []).map(async (day) => {
          const { data: tasks } = await supabase
            .from("tasks")
            .select("id")
            .eq("day_id", day.id);

          const { data: checks } = await supabase
            .from("task_checks")
            .select("id")
            .eq("day_id", day.id)
            .eq("user_id", user!.id);

          return {
            ...day,
            tasks_total: tasks?.length ?? 0,
            tasks_completed: checks?.length ?? 0,
            is_unlocked: day.unlock_date <= today,
            is_today: day.date === today,
          };
        })
      );

      const totalTasks = daysWithProgress.reduce((s, d) => s + d.tasks_total, 0);
      const totalCompleted = daysWithProgress.reduce((s, d) => s + d.tasks_completed, 0);
      const weekProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

      return { week, days: daysWithProgress, weekProgress };
    },
    enabled: !!weekId && !!user,
  });
}

export function useCurrentWeekId() {
  return useQuery({
    queryKey: ["current-week-id"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("days")
        .select("week_id")
        .lte("date", today)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.week_id ?? null;
    },
  });
}
