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
      const { data, error } = await supabase.from("months").select("*").eq("program_id", programId!);
      if (error) throw error;
      return (data ?? []).sort((a: any, b: any) => {
        const orderA = (a.year ?? 0) * 100 + a.number;
        const orderB = (b.year ?? 0) * 100 + b.number;
        return orderA - orderB;
      });
    },
    enabled: !!programId,
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

export async function uploadFile(bucket: string, file: File, path?: string) {
  const filePath = path || `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}
