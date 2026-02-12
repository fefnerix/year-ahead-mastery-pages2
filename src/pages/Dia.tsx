import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDayTasks, useToggleDayTask } from "@/hooks/useDayTasks";
import { useUpdateStreak } from "@/hooks/useTodayData";
import { useCalculateScore } from "@/hooks/useLeaderboard";
import BottomNav from "@/components/BottomNav";
import DailyChecklist from "@/components/DailyChecklist";
import ProgressRing from "@/components/ProgressRing";
import { ArrowLeft, Sparkles, Loader2, Calendar, Headphones } from "lucide-react";

const Dia = () => {
  const { weekId, dayNumber } = useParams<{ weekId: string; dayNumber: string }>();
  const navigate = useNavigate();
  const updateStreak = useUpdateStreak();
  const calculateScore = useCalculateScore();

  // Get day record
  const { data: dayData, isLoading: dayLoading } = useQuery({
    queryKey: ["day-record", weekId, dayNumber],
    queryFn: async () => {
      const { data: day, error } = await supabase
        .from("days")
        .select("id, number, date, week_id")
        .eq("week_id", weekId!)
        .eq("number", parseInt(dayNumber!))
        .single();
      if (error) throw error;

      const { data: week } = await supabase
        .from("weeks")
        .select("name, number, audio_url, schedule_image_url")
        .eq("id", weekId!)
        .single();

      return { day, week };
    },
    enabled: !!weekId && !!dayNumber,
  });

  const dayId = dayData?.day?.id;
  const { data: tasks = [], isLoading: tasksLoading } = useDayTasks(dayId);
  const toggleTask = useToggleDayTask(dayId);

  const completedCount = tasks.filter((t) => t.completed).length;
  const dayProgress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const allCompleted = tasks.length > 0 && completedCount === tasks.length;

  const handleToggle = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) toggleTask.mutate(task);
  };

  const handleCompleteDay = async () => {
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <button onClick={() => navigate(`/reto/${weekId}`)} className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver al Reto
        </button>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Semana {dayData?.week?.number ?? ""}
            </p>
            <h1 className="text-2xl font-display font-bold text-foreground mt-1">
              Día {dayNumber} — {dayData?.week?.name}
            </h1>
          </div>
          <ProgressRing progress={dayProgress} label="Hoy" size={64} strokeWidth={4} />
        </div>
      </header>

      <main className="px-5 space-y-5">
        {/* Checklist */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold text-foreground">Momentos del Día</h2>
            <span className="text-xs font-semibold text-muted-foreground">{completedCount}/{tasks.length}</span>
          </div>
          <DailyChecklist
            tasks={tasks.map((t) => ({ id: t.id, title: t.title, category: t.category, completed: t.completed }))}
            onToggle={handleToggle}
          />
        </section>

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

        {/* Materials */}
        <section className="glass-card rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Materiales</p>
          {dayData?.week?.schedule_image_url && (
            <Link
              to={`/reto/${weekId}`}
              className="flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg text-sm text-secondary-foreground"
            >
              <Calendar className="w-4 h-4 text-primary" /> Ver cronograma semanal
            </Link>
          )}
          {dayData?.week?.audio_url && (
            <Link
              to={`/reto/${weekId}`}
              className="flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg text-sm text-secondary-foreground"
            >
              <Headphones className="w-4 h-4 text-primary" /> Escuchar audio de introducción
            </Link>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dia;
