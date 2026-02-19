import DailyChecklist from "@/components/DailyChecklist";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { Sparkles, Loader2, ArrowRight, Clock, Zap, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useProgress, useUpdateStreak } from "@/hooks/useTodayData";
import { useDayTasks, useToggleDayTask } from "@/hooks/useDayTasks";
import { useCalculateScore } from "@/hooks/useLeaderboard";
import { useCurrentWeekData } from "@/hooks/useCurrentWeekData";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useTaskNotes, useSaveNote } from "@/hooks/useTaskNotes";
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
  const { data: notesData = [] } = useTaskNotes(progress?.day_id);
  const saveNote = useSaveNote();
  const { data: yesterday } = useYesterdayProgress();

  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    notesData.forEach((n) => { map[n.task_id] = n.content; });
    setLocalNotes(map);
  }, [notesData]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const dayProgress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const allCompleted = tasks.length > 0 && completedCount === tasks.length;

  // Soft complete: ≥ 3/5
  const softComplete = tasks.length > 0 && completedCount >= 3;
  // Perfect Day: 5/5 + Momento 5 has a note
  const momento5Task = tasks.find((t) => t.order === 5);
  const momento5HasNote = momento5Task ? !!localNotes[momento5Task.id]?.trim() : false;
  const isPerfectDay = allCompleted && momento5HasNote;

  // Next Best Action: first incomplete task sorted by order
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
  const nextTask = sortedTasks.find((t) => !t.completed);

  const handleToggle = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) toggleTask.mutate(task);
  };

  const handleCompleteDay = () => {
    updateStreak.mutate();
    calculateScore.mutate();
  };

  const handleNoteChange = (taskId: string, content: string) => {
    setLocalNotes((prev) => ({ ...prev, [taskId]: content }));
  };

  const handleNoteSave = (taskId: string, content: string) => {
    if (progress?.day_id) {
      saveNote.mutate({ taskId, dayId: progress.day_id, content });
    }
  };

  // Progress message based on completion count
  const getProgressMessage = () => {
    if (completedCount === 0) return "Empezar te toma 2 minutos";
    if (completedCount <= 2) return "Buen inicio. Mantén el ritmo";
    if (completedCount < 5) return "Ya ganaste el día. ¿Vamos por Perfect?";
    if (isPerfectDay) return "🏆 Perfect Day desbloqueado";
    return "5/5 completo — escribe tu reflexión exponencial";
  };

  const isLoading = progressLoading || tasksLoading;
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";
  const initials = displayName.slice(0, 2).toUpperCase();
  const hasDayData = progress?.day_id != null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <Logo variant="compact" />
          <Link to="/perfil" className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center ring-2 ring-primary/20">
            <span className="text-sm font-bold text-primary-foreground">{initials}</span>
          </Link>
        </div>
      </header>

      <main className="px-5 space-y-8 pt-5">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Hola, {displayName}
          </h1>
        </div>

        {/* (A) Hero del Reto Activo */}
        {weekData ? (
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
                <p className="text-xs text-muted-foreground mt-0.5">Llegó tu nuevo reto</p>
                <div className="flex items-center gap-3 mt-3">
                  {hasDayData && (
                    <Link
                      to={`/reto/${weekData.id}/dia/${progress?.day_number}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-wider"
                    >
                      Continuar hoy <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <Link
                    to={`/reto/${weekData.id}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Ver reto
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* (NEW) Recuperar Ayer */}
        {yesterday && (
          <div className="glass-card rounded-2xl p-4 border border-primary/15 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Ayer — aún estás a tiempo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {yesterday.completed_count}/{yesterday.total_count} momentos completados
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

        {/* (NEW) Ahora — Next Best Action */}
        {hasDayData && nextTask && !isLoading && (
          <div className="glass-card rounded-2xl p-4 border border-primary/30 shadow-[0_0_20px_hsl(43_56%_59%/0.08)]">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Ahora</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{nextTask.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Momento {nextTask.order} · {nextTask.category.charAt(0).toUpperCase() + nextTask.category.slice(1)}
            </p>
            <button
              onClick={() => handleToggle(nextTask.id)}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-wider"
            >
              Empezar ahora <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* (NEW) All done — Perfect Day CTA */}
        {hasDayData && !nextTask && tasks.length > 0 && !isLoading && (
          <div className="glass-card rounded-2xl p-4 border border-primary/30 shadow-[0_0_20px_hsl(43_56%_59%/0.08)] text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">
              {isPerfectDay ? "Perfect Day ✨" : "Todos los momentos completados"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isPerfectDay
                ? "Día impecable. Tu racha se mantiene."
                : "Escribe tu reflexión exponencial para alcanzar el Perfect Day."}
            </p>
          </div>
        )}

        {/* (B) Tus 5 Momentos de Hoy */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Tus 5 momentos de hoy</h2>
            <span className="text-xs font-bold text-muted-foreground tabular-nums">
              {completedCount}/{tasks.length}
            </span>
          </div>

          {/* Progress bar + micro-incentive message */}
          {hasDayData && tasks.length > 0 && (
            <>
              <div className="w-full h-1 rounded-full bg-muted mb-2 overflow-hidden">
                <div
                  className="h-full rounded-full gold-gradient transition-all duration-700 ease-out"
                  style={{ width: `${dayProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">{getProgressMessage()}</p>
            </>
          )}

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
            <DailyChecklist
              tasks={tasks.map((t) => ({ id: t.id, title: t.title, category: t.category, completed: t.completed, order: t.order }))}
              onToggle={handleToggle}
              notes={localNotes}
              onNoteChange={handleNoteChange}
              onNoteSave={handleNoteSave}
              highlightTaskId={nextTask?.id ?? null}
            />
          )}
        </section>

        {/* Soft/Hard Complete Day Buttons */}
        {softComplete && (
          <div className="space-y-2 mt-2">
            {isPerfectDay ? (
              <button
                onClick={handleCompleteDay}
                disabled={updateStreak.isPending}
                className="w-full py-4 rounded-2xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2 gold-glow shimmer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {updateStreak.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Perfect Day ✨
              </button>
            ) : allCompleted ? (
              <button
                onClick={handleCompleteDay}
                disabled={updateStreak.isPending}
                className="w-full py-4 rounded-2xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2 gold-glow shimmer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {updateStreak.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Concluir Día
              </button>
            ) : (
              <button
                onClick={handleCompleteDay}
                disabled={updateStreak.isPending}
                className="w-full py-3.5 rounded-2xl bg-card border border-primary/20 font-semibold text-foreground text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:border-primary/40 disabled:opacity-60"
              >
                {updateStreak.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-primary" />}
                Cerrar el día
              </button>
            )}
            <p className="text-[10px] text-center text-muted-foreground">
              Tu racha se mantiene con Perfect Day (5/5 + reflexión).
            </p>
          </div>
        )}

        {/* Announcement opcional */}
        <AnnouncementBanner />
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
