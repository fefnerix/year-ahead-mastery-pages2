import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import DailyItemCard from "@/components/DailyItemCard";
import JournalInput from "@/components/JournalInput";
import { Sparkles, Loader2, ArrowRight, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useProgress, useUpdateStreak } from "@/hooks/useTodayData";
import { useDayTasks, useToggleDayTask } from "@/hooks/useDayTasks";
import { useCalculateScore } from "@/hooks/useLeaderboard";
import { useCurrentWeekData } from "@/hooks/useCurrentWeekData";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useYesterdayProgress } from "@/hooks/useYesterdayData";

const Index = () => {
  const { user } = useAuth();
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: tasks = [], isLoading: tasksLoading } = useDayTasks(progress?.day_id);
  const toggleTask = useToggleDayTask(progress?.day_id);
  const updateStreak = useUpdateStreak();
  const calculateScore = useCalculateScore();
  const { data: weekData } = useCurrentWeekData();
  const { data: isAdmin } = useIsAdmin();
  const { data: yesterday } = useYesterdayProgress();

  const { data: currentDayDate } = useQuery({
    queryKey: ["day-date", progress?.day_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("days")
        .select("date")
        .eq("id", progress!.day_id!)
        .single();
      return data?.date as string;
    },
    enabled: !!progress?.day_id,
  });

  const prayerTask = tasks.find((t) => t.task_kind === "prayer") ?? null;
  const activityTask = tasks.find((t) => t.task_kind === "activity") ?? null;
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const allCompleted = totalTasks > 0 && completedCount >= totalTasks;

  const handleToggle = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) toggleTask.mutate(task);
  };

  const handleCompleteDay = () => {
    updateStreak.mutate();
    calculateScore.mutate();
  };

  const isLoading = progressLoading || tasksLoading;
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";
  const initials = displayName.slice(0, 2).toUpperCase();
  const hasDayData = progress?.day_id != null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <Logo variant="compact" />
          <Link to="/perfil" className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center ring-2 ring-primary/20">
            <span className="text-sm font-bold text-primary-foreground">{initials}</span>
          </Link>
        </div>
      </header>

      <main className="px-5 space-y-8 pt-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Hola, {displayName}
          </h1>
        </div>

        {/* Progreso */}
        <section>
          <h2 className="section-title mb-3">Progreso</h2>
          {progressLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 h-20 animate-pulse bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: "Hoy", value: progress?.day_pct },
                { label: "Semana", value: progress?.week_pct },
                { label: "Mes", value: progress?.month_pct },
                { label: "Total", value: progress?.year_pct },
              ] as const).map((item) => (
                <div key={item.label} className="glass-card rounded-2xl p-4 border border-primary/10">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {Math.min(100, Math.max(0, Math.round(item.value ?? 0)))}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Hero del Reto Activo */}
        {weekData && (
          <div className="rounded-2xl overflow-hidden relative">
            <div className="relative h-44">
              {weekData.cover_url ? (
                <img src={weekData.cover_url} alt={weekData.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gold-gradient opacity-30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <span className="inline-flex self-start px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider gold-gradient text-primary-foreground backdrop-blur-sm mb-2">
                  Reto {weekData.number} · Día {progress?.day_number ?? "—"}/7
                </span>
                <h2 className="text-xl font-display font-bold text-foreground">{weekData.name}</h2>
                {hasDayData && (
                  <Link
                    to={`/reto/${weekData.id}/dia/${progress?.day_number}`}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-wider self-start"
                  >
                    Continuar hoy <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recuperar Ayer */}
        {yesterday && (
          <div className="glass-card rounded-2xl p-4 border border-primary/15 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Ayer — aún estás a tiempo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {yesterday.completed_count}/{yesterday.total_count} completados
              </p>
            </div>
            <Link
              to={`/reto/${yesterday.week_id}/dia/${yesterday.day_number}`}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
            >
              Recuperar
            </Link>
          </div>
        )}

        {/* Hoy: 2 cards */}
        <section>
          <h2 className="section-title mb-3">Hoy</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : !hasDayData ? (
            <div className="glass-card rounded-2xl p-6 text-center space-y-3">
              <p className="text-sm font-medium text-foreground">Tu reto aún no está activo.</p>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient text-primary-foreground text-xs font-bold"
                >
                  Activar reto
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground">Vuelve más tarde.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <DailyItemCard task={prayerTask} type="prayer" onToggle={handleToggle} />
              <DailyItemCard task={activityTask} type="activity" onToggle={handleToggle} />
            </div>
          )}
        </section>

        {/* Concluir Día */}
        {allCompleted && hasDayData && (
          <button
            onClick={handleCompleteDay}
            disabled={updateStreak.isPending || calculateScore.isPending}
            className="w-full py-4 rounded-2xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2 gold-glow shimmer"
          >
            {updateStreak.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Concluir Día
          </button>
        )}

        {/* Reflexión del día */}
        {hasDayData && currentDayDate && (
          <JournalInput date={currentDayDate} dayId={progress?.day_id} weekId={weekData?.id} />
        )}

        <AnnouncementBanner />
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
