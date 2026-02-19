import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface TaskWithCheck {
  id: string;
  title: string;
  category: "cuerpo" | "mente" | "alma" | "finanzas";
  completed: boolean;
  check_id?: string;
  order: number;
}

interface ProgressData {
  day_id: string | null;
  day_pct: number;
  week_pct: number;
  month_pct: number;
  year_pct: number;
  day_number: number;
  week_name: string;
  month_theme: string;
}

interface StreakData {
  current_streak: number;
  max_streak: number;
}

export function useProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["progress", user?.id],
    queryFn: async (): Promise<ProgressData> => {
      const { data, error } = await supabase.rpc("get_user_progress", {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return data as unknown as ProgressData;
    },
    enabled: !!user,
  });
}

export function useTodayTasks(dayId: string | null | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["today-tasks", dayId, user?.id],
    queryFn: async (): Promise<TaskWithCheck[]> => {
      // Get tasks for the day
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, category, order")
        .eq("day_id", dayId!)
        .order("order");

      if (tasksError) throw tasksError;

      // Get user's checks for this day
      const { data: checks, error: checksError } = await supabase
        .from("task_checks")
        .select("id, task_id")
        .eq("day_id", dayId!)
        .eq("user_id", user!.id);

      if (checksError) throw checksError;

      const checkMap = new Map(checks?.map((c) => [c.task_id, c.id]) ?? []);

      return (tasks ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        completed: checkMap.has(t.id),
        check_id: checkMap.get(t.id),
        order: t.order,
      }));
    },
    enabled: !!dayId && !!user,
  });
}

export function useToggleTask(dayId: string | null | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: TaskWithCheck) => {
      if (task.completed && task.check_id) {
        // Uncheck: delete the record
        const { error } = await supabase
          .from("task_checks")
          .delete()
          .eq("id", task.check_id);
        if (error) throw error;
      } else {
        // Check: insert a new record
        const { error } = await supabase.from("task_checks").insert({
          user_id: user!.id,
          task_id: task.id,
          day_id: dayId!,
        });
        if (error) throw error;
      }
    },
    onMutate: async (task) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["today-tasks", dayId, user?.id] });
      const previous = queryClient.getQueryData<TaskWithCheck[]>(["today-tasks", dayId, user?.id]);

      queryClient.setQueryData<TaskWithCheck[]>(
        ["today-tasks", dayId, user?.id],
        (old) =>
          old?.map((t) =>
            t.id === task.id ? { ...t, completed: !t.completed } : t
          ) ?? []
      );

      return { previous };
    },
    onError: (_err, _task, context) => {
      queryClient.setQueryData(["today-tasks", dayId, user?.id], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["today-tasks", dayId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["progress", user?.id] });
    },
  });
}

export function useStreak() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["streak", user?.id],
    queryFn: async (): Promise<StreakData> => {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("current_streak, max_streak")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data ?? { current_streak: 0, max_streak: 0 };
    },
    enabled: !!user,
  });
}

export function useUpdateStreak() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("update_user_streak", {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return data as unknown as StreakData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streak", user?.id] });
    },
  });
}
