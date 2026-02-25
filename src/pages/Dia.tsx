import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDayTasks, useToggleDayTask, TaskWithCheck } from "@/hooks/useDayTasks";
import { useTaskNotes, useSaveNote } from "@/hooks/useTaskNotes";
import { useUpdateStreak } from "@/hooks/useTodayData";
import { useCalculateScore } from "@/hooks/useLeaderboard";
import BottomNav from "@/components/BottomNav";
import DailyChecklist from "@/components/DailyChecklist";
import PlaylistCard from "@/components/PlaylistCard";
import JournalInput from "@/components/JournalInput";
import { ArrowLeft, Sparkles, Loader2, Calendar, Headphones, FileText, ArrowRight, BookOpen, Target, Check } from "lucide-react";
import { useState, useEffect } from "react";

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
  const { data: notesData = [] } = useTaskNotes(dayId);
  const saveNote = useSaveNote();
  const toggleTask = useToggleDayTask(dayId);

  // Lecturas for this day
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

  // Local notes state
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    notesData.forEach((n) => { map[n.task_id] = n.content; });
    setLocalNotes(map);
  }, [notesData]);

  const totalTasks = tasks.length || 2;
  const completedCount = tasks.filter((t) => t.completed).length;
  const dayProgress = Math.min(100, Math.max(0, Math.round((completedCount / totalTasks) * 100)));
  const allCompleted = tasks.length > 0 && completedCount >= totalTasks;

  const prayerTask = tasks.find((t) => t.task_kind === "prayer");
  const activityTask = tasks.find((t) => t.task_kind === "activity");

  const handleToggle = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) toggleTask.mutate(task);
  };

  const handleCompleteDay = async () => {
    updateStreak.mutate();
    calculateScore.mutate();
  };

  const handleNoteChange = (taskId: string, content: string) => {
    setLocalNotes((prev) => ({ ...prev, [taskId]: content }));
  };

  const handleNoteSave = (taskId: string, content: string) => {
    if (dayId) {
      saveNote.mutate({ taskId, dayId, content });
    }
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

        {/* Reflexión del día */}
        {dayData?.day?.date && (
          <JournalInput
            date={dayData.day.date}
            dayId={dayId}
            weekId={weekId}
          />
        )}

        {/* Playlists */}
        {dayData?.week?.spiritual_playlist_url && (
          <PlaylistCard title="Vibración Espiritual" url={dayData.week.spiritual_playlist_url} />
        )}
        {dayData?.week?.mental_playlist_url && (
          <PlaylistCard title="Vibración Mental" url={dayData.week.mental_playlist_url} />
        )}

        {/* Lecturas */}
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
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-2 px-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground truncate">{item.title}</span>
                  <span className="text-[9px] text-muted-foreground uppercase shrink-0">{item.type}</span>
                </a>
              ))}
            </div>
          </section>
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
