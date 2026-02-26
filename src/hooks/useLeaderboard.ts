import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const PROGRAM_ID = "a0000000-0000-0000-0000-000000000001";

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
  today_points: number;
  month_points: number;
  total_points: number;
  today_pct: number;
  month_pct: number;
  total_pct: number;
  streak: number;
  max_streak: number;
  position: number;
}

export function useLeaderboard(scope: "day" | "month" | "total") {
  return useQuery({
    queryKey: ["leaderboard", scope],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase.rpc("get_leaderboard_v2" as any, {
        p_scope: scope,
        p_program_id: PROGRAM_ID,
      });
      if (error) throw error;
      return (data as unknown as LeaderboardEntry[]) ?? [];
    },
  });
}

export function useRankingSummary() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ranking-summary", user?.id],
    queryFn: async (): Promise<RankingSummary> => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.rpc("get_my_ranking_summary" as any, {
        p_user_id: user.id,
        p_program_id: PROGRAM_ID,
      });
      if (error) throw error;
      return data as unknown as RankingSummary;
    },
    enabled: !!user,
  });
}
