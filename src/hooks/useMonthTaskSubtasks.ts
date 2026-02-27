import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface MonthTaskSubtask {
  id: string;
  month_task_id: string;
  sort_order: number;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SubtaskCheck {
  id: string;
  subtask_id: string;
  checked: boolean;
}

/* ── Read hooks ── */

/** Active subtasks for a single month_task */
export function useMonthTaskSubtasks(monthTaskId: string | null | undefined) {
  return useQuery({
    queryKey: ["month-task-subtasks", monthTaskId],
    queryFn: async (): Promise<MonthTaskSubtask[]> => {
      const { data, error } = await supabase
        .from("month_task_subtasks")
        .select("*")
        .eq("month_task_id", monthTaskId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MonthTaskSubtask[];
    },
    enabled: !!monthTaskId,
  });
}

/** User's subtask checks for a given month (all subtasks) */
export function useMonthSubtaskChecks(monthId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["month-subtask-checks", monthId, user?.id],
    queryFn: async (): Promise<SubtaskCheck[]> => {
      const { data, error } = await supabase
        .from("month_task_subtask_checks")
        .select("id, subtask_id, checked")
        .eq("month_id", monthId!)
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as SubtaskCheck[];
    },
    enabled: !!monthId && !!user,
  });
}

/* ── Toggle subtask check + sync parent ── */

export function useToggleSubtaskCheck(monthId: string | null | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subtaskId,
      currentlyChecked,
      checkId,
    }: {
      subtaskId: string;
      currentlyChecked: boolean;
      checkId?: string;
    }) => {
      if (currentlyChecked && checkId) {
        const { error } = await supabase
          .from("month_task_subtask_checks")
          .delete()
          .eq("id", checkId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("month_task_subtask_checks")
          .insert({
            user_id: user!.id,
            month_id: monthId!,
            subtask_id: subtaskId,
          });
        if (error && error.code !== "23505") throw error;
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["month-subtask-checks", monthId] });
    },
  });
}

/**
 * Sync parent task check based on subtask completion.
 * Call after toggling a subtask.
 */
export function useSyncParentCheck(monthId: string | null | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      monthTaskId,
      allComplete,
    }: {
      monthTaskId: string;
      allComplete: boolean;
    }) => {
      if (!user || !monthId) return;

      if (allComplete) {
        // Upsert parent check as done
        const { error } = await supabase
          .from("month_task_checks")
          .upsert(
            {
              user_id: user.id,
              month_id: monthId,
              month_task_id: monthTaskId,
              checked: true,
              checked_at: new Date().toISOString(),
            },
            { onConflict: "user_id,month_id,month_task_id" }
          );
        if (error) throw error;
      } else {
        // Remove parent check
        const { error } = await supabase
          .from("month_task_checks")
          .delete()
          .eq("user_id", user.id)
          .eq("month_id", monthId)
          .eq("month_task_id", monthTaskId);
        if (error) throw error;
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["month-task-checks", monthId] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

/* ── Admin CRUD ── */

export function useCreateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sub: { month_task_id: string; title: string; sort_order: number; description?: string | null }) => {
      const { error } = await supabase.from("month_task_subtasks").insert(sub as any);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["month-task-subtasks", vars.month_task_id] });
    },
  });
}

export function useUpdateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, monthTaskId, ...fields }: { id: string; monthTaskId: string } & Partial<MonthTaskSubtask>) => {
      const { error } = await supabase.from("month_task_subtasks").update(fields as any).eq("id", id);
      if (error) throw error;
      return monthTaskId;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["month-task-subtasks", vars.monthTaskId] });
    },
  });
}

export function useDeleteSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, monthTaskId }: { id: string; monthTaskId: string }) => {
      const { error } = await supabase.from("month_task_subtasks").delete().eq("id", id);
      if (error) throw error;
      return monthTaskId;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["month-task-subtasks", vars.monthTaskId] });
    },
  });
}
