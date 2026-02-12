import ProgressRing from "@/components/ProgressRing";
import StreakBadge from "@/components/StreakBadge";
import DailyChecklist from "@/components/DailyChecklist";
import MiniRanking from "@/components/MiniRanking";
import BottomNav from "@/components/BottomNav";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useProgress,
  useTodayTasks,
  useToggleTask,
  useStreak,
  useUpdateStreak,
} from "@/hooks/useTodayData";

const mockRanking = [
  { position: 1, name: "María G.", score: 2450 },
  { position: 2, name: "Carlos R.", score: 2380 },
  { position: 3, name: "Ana L.", score: 2310 },
  { position: 4, name: "Tu", score: 2280, isCurrentUser: true },
  { position: 5, name: "Pedro M.", score: 2200 },
];

const Index = () => {
  const { user } = useAuth();
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: tasks = [], isLoading: tasksLoading } = useTodayTasks(progress?.day_id);
  const toggleTask = useToggleTask(progress?.day_id);
  const { data: streak } = useStreak();
  const updateStreak = useUpdateStreak();

  const completedCount = tasks.filter((t) => t.completed).length;
  const dayProgress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const allCompleted = tasks.length > 0 && completedCount === tasks.length;

  const handleToggle = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) toggleTask.mutate(task);
  };

  const handleCompleteDay = () => {
    updateStreak.mutate();
  };

  const isLoading = progressLoading || tasksLoading;

  // Get user initials
  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  const hasDayData = progress?.day_id != null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {progress?.week_name || "Cargando..."}
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
              tasks={tasks.map((t) => ({
                id: t.id,
                title: t.title,
                category: t.category,
                completed: t.completed,
              }))}
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
            {updateStreak.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Concluir Día
          </button>
        )}

        {/* Mini Ranking */}
        <section>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">Ranking</h2>
          <MiniRanking entries={mockRanking} currentUserPosition={4} />
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
