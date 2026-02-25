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
      const { data: week, error: weekError } = await supabase
        .from("weeks")
        .select("id, name, number, objective, cover_url, audio_url, schedule_image_url, schedule_pdf_url")
        .eq("id", weekId!)
        .single();

      if (weekError) throw weekError;

      const { data: daysData, error: daysError } = await supabase.rpc("get_week_days_progress", {
        p_user_id: user!.id,
        p_week_id: weekId!,
      });

      if (daysError) throw daysError;

      const days = (daysData as unknown as DayWithProgress[]) ?? [];

      const totalTasks = days.reduce((s, d) => s + d.tasks_total, 0);
      const totalCompleted = days.reduce((s, d) => s + d.tasks_completed, 0);
      const weekProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

      return { week, days, weekProgress };
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
