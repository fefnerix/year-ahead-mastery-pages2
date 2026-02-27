import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface MonthTask {
  id: string;
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

export function useMonthTasks() {
  return useQuery({
    queryKey: ["month-tasks"],
    queryFn: async (): Promise<MonthTask[]> => {
      const { data, error } = await supabase
        .from("month_tasks")
        .select("id, sort_order, title, description, type, image_url, audio_url, video_url, file_url, is_active")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MonthTask[];
    },
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
    },
  });
}

/* ── Admin hooks ── */

export function useAdminMonthTasks() {
  return useQuery({
    queryKey: ["admin-month-tasks"],
    queryFn: async (): Promise<MonthTask[]> => {
      const { data, error } = await supabase
        .from("month_tasks")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MonthTask[];
    },
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
