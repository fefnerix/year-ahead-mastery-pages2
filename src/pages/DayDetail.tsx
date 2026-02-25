import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDayTasks, useToggleDayTask } from "@/hooks/useDayTasks";
import { useUpdateStreak } from "@/hooks/useTodayData";
import { useCalculateScore } from "@/hooks/useLeaderboard";
import BottomNav from "@/components/BottomNav";
import DailyItemCard from "@/components/DailyItemCard";
import JournalInput from "@/components/JournalInput";
import PlaylistCard from "@/components/PlaylistCard";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";

const DayDetail = () => {
  const { dayId } = useParams<{ dayId: string }>();
  const navigate = useNavigate();
  const updateStreak = useUpdateStreak();
  const calculateScore = useCalculateScore();

  const { data: dayData, isLoading: dayLoading } = useQuery({
    queryKey: ["day-detail", dayId],
    queryFn: async () => {
      const { data: day, error } = await supabase
        .from("days")
        .select("id, number, date, week_id")
        .eq("id", dayId!)
        .single();
      if (error) throw error;

      const { data: week } = await supabase
        .from("weeks")
        .select("id, name, number, spiritual_playlist_url, mental_playlist_url, month_id")
        .eq("id", day.week_id)
        .single();

      return { day, week: week as any };
    },
    enabled: !!dayId,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useDayTasks(dayId);
  const toggleTask = useToggleDayTask(dayId);

  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const allCompleted = totalTasks > 0 && completedCount >= totalTasks;

  const prayerTask = tasks.find((t) => t.task_kind === "prayer") ?? null;
  const activityTask = tasks.find((t) => t.task_kind === "activity") ?? null;

  const handleToggle = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) toggleTask.mutate(task);
  };

  const handleCompleteDay = () => {
    updateStreak.mutate();
    calculateScore.mutate();
  };

  if (dayLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!dayData?.day) {
    return (
      <div className="min-h-screen bg-background pb-24 flex flex-col items-center justify-center px-5">
        <p className="text-lg font-bold text-foreground">Día no disponible</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary text-sm font-semibold hover:underline">
          ← Volver
        </button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Semana {dayData.week?.number ?? ""}
            </p>
            <h1 className="text-2xl font-display font-bold text-foreground mt-1">
              Día {dayData.day.number} — {dayData.week?.name}
            </h1>
          </div>
          <span className="text-sm font-bold text-muted-foreground tabular-nums">{completedCount}/{totalTasks || 2}</span>
        </div>
      </header>

      <main className="px-5 space-y-5">
        <DailyItemCard task={prayerTask} type="prayer" onToggle={handleToggle} />
        <DailyItemCard task={activityTask} type="activity" onToggle={handleToggle} />

        {allCompleted && (
          <button
            onClick={handleCompleteDay}
            disabled={updateStreak.isPending || calculateScore.isPending}
            className="w-full py-4 rounded-xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2 gold-glow shimmer"
          >
            {updateStreak.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Concluir Día
          </button>
        )}

        {dayData.day.date && (
          <JournalInput date={dayData.day.date} dayId={dayId} weekId={dayData.day.week_id} />
        )}

        {dayData.week?.spiritual_playlist_url && (
          <PlaylistCard title="Vibración Espiritual" url={dayData.week.spiritual_playlist_url} />
        )}
        {dayData.week?.mental_playlist_url && (
          <PlaylistCard title="Vibración Mental" url={dayData.week.mental_playlist_url} />
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default DayDetail;
