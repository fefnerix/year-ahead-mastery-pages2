import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  days_completed: number;
  streak: number;
  position: number;
}

export interface RankingSummary {
  month_points: number;
  month_total: number;
  total_points: number;
  total_total: number;
  month_pct: number;
  total_pct: number;
  streak: number;
  max_streak: number;
  position: number;
}

/** Fetch the single active program ID */
function useActiveProgramId() {
  return useQuery({
    queryKey: ["active-program"],
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase
        .from("programs")
        .select("id")
        .order("year", { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data.id;
    },
    staleTime: 1000 * 60 * 60, // 1h – program rarely changes
  });
}

export function useLeaderboard(scope: "month" | "total") {
  const { data: programId } = useActiveProgramId();

  return useQuery({
    queryKey: ["leaderboard", scope, programId],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase.rpc("get_leaderboard_v2" as any, {
        p_scope: scope,
        p_program_id: programId!,
      });
      if (error) throw error;
      return (data as unknown as LeaderboardEntry[]) ?? [];
    },
    enabled: !!programId,
    staleTime: 1000 * 60, // 1 min
  });
}

export function useRankingSummary() {
  const { user } = useAuth();
  const { data: programId } = useActiveProgramId();

  return useQuery({
    queryKey: ["ranking-summary", user?.id, programId],
    queryFn: async (): Promise<RankingSummary> => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.rpc("get_my_ranking_summary" as any, {
        p_user_id: user.id,
        p_program_id: programId!,
      });
      if (error) throw error;
      return data as unknown as RankingSummary;
    },
    enabled: !!user && !!programId,
    staleTime: 1000 * 60, // 1 min
  });
}
