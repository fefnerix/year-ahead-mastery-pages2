import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDayTasks, useToggleDayTask } from "@/hooks/useDayTasks";
import { useUpdateStreak } from "@/hooks/useTodayData";
import { useCalculateScore } from "@/hooks/useLeaderboard";
import BottomNav from "@/components/BottomNav";
import DailyItemCard from "@/components/DailyItemCard";
import PlaylistCard from "@/components/PlaylistCard";
import JournalInput from "@/components/JournalInput";
import { ArrowLeft, Sparkles, Loader2, Calendar, Headphones, FileText, ArrowRight } from "lucide-react";

const Dia = () => {
  const { weekId, dayNumber } = useParams<{ weekId: string; dayNumber: string }>();
  const navigate = useNavigate();
  const updateStreak = useUpdateStreak();
  const calculateScore = useCalculateScore();

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
        .select("name, number, audio_url, schedule_image_url, spiritual_playlist_url, mental_playlist_url")
        .eq("id", weekId!)
        .single();

      return { day, week: week as any };
    },
    enabled: !!weekId && !!dayNumber,
  });

  const dayId = dayData?.day?.id;
  const { data: tasks = [], isLoading: tasksLoading } = useDayTasks(dayId);
  const toggleTask = useToggleDayTask(dayId);

  const { data: lecturas = [] } = useQuery({
    queryKey: ["lecturas-day", dayId],
    queryFn: async () => {
      const { data: items, error } = await supabase
        .from("content_items")
        .select("id, title, url, type")
        .eq("day_id", dayId!)
        .order("order", { ascending: true });
      if (error) throw error;
      const seen = new Set<string>();
      return (items ?? []).filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });
    },
    enabled: !!dayId,
  });

  const lecturasPreview = lecturas.slice(0, 3);
  const hasLecturas = lecturas.length > 0;

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

        {dayData?.day?.date && (
          <JournalInput date={dayData.day.date} dayId={dayId} weekId={weekId} />
        )}

        {dayData?.week?.spiritual_playlist_url && (
          <PlaylistCard title="Vibración Espiritual" url={dayData.week.spiritual_playlist_url} />
        )}
        {dayData?.week?.mental_playlist_url && (
          <PlaylistCard title="Vibración Mental" url={dayData.week.mental_playlist_url} />
        )}

        {hasLecturas && (
          <section className="glass-card rounded-xl p-4 border border-primary/10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lecturas</p>
              <Link to={`/lecturas?dayId=${dayId}`} className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                Ver todo <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {lecturasPreview.map((item) => (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 py-2 px-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground truncate">{item.title}</span>
                  <span className="text-[9px] text-muted-foreground uppercase shrink-0">{item.type}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="glass-card rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Materiales</p>
          {dayData?.week?.schedule_image_url && (
            <Link to={`/reto/${weekId}`} className="flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg text-sm text-secondary-foreground">
              <Calendar className="w-4 h-4 text-primary" /> Ver cronograma semanal
            </Link>
          )}
          {dayData?.week?.audio_url && (
            <Link to={`/reto/${weekId}`} className="flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg text-sm text-secondary-foreground">
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
