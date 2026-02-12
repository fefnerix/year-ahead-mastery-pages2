import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user,
  });
}

export function usePrograms() {
  return useQuery({
    queryKey: ["admin-programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("programs").select("*").order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMonths(programId: string | null) {
  return useQuery({
    queryKey: ["admin-months", programId],
    queryFn: async () => {
      const { data, error } = await supabase.from("months").select("*").eq("program_id", programId!).order("number");
      if (error) throw error;
      return data;
    },
    enabled: !!programId,
  });
}

export function useWeeks(monthId: string | null) {
  return useQuery({
    queryKey: ["admin-weeks", monthId],
    queryFn: async () => {
      const { data, error } = await supabase.from("weeks").select("*").eq("month_id", monthId!).order("number");
      if (error) throw error;
      return data;
    },
    enabled: !!monthId,
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { name: string; year: number; start_date: string; end_date: string }) => {
      const { data, error } = await supabase.from("programs").insert(p).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-programs"] }),
  });
}

export function useCreateMonth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: { name: string; number: number; program_id: string; theme?: string }) => {
      const { data, error } = await supabase.from("months").insert(m).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-months"] }),
  });
}

export function useCreateWeekWithDays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      number: number;
      month_id: string;
      objective?: string;
      cover_url?: string;
      audio_url?: string;
      schedule_image_url?: string;
      schedule_pdf_url?: string;
      start_date: string;
      description_long?: string;
      spiritual_playlist_url?: string;
      mental_playlist_url?: string;
    }) => {
      const { start_date, ...weekData } = input;

      // Create week
      const { data: week, error: weekError } = await supabase.from("weeks").insert(weekData).select().single();
      if (weekError) throw weekError;

      // Create 7 days
      const categories: Array<"cuerpo" | "mente" | "alma" | "finanzas"> = ["cuerpo", "mente", "alma", "finanzas"];
      const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

      for (let i = 0; i < 7; i++) {
        const date = new Date(start_date);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        const { data: day, error: dayError } = await supabase
          .from("days")
          .insert({
            week_id: week.id,
            number: i + 1,
            date: dateStr,
            unlock_date: dateStr,
          })
          .select()
          .single();
        if (dayError) throw dayError;

        // Create 5 tasks per day
        const tasks = Array.from({ length: 5 }, (_, j) => ({
          day_id: day.id,
          title: `Momento ${j + 1}`,
          category: categories[j % categories.length],
          order: j + 1,
        }));

        const { error: tasksError } = await supabase.from("tasks").insert(tasks);
        if (tasksError) throw tasksError;
      }

      return week;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-weeks"] });
    },
  });
}

export async function uploadFile(bucket: string, file: File, path?: string) {
  const filePath = path || `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}
