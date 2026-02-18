import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentWeekData {
  id: string;
  name: string;
  number: number;
  objective: string | null;
  cover_url: string | null;
  audio_url: string | null;
  schedule_image_url: string | null;
  schedule_pdf_url: string | null;
  description_long: string | null;
  spiritual_playlist_url: string | null;
  mental_playlist_url: string | null;
  status: string;
}

const WEEK_COLUMNS = "id, name, number, objective, cover_url, audio_url, schedule_image_url, schedule_pdf_url, description_long, spiritual_playlist_url, mental_playlist_url, status";

export function useCurrentWeekData() {
  return useQuery({
    queryKey: ["current-week-data"],
    queryFn: async (): Promise<CurrentWeekData | null> => {
      // 1. Try active week first
      const { data: activeWeek, error: activeErr } = await supabase
        .from("weeks")
        .select(WEEK_COLUMNS)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (activeErr) throw activeErr;
      if (activeWeek) return activeWeek as unknown as CurrentWeekData;

      // 2. Fallback: find by today's date
      const today = new Date().toISOString().split("T")[0];

      const { data: dayData, error: dayError } = await supabase
        .from("days")
        .select("week_id")
        .lte("date", today)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dayError) throw dayError;
      if (!dayData?.week_id) return null;

      const { data: week, error: weekError } = await supabase
        .from("weeks")
        .select(WEEK_COLUMNS)
        .eq("id", dayData.week_id)
        .single();

      if (weekError) throw weekError;
      return week as unknown as CurrentWeekData;
    },
  });
}
