import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const TOTAL_TASKS_PER_DAY = 5;

const getTodaySP = (): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

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
      const todaySP = getTodaySP();

      // 1) Semana ativa
      const { data: activeWeek, error: weekErr } = await supabase
        .from("weeks")
        .select("id, name")
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (weekErr) throw weekErr;
      if (!activeWeek) return null;

      // 2) Ultimo dia desbloqueado ANTES de hoje
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

      // 3) Tasks e checks
      const [{ data: tasks }, { data: checks }] = await Promise.all([
        supabase.from("tasks").select("id").eq("day_id", day.id),
        supabase
          .from("task_checks")
          .select("id")
          .eq("day_id", day.id)
          .eq("user_id", user!.id),
      ]);

      const total = tasks?.length ?? 0;
      const completed = checks?.length ?? 0;

      // Ocultar se completo (regra 5/5) ou sem tasks
      if (completed >= TOTAL_TASKS_PER_DAY) return null;
      if (total === 0) return null;

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
