import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  score: number;
  days_completed: number;
  weeks_completed: number;
  streak: number;
  position: number;
}

function getCurrentPeriodKey(type: "week" | "month" | "year"): string {
  const now = new Date();
  const year = now.getFullYear();
  if (type === "year") return `${year}`;
  if (type === "month") return `${year}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  // ISO week
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function useLeaderboard(periodType: "week" | "month" | "year") {
  const periodKey = getCurrentPeriodKey(periodType);

  return useQuery({
    queryKey: ["leaderboard", periodType, periodKey],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase.rpc("get_leaderboard", {
        p_period_type: periodType,
        p_period_key: periodKey,
        p_limit: 20,
      });
      if (error) throw error;
      return (data as unknown as LeaderboardEntry[]) ?? [];
    },
  });
}

export function useCalculateScore() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const periods: Array<{ type: "week" | "month" | "year"; key: string }> = [
        { type: "week", key: getCurrentPeriodKey("week") },
        { type: "month", key: getCurrentPeriodKey("month") },
        { type: "year", key: getCurrentPeriodKey("year") },
      ];

      for (const p of periods) {
        await supabase.rpc("calculate_user_score", {
          p_user_id: user.id,
          p_period_type: p.type,
          p_period_key: p.key,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export { getCurrentPeriodKey };
