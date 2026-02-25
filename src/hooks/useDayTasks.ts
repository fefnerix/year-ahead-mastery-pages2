import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TaskWithCheck {
  id: string;
  title: string;
  category: "cuerpo" | "mente" | "alma" | "finanzas";
  completed: boolean;
  check_id?: string;
  order: number;
  task_kind: "prayer" | "activity";
  description?: string | null;
}

export function useDayTasks(dayId: string | null | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["day-tasks", dayId, user?.id],
    queryFn: async (): Promise<TaskWithCheck[]> => {
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, category, order, task_kind, description, is_active")
        .eq("day_id", dayId!)
        .order("order");
      if (tasksError) throw tasksError;

      // Filter active tasks client-side (is_active may not exist in types yet)
      const activeTasks = (tasks ?? []).filter((t: any) => t.is_active !== false);

      const { data: checks, error: checksError } = await supabase
        .from("task_checks")
        .select("id, task_id")
        .eq("day_id", dayId!)
        .eq("user_id", user!.id);
      if (checksError) throw checksError;

      const checkMap = new Map(checks?.map((c) => [c.task_id, c.id]) ?? []);

      return activeTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        completed: checkMap.has(t.id),
        check_id: checkMap.get(t.id),
        order: t.order,
        task_kind: t.task_kind ?? "activity",
        description: t.description ?? null,
      }));
    },
    enabled: !!dayId && !!user,
  });
}

export function useToggleDayTask(dayId: string | null | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: TaskWithCheck) => {
      if (task.completed && task.check_id) {
        const { error } = await supabase.from("task_checks").delete().eq("id", task.check_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("task_checks").insert({
          user_id: user!.id,
          task_id: task.id,
          day_id: dayId!,
        });
        if (error) throw error;
      }
    },
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: ["day-tasks", dayId, user?.id] });
      const previous = queryClient.getQueryData<TaskWithCheck[]>(["day-tasks", dayId, user?.id]);
      queryClient.setQueryData<TaskWithCheck[]>(
        ["day-tasks", dayId, user?.id],
        (old) => old?.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)) ?? []
      );
      return { previous };
    },
    onError: (_err, _task, context) => {
      queryClient.setQueryData(["day-tasks", dayId, user?.id], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["day-tasks", dayId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["reto"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["today-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["month_calendar"] });
      queryClient.invalidateQueries({ queryKey: ["year_calendar"] });
    },
  });
}
