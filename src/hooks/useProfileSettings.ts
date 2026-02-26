import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ProfileSettings {
  id: string;
  user_id: string;
  daily_reminder: boolean;
  reminder_time: string;
  show_in_ranking: boolean;
}

export function useProfileSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile-settings", user?.id],
    queryFn: async (): Promise<ProfileSettings> => {
      const { data, error } = await supabase
        .from("profile_settings" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // Create default settings
        const { data: created, error: insertErr } = await supabase
          .from("profile_settings" as any)
          .insert({ user_id: user!.id })
          .select()
          .single();
        if (insertErr) throw insertErr;
        return created as unknown as ProfileSettings;
      }
      return data as unknown as ProfileSettings;
    },
    enabled: !!user,
  });
}

export function useUpdateProfileSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Pick<ProfileSettings, "daily_reminder" | "reminder_time" | "show_in_ranking">>) => {
      const { error } = await supabase
        .from("profile_settings" as any)
        .update(updates)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile-settings"] }),
  });
}
