import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface MonthTaskNote {
  id: string;
  user_id: string;
  month_id: string;
  month_task_id: string;
  note: string;
  updated_at: string;
}

/** All notes for current user in a given month */
export function useMonthTaskNotes(monthId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["month-task-notes", monthId, user?.id],
    queryFn: async (): Promise<MonthTaskNote[]> => {
      const { data, error } = await supabase
        .from("month_task_notes")
        .select("*")
        .eq("month_id", monthId!)
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as MonthTaskNote[];
    },
    enabled: !!monthId && !!user,
  });
}

export function useUpsertMonthTaskNote() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      monthId,
      monthTaskId,
      note,
    }: {
      monthId: string;
      monthTaskId: string;
      note: string;
    }) => {
      const { error } = await supabase
        .from("month_task_notes")
        .upsert(
          {
            user_id: user!.id,
            month_id: monthId,
            month_task_id: monthTaskId,
            note,
          },
          { onConflict: "user_id,month_id,month_task_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["month-task-notes", vars.monthId] });
    },
  });
}
