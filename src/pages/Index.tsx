import ProgressRing from "@/components/ProgressRing";
import StreakBadge from "@/components/StreakBadge";
import DailyChecklist from "@/components/DailyChecklist";
import MiniRanking from "@/components/MiniRanking";
import BottomNav from "@/components/BottomNav";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import {
  useProgress,
  useTodayTasks,
  useToggleTask,
  useStreak,
  useUpdateStreak,
} from "@/hooks/useTodayData";
import { useLeaderboard, useCalculateScore } from "@/hooks/useLeaderboard";
import { useCurrentWeekId } from "@/hooks/useRetoData";

const Index = () => {
  const { user } = useAuth();
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: tasks = [], isLoading: tasksLoading } = useTodayTasks(progress?.day_id);
  const toggleTask = useToggleTask(progress?.day_id);
  const { data: streak } = useStreak();
  const updateStreak = useUpdateStreak();
  const calculateScore = useCalculateScore();
  const { data: leaderboard = [] } = useLeaderboard("week");
  const { data: currentWeekId } = useCurrentWeekId();

  const completedCount = tasks.filter((t) => t.completed).length;
  const dayProgress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const allCompleted = tasks.length > 0 && completedCount === tasks.length;

  const handleToggle = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) toggleTask.mutate(task);
  };

  const handleCompleteDay = () => {
    updateStreak.mutate();
    calculateScore.mutate();
  };

  const isLoading = progressLoading || tasksLoading;

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  const hasDayData = progress?.day_id != null;

  // Transform leaderboard for MiniRanking
  const rankingEntries = leaderboard.slice(0, 5).map((e) => ({
    position: e.position,
    name: e.display_name,
    score: e.score,
    isCurrentUser: e.user_id === user?.id,
  }));

  const currentUserPos = leaderboard.find((e) => e.user_id === user?.id)?.position ?? 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <Logo variant="compact" />
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mt-2">
              {progress?.week_name || ""}
            </p>
            <h1 className="text-3xl font-display font-bold text-foreground mt-1">
              {hasDayData ? `Día ${progress.day_number}` : "Hoy"}
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">{initials}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {progress?.month_theme ? (
            <>Enfoque del mes: <span className="text-gold-light font-medium">{progress.month_theme}</span></>
          ) : (
            "Sin programa activo"
          )}
        </p>
      </header>

      <main className="px-5 space-y-5">
        {/* Progress Rings */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-around">
            <ProgressRing progress={hasDayData ? dayProgress : 0} label="Hoy" size={76} strokeWidth={5} />
            <ProgressRing progress={progress?.week_pct ?? 0} label="Semana" size={64} strokeWidth={4} />
            <ProgressRing progress={progress?.month_pct ?? 0} label="Mes" size={64} strokeWidth={4} />
            <ProgressRing progress={progress?.year_pct ?? 0} label="Año" size={64} strokeWidth={4} />
          </div>
        </div>

        {/* Link to current reto */}
        {currentWeekId && (
          <Link
            to={`/reto/${currentWeekId}`}
            className="w-full glass-card gold-border rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">Ver Reto Actual</p>
              <p className="text-xs text-muted-foreground">Cronograma, audio y progreso</p>
            </div>
            <ArrowRight className="w-5 h-5 text-primary" />
          </Link>
        )}

        {/* Streak */}
        <StreakBadge current={streak?.current_streak ?? 0} record={streak?.max_streak ?? 0} />

        {/* Daily Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold text-foreground">Tareas de Hoy</h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {completedCount}/{tasks.length}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : !hasDayData ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-muted-foreground text-sm">No hay tareas programadas para hoy.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Un admin debe crear el programa y las tareas.</p>
            </div>
          ) : (
            <DailyChecklist
              tasks={tasks.map((t) => ({ id: t.id, title: t.title, category: t.category, completed: t.completed }))}
              onToggle={handleToggle}
            />
          )}
        </section>

        {/* Complete Day Button */}
        {allCompleted && (
          <button
            onClick={handleCompleteDay}
            disabled={updateStreak.isPending}
            className="w-full py-4 rounded-xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2 gold-glow shimmer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {updateStreak.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Concluir Día
          </button>
        )}

        {/* Mini Ranking */}
        <section>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">Ranking</h2>
          {rankingEntries.length > 0 ? (
            <MiniRanking entries={rankingEntries} currentUserPosition={currentUserPos} />
          ) : (
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">Completa tareas para aparecer en el ranking</p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
