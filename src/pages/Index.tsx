import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import DailyItemCard from "@/components/DailyItemCard";
import JournalInput from "@/components/JournalInput";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useProgress, useUpdateStreak } from "@/hooks/useTodayData";
import { useDayTasks, useToggleDayTask } from "@/hooks/useDayTasks";
import { useCalculateScore } from "@/hooks/useLeaderboard";
import { useCurrentWeekData } from "@/hooks/useCurrentWeekData";
import { useIsAdmin } from "@/hooks/useAdmin";

const formattedToday = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());

const Index = () => {
  const { user } = useAuth();
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: tasks = [], isLoading: tasksLoading } = useDayTasks(progress?.day_id);
  const toggleTask = useToggleDayTask(progress?.day_id);
  const updateStreak = useUpdateStreak();
  const calculateScore = useCalculateScore();
  const { data: weekData } = useCurrentWeekData();
  const { data: isAdmin } = useIsAdmin();

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

  const hoyPct = Math.min(100, Math.max(0, Math.round(progress?.day_pct ?? 0)));
  const mesPct = Math.min(100, Math.max(0, Math.round(progress?.month_pct ?? 0)));

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <Logo variant="compact" />
          <Link
            to="/perfil"
            className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center ring-2 ring-primary/20 press-scale"
          >
            <span className="text-sm font-bold text-primary-foreground">{initials}</span>
          </Link>
        </div>
      </header>

      <main className="px-5 pt-2 space-y-7">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Hola, {displayName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">{formattedToday}</p>
        </div>

        {/* Announcements */}
        <AnnouncementBanner />

        {/* Progress */}
        <section>
          <h2 className="section-title mb-3">Progreso</h2>
          {progressLoading ? (
            <div className="space-y-3">
              <div className="glass-card rounded-2xl p-5 h-[108px] animate-pulse bg-muted/30" />
              <div className="glass-card rounded-2xl p-4 h-[80px] animate-pulse bg-muted/30" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Hoy — prominent */}
              <div className="glass-card rounded-2xl p-5 border border-primary/20">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hoy</p>
                  <p className="text-3xl font-bold text-primary">{hoyPct}%</p>
                </div>
                <div className="h-3 rounded-full bg-white/5 mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full gold-gradient transition-all duration-700"
                    style={{ width: `${hoyPct}%` }}
                  />
                </div>
                {totalTasks > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">{completedCount}/{totalTasks} hechas</p>
                )}
              </div>
              {/* Mes — compact */}
              <div className="glass-card rounded-2xl p-4 border border-primary/10">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mes</p>
                  <p className="text-xl font-bold text-primary">{mesPct}%</p>
                </div>
                <div className="h-2 rounded-full bg-white/5 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full gold-gradient transition-all duration-700"
                    style={{ width: `${mesPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Promedio del mes</p>
              </div>
            </div>
          )}
        </section>

        {/* Hero del Reto Activo */}
        {weekData && (
          <div className="rounded-2xl overflow-hidden relative">
            <div className="relative h-44">
              {weekData.cover_url ? (
                <img
                  src={weekData.cover_url}
                  alt={weekData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full gold-gradient opacity-30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <span className="inline-flex self-start px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider gold-gradient text-primary-foreground backdrop-blur-sm mb-2">
                  Reto {weekData.number} · Día {progress?.day_number ?? "—"}/7
                </span>
                <h2 className="text-xl font-display font-bold text-foreground">{weekData.name}</h2>
                {hasDayData && (
                  <Link
                    to={`/reto/${weekData.id}/dia/${progress?.day_number}`}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-wider self-start press-scale"
                  >
                    Continuar hoy <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hoy: 2 cards */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Hoy</h2>
            {hasDayData && totalTasks > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                {completedCount}/{totalTasks} hechas
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 h-[76px] animate-pulse border border-primary/5">
                  <div className="h-2.5 bg-white/10 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : !hasDayData ? (
            <div className="glass-card rounded-2xl p-6 text-center space-y-3 border border-muted/20">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Tu reto aún no está activo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAdmin ? "Activa un reto desde el panel de administración." : "Vuelve más tarde cuando el reto esté disponible."}
                </p>
              </div>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient text-primary-foreground text-xs font-bold press-scale"
                >
                  Activar reto
                </Link>
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
            className="w-full py-4 rounded-2xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2 gold-glow shimmer press-scale disabled:opacity-60"
          >
            {updateStreak.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Concluir Día
          </button>
        )}

        {/* Reflexión del día */}
        {hasDayData && currentDayDate && (
          <JournalInput date={currentDayDate} dayId={progress?.day_id} weekId={weekData?.id} />
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
