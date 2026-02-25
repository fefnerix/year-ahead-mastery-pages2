import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useJournalEntry = (date: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["journal_entry", user?.id, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries" as any)
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", date!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!user && !!date,
  });
};

export const useSaveJournal = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      date,
      content,
      dayId,
      weekId,
      monthId,
    }: {
      date: string;
      content: string;
      dayId?: string;
      weekId?: string;
      monthId?: string;
    }) => {
      const payload: any = {
        user_id: user!.id,
        date,
        content,
        day_id: dayId ?? null,
        week_id: weekId ?? null,
        month_id: monthId ?? null,
      };

      const { data, error } = await supabase
        .from("journal_entries" as any)
        .upsert(payload, { onConflict: "user_id,date" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["journal_entry", user?.id, vars.date] });
      qc.invalidateQueries({ queryKey: ["journal_list"] });
    },
  });
};

export const useAllJournalEntries = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["journal_list", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries" as any)
        .select("*, days(number, date, week_id, weeks(name, number, month_id, months(name, number)))")
        .eq("user_id", user!.id)
        .neq("content", "")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
};
