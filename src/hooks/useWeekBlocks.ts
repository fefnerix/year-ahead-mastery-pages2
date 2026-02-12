import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WeekBlock {
  id: string;
  week_id: string;
  type: string;
  title: string | null;
  config: Record<string, any>;
  order_index: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export function useWeekBlocks(weekId: string | undefined) {
  return useQuery({
    queryKey: ["week-blocks", weekId],
    queryFn: async (): Promise<WeekBlock[]> => {
      const { data, error } = await supabase
        .from("week_blocks")
        .select("*")
        .eq("week_id", weekId!)
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as unknown as WeekBlock[];
    },
    enabled: !!weekId,
  });
}

export function useCreateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { week_id: string; type: string; title?: string; config?: Record<string, any>; order_index: number }) => {
      const { error } = await supabase.from("week_blocks").insert(input as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["week-blocks"] }),
  });
}

export function useUpdateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; config?: Record<string, any>; is_visible?: boolean; order_index?: number }) => {
      const { error } = await supabase.from("week_blocks").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["week-blocks"] }),
  });
}

export function useDeleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("week_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["week-blocks"] }),
  });
}

export function useReorderBlocks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blocks: { id: string; order_index: number }[]) => {
      for (const b of blocks) {
        const { error } = await supabase.from("week_blocks").update({ order_index: b.order_index } as any).eq("id", b.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["week-blocks"] }),
  });
}
