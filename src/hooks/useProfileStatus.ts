import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ProfileStatus {
  id: string;
  user_id: string;
  cierre_2025: string;
  ingresos_actuales: string;
  gastos_actuales: string;
  ahorro_actual: string;
  deuda_total: string;
  pagos_minimos: string;
  inversion_en_uno: string;
  libros_leidos: string;
}

export function useProfileStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile_status", user?.id],
    queryFn: async (): Promise<ProfileStatus | null> => {
      const { data, error } = await supabase
        .from("profile_status")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ProfileStatus | null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 min — rarely changes
  });
}

export function useUpsertProfileStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fields: Partial<Omit<ProfileStatus, "id" | "user_id">>) => {
      // Try update first
      const { data: existing } = await supabase
        .from("profile_status")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("profile_status")
          .update(fields)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profile_status")
          .insert({ user_id: user!.id, ...fields });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile_status"] }),
  });
}
