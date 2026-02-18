import DailyChecklist from "@/components/DailyChecklist";
import BottomNav from "@/components/BottomNav";
import DepositCard from "@/components/DepositCard";
import Logo from "@/components/Logo";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  useProgress,
  useTodayTasks,
  useToggleTask,
  useUpdateStreak,
} from "@/hooks/useTodayData";
import { useCalculateScore } from "@/hooks/useLeaderboard";
import { useCurrentWeekData } from "@/hooks/useCurrentWeekData";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useTaskNotes, useSaveNote } from "@/hooks/useTaskNotes";

const Index = () => {
  const { user } = useAuth();
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: tasks = [], isLoading: tasksLoading } = useTodayTasks(progress?.day_id);
  const toggleTask = useToggleTask(progress?.day_id);
  const updateStreak = useUpdateStreak();
  const calculateScore = useCalculateScore();
  const { data: weekData } = useCurrentWeekData();
  const { data: isAdmin } = useIsAdmin();
  const { data: notesData = [] } = useTaskNotes(progress?.day_id);
  const saveNote = useSaveNote();

  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    notesData.forEach((n) => { map[n.task_id] = n.content; });
    setLocalNotes(map);
  }, [notesData]);

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

  const handleNoteChange = (taskId: string, content: string) => {
    setLocalNotes((prev) => ({ ...prev, [taskId]: content }));
  };

  const handleNoteSave = (taskId: string, content: string) => {
    if (progress?.day_id) {
      saveNote.mutate({ taskId, dayId: progress.day_id, content });
    }
  };

  const isLoading = progressLoading || tasksLoading;
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";
  const initials = displayName.slice(0, 2).toUpperCase();
  const hasDayData = progress?.day_id != null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-12 pb-3 border-b border-primary/15">
        <div className="flex items-center justify-between">
          <Logo variant="compact" />
          <Link to="/perfil" className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center ring-2 ring-primary/20">
            <span className="text-sm font-bold text-primary-foreground">{initials}</span>
          </Link>
        </div>
      </header>

      <main className="px-5 space-y-6 pt-5">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Hola, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Tu misión de hoy te espera.</p>
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
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <span className="inline-flex self-start px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-card/80 text-muted-foreground backdrop-blur-sm mb-3">
                  Reto {weekData.number} · Día {progress?.day_number ?? "—"}/7
                </span>
                <h2 className="text-xl font-display font-bold text-foreground">{weekData.name}</h2>
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
                    Abrir reto
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* (B) Tus 5 Momentos de Hoy */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="section-title">Tus 5 momentos de hoy</h2>
            <span className="text-xs font-bold text-muted-foreground tabular-nums">
              {completedCount}/{tasks.length}
            </span>
          </div>

          {hasDayData && tasks.length > 0 && (
            <div className="w-full h-1 rounded-full bg-muted mb-4 overflow-hidden">
              <div
                className="h-full rounded-full gold-gradient transition-all duration-700 ease-out"
                style={{ width: `${dayProgress}%` }}
              />
            </div>
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
              tasks={tasks.map((t) => ({ id: t.id, title: t.title, category: t.category, completed: t.completed }))}
              onToggle={handleToggle}
              notes={localNotes}
              onNoteChange={handleNoteChange}
              onNoteSave={handleNoteSave}
            />
          )}
        </section>

        {/* Complete Day Button */}
        {allCompleted && (
          <button
            onClick={handleCompleteDay}
            disabled={updateStreak.isPending}
            className="w-full py-4 rounded-2xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2 gold-glow shimmer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {updateStreak.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Concluir Día
          </button>
        )}

        {/* (C) Depósito */}
        <DepositCard />
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
