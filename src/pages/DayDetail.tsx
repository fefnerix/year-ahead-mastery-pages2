import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDayTasks, useToggleDayTask } from "@/hooks/useDayTasks";
import { useUpdateStreak } from "@/hooks/useTodayData";
import { useCalculateScore } from "@/hooks/useLeaderboard";
import BottomNav from "@/components/BottomNav";
import JournalInput from "@/components/JournalInput";
import PlaylistCard from "@/components/PlaylistCard";
import { ArrowLeft, Sparkles, Loader2, BookOpen, Target, Check } from "lucide-react";

const DayDetail = () => {
  const { dayId } = useParams<{ dayId: string }>();
  const navigate = useNavigate();
  const updateStreak = useUpdateStreak();
  const calculateScore = useCalculateScore();

  // Load day + week info
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

  const totalTasks = tasks.length || 2;
  const completedCount = tasks.filter((t) => t.completed).length;
  const allCompleted = tasks.length > 0 && completedCount >= totalTasks;

  const prayerTask = tasks.find((t) => t.task_kind === "prayer");
  const activityTask = tasks.find((t) => t.task_kind === "activity");

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
          <span className="text-sm font-bold text-muted-foreground tabular-nums">{completedCount}/{totalTasks}</span>
        </div>
      </header>

      <main className="px-5 space-y-5">
        {/* Oración del día */}
        {prayerTask ? (
          <section className="glass-card rounded-2xl p-4 border border-primary/10 space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Oración del día</p>
            </div>
            <p className="text-sm font-semibold text-foreground">{prayerTask.title}</p>
            {prayerTask.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{prayerTask.description}</p>
            )}
            <button
              onClick={() => handleToggle(prayerTask.id)}
              className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                prayerTask.completed
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Check className={`w-4 h-4 ${prayerTask.completed ? "opacity-100" : "opacity-30"}`} />
              {prayerTask.completed ? "Completada" : "Marcar como hecha"}
            </button>
          </section>
        ) : (
          <section className="glass-card rounded-2xl p-4 border border-muted/30 text-center">
            <p className="text-xs text-muted-foreground">Oración del día — No disponible</p>
          </section>
        )}

        {/* Tarea del día */}
        {activityTask ? (
          <section className="glass-card rounded-2xl p-4 border border-primary/10 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Tarea del día</p>
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                {activityTask.category}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground">{activityTask.title}</p>
            {activityTask.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{activityTask.description}</p>
            )}
            <button
              onClick={() => handleToggle(activityTask.id)}
              className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                activityTask.completed
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Check className={`w-4 h-4 ${activityTask.completed ? "opacity-100" : "opacity-30"}`} />
              {activityTask.completed ? "Completada" : "Marcar como hecha"}
            </button>
          </section>
        ) : (
          <section className="glass-card rounded-2xl p-4 border border-muted/30 text-center">
            <p className="text-xs text-muted-foreground">Tarea del día — No disponible</p>
          </section>
        )}

        {/* Complete Day */}
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

        {/* Reflexión */}
        {dayData.day.date && (
          <JournalInput date={dayData.day.date} dayId={dayId} weekId={dayData.day.week_id} />
        )}

        {/* Playlists */}
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
