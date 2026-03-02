import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface MonthTask {
  id: string;
  month_id: string | null;
  sort_order: number;
  title: string;
  description: string | null;
  type: string | null;
  image_url: string | null;
  audio_url: string | null;
  video_url: string | null;
  file_url: string | null;
  is_active: boolean;
}

export interface MonthTaskCheck {
  id: string;
  month_task_id: string;
  checked: boolean;
  checked_at: string;
}

/* ── User-facing hooks ── */

/** Active tasks for a specific month */
export function useMonthTasks(monthId: string | null | undefined) {
  return useQuery({
    queryKey: ["month-tasks", monthId],
    queryFn: async (): Promise<MonthTask[]> => {
      const { data, error } = await supabase
        .from("month_tasks")
        .select("id, month_id, sort_order, title, description, type, image_url, audio_url, video_url, file_url, is_active")
        .eq("month_id", monthId!)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MonthTask[];
    },
    enabled: !!monthId,
    staleTime: 1000 * 60 * 5, // 5 min — tasks rarely change
  });
}

export function useMonthTaskChecks(monthId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["month-task-checks", monthId, user?.id],
    queryFn: async (): Promise<MonthTaskCheck[]> => {
      const { data, error } = await supabase
        .from("month_task_checks")
        .select("id, month_task_id, checked, checked_at")
        .eq("month_id", monthId!)
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as MonthTaskCheck[];
    },
    enabled: !!monthId && !!user,
    staleTime: 1000 * 30, // 30s — changes on toggle but optimistic update covers it
  });
}

export function useToggleMonthTaskCheck(monthId: string | null | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ monthTaskId, currentlyChecked, checkId }: { monthTaskId: string; currentlyChecked: boolean; checkId?: string }) => {
      if (currentlyChecked && checkId) {
        const { error } = await supabase.from("month_task_checks").delete().eq("id", checkId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("month_task_checks").insert({
          user_id: user!.id,
          month_id: monthId!,
          month_task_id: monthTaskId,
        });
        if (error && error.code !== "23505") throw error;
      }
    },
    onMutate: async ({ monthTaskId, currentlyChecked }) => {
      const key = ["month-task-checks", monthId, user?.id];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<MonthTaskCheck[]>(key);
      qc.setQueryData<MonthTaskCheck[]>(key, (old = []) => {
        if (currentlyChecked) return old.filter((c) => c.month_task_id !== monthTaskId);
        return [...old, { id: "optimistic", month_task_id: monthTaskId, checked: true, checked_at: new Date().toISOString() }];
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(["month-task-checks", monthId, user?.id], ctx?.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["month-task-checks", monthId] });
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["ranking-summary"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

/* ── Admin hooks ── */

/** All tasks (active + inactive) for a specific month */
export function useAdminMonthTasks(monthId: string | null | undefined) {
  return useQuery({
    queryKey: ["admin-month-tasks", monthId],
    queryFn: async (): Promise<MonthTask[]> => {
      const { data, error } = await supabase
        .from("month_tasks")
        .select("*")
        .eq("month_id", monthId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MonthTask[];
    },
    enabled: !!monthId,
  });
}

export function useUpsertMonthTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<MonthTask> & { id?: string }) => {
      if (task.id) {
        const { error } = await supabase.from("month_tasks").update(task as any).eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("month_tasks").insert(task as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-month-tasks"] });
      qc.invalidateQueries({ queryKey: ["month-tasks"] });
    },
  });
}

/** Seed default 17 tasks for a month if none exist */
export function useSeedMonthTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (monthId: string) => {
      // Check if already has tasks
      const { count } = await supabase
        .from("month_tasks")
        .select("id", { count: "exact", head: true })
        .eq("month_id", monthId);
      if ((count ?? 0) > 0) return;

      const defaultTasks = [
        "Leer libro del mes",
        "Leer evangelio del mes",
        "Orar diariamente (Padre Nuestro)",
        "Asistir a 1 día de congregación",
        "Ahorrar $100 dólares",
        "Cumplir presupuesto 70-20-10",
        "Registrar todos los gastos",
        "Aplicar plan bola de nieve con munición extra",
        "Entrenar pesas 2 veces por semana",
        "Cumplir plan de alimentación del nutricionista",
        "Consumir dulce máximo 4 veces en el mes",
        "Resolver ejercicios prácticos del mes",
        "Avanzar en proyecto personal",
        "Alimentar círculos de influencia",
        "Asistir a sesión virtual con Coach",
        "Asistir a sesión virtual con Jhonny Romero",
        "Completar hoja de cierre y reflexión del mes",
      ];

      const rows = defaultTasks.map((title, i) => ({
        month_id: monthId,
        sort_order: i + 1,
        title,
        is_active: true,
      }));

      const { error } = await supabase.from("month_tasks").insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-month-tasks"] });
      qc.invalidateQueries({ queryKey: ["month-tasks"] });
    },
  });
}
