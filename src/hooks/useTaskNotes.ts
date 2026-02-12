import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface TaskNote {
  id: string;
  user_id: string;
  task_id: string;
  day_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useTaskNotes(dayId: string | null | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["task-notes", dayId, user?.id],
    queryFn: async (): Promise<TaskNote[]> => {
      const { data, error } = await supabase
        .from("task_notes")
        .select("*")
        .eq("day_id", dayId!)
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as unknown as TaskNote[];
    },
    enabled: !!dayId && !!user,
  });
}

export function useSaveNote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, dayId, content }: { taskId: string; dayId: string; content: string }) => {
      const { error } = await supabase
        .from("task_notes")
        .upsert(
          { user_id: user!.id, task_id: taskId, day_id: dayId, content },
          { onConflict: "user_id,task_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-notes", variables.dayId] });
      queryClient.invalidateQueries({ queryKey: ["all-notes"] });
    },
  });
}

export function useAllNotes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-notes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_notes")
        .select("*, tasks(title, category), days(number, date, week_id, weeks(name, number))")
        .eq("user_id", user!.id)
        .neq("content", "")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Array<TaskNote & {
        tasks: { title: string; category: string };
        days: { number: number; date: string; week_id: string; weeks: { name: string; number: number } };
      }>;
    },
    enabled: !!user,
  });
}
