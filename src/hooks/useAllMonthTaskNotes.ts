import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DiaryMonthTaskNote {
  id: string;
  note: string;
  updated_at: string;
  month_id: string;
  month_task_id: string;
  task_title: string;
  task_sort_order: number;
}

/**
 * Fetches ALL month_task_notes for the current user (non-empty),
 * joined with month_tasks to get title + sort_order.
 * Used by the "Notas de tareas" tab in Cuaderno / Mi Diario.
 */
export function useAllMonthTaskNotes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["diary-month-task-notes", user?.id],
    queryFn: async (): Promise<DiaryMonthTaskNote[]> => {
      const { data, error } = await supabase
        .from("month_task_notes")
        .select("id, note, updated_at, month_id, month_task_id, month_tasks(title, sort_order)")
        .eq("user_id", user!.id)
        .neq("note", "")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        id: row.id,
        note: row.note,
        updated_at: row.updated_at,
        month_id: row.month_id,
        month_task_id: row.month_task_id,
        task_title: row.month_tasks?.title ?? "",
        task_sort_order: row.month_tasks?.sort_order ?? 0,
      }));
    },
    enabled: !!user,
  });
}
