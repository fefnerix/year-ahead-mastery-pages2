import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import DailyItemCard from "@/components/DailyItemCard";
import ProgressDonut from "@/components/ProgressDonut";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useProgress, useUpdateStreak } from "@/hooks/useTodayData";
import { useDayTasks, useToggleDayTask } from "@/hooks/useDayTasks";
import { useCalculateScore } from "@/hooks/useLeaderboard";
import { useIsAdmin } from "@/hooks/useAdmin";

const formattedToday = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "numeric",
  month: "short",
}).format(new Date());

const Index = () => {
  const { user } = useAuth();
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: tasks = [], isLoading: tasksLoading } = useDayTasks(progress?.day_id);
  const toggleTask = useToggleDayTask(progress?.day_id);
  const updateStreak = useUpdateStreak();
  const calculateScore = useCalculateScore();
  const { data: isAdmin } = useIsAdmin();

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

  const monthTheme = progress?.month_theme || "";

  // Current month label (e.g. "Marzo 2026")
  const now = new Date();
  const currentMonthLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(now);

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header — compact */}
      <header className="px-5 pt-10 pb-2 flex items-center justify-between shrink-0">
        <Logo variant="compact" />
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground capitalize">{formattedToday}</span>
          <Link
            to="/perfil"
            className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center ring-1 ring-primary/20 press-scale"
          >
            <span className="text-[10px] font-bold text-primary-foreground">{initials}</span>
          </Link>
        </div>
      </header>

      {/* Main content — fills remaining space */}
      <main className="flex-1 px-5 flex flex-col gap-4 min-h-0 pt-2 pb-2">
        {!hasDayData && !isLoading ? (
          /* Empty state — no published content */
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">Sin contenido publicado</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
                {isAdmin
                  ? "Ve a Admin para publicar el mes y el día."
                  : "Vuelve más tarde cuando haya contenido disponible."}
              </p>
            </div>
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-wider press-scale"
              >
                Ir a Admin
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* 1. Hero — Reto del Mes */}
            <section className="rounded-2xl overflow-hidden relative shrink-0">
              <div className="relative h-36">
                <div className="w-full h-full gold-gradient opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-1">
                    Reto del Mes
                  </span>
                  <h2 className="text-lg font-display font-bold text-foreground leading-tight">
                    {monthTheme || "—"}
                  </h2>
                  {progress?.month_id && (
                    <Link
                      to={`/mes/${progress.month_id}`}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient text-primary-foreground text-[11px] font-bold uppercase tracking-wider self-start press-scale"
                    >
                      Ver reto del mes <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Progress — donut */}
            <section className="shrink-0">
              {progressLoading ? (
                <div className="h-[76px] rounded-xl animate-pulse bg-muted/20" />
              ) : (
                <ProgressDonut
                  hoyPct={hoyPct}
                  mesPct={mesPct}
                  monthLabel={currentMonthLabel}
                  completedCount={completedCount}
                  totalTasks={totalTasks}
                />
              )}
            </section>

            {/* 3. Hoy — 2 tasks only */}
            <section className="flex-1 flex flex-col gap-2 min-h-0">
              {isLoading ? (
                <div className="space-y-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="glass-card rounded-2xl p-4 h-[68px] animate-pulse border border-primary/5" />
                  ))}
                </div>
              ) : (
                <>
                  <DailyItemCard task={prayerTask} type="prayer" onToggle={handleToggle} />
                  <DailyItemCard task={activityTask} type="activity" onToggle={handleToggle} />
                </>
              )}

              {/* Concluir Día — only when all complete */}
              {allCompleted && hasDayData && (
                <button
                  onClick={handleCompleteDay}
                  disabled={updateStreak.isPending || calculateScore.isPending}
                  className="mt-auto w-full py-3 rounded-xl gold-gradient font-bold text-primary-foreground text-xs uppercase tracking-wider flex items-center justify-center gap-2 gold-glow shimmer press-scale disabled:opacity-60 shrink-0"
                >
                  {updateStreak.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Concluir Día
                </button>
              )}
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
