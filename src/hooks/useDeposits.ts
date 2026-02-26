import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  date: string;
  note: string | null;
  created_at: string;
}

export function useDeposits() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["deposits", user?.id],
    queryFn: async (): Promise<Deposit[]> => {
      const { data, error } = await supabase
        .from("abundance_deposits")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Deposit[];
    },
    enabled: !!user,
  });
}

export function useDepositTotal() {
  const { data: deposits = [] } = useDeposits();
  return deposits.reduce((sum, d) => sum + Number(d.amount), 0);
}

export function useCreateDeposit() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { amount: number; date: string; note?: string }) => {
      const { error } = await supabase.from("abundance_deposits").insert({
        amount: input.amount,
        date: input.date,
        note: input.note ?? null,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deposits"] }),
  });
}

export function useUpdateDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; amount?: number; currency?: string; date?: string; note?: string }) => {
      const { error } = await supabase.from("abundance_deposits").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deposits"] }),
  });
}

export function useDeleteDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("abundance_deposits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deposits"] }),
  });
}
