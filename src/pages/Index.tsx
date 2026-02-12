import ProgressRing from "@/components/ProgressRing";
import StreakBadge from "@/components/StreakBadge";
import DailyChecklist from "@/components/DailyChecklist";
import MiniRanking from "@/components/MiniRanking";
import BottomNav from "@/components/BottomNav";
import AudioPlayer from "@/components/AudioPlayer";
import PlaylistCard from "@/components/PlaylistCard";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import DepositCard from "@/components/DepositCard";
import Logo from "@/components/Logo";
import { Sparkles, Loader2, ArrowRight, ChevronDown, ChevronUp, Image as ImageIcon, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  useProgress,
  useTodayTasks,
  useToggleTask,
  useStreak,
  useUpdateStreak,
} from "@/hooks/useTodayData";
import { useLeaderboard, useCalculateScore } from "@/hooks/useLeaderboard";
import { useCurrentWeekData } from "@/hooks/useCurrentWeekData";

const Index = () => {
  const { user } = useAuth();
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: tasks = [], isLoading: tasksLoading } = useTodayTasks(progress?.day_id);
  const toggleTask = useToggleTask(progress?.day_id);
  const { data: streak } = useStreak();
  const updateStreak = useUpdateStreak();
  const calculateScore = useCalculateScore();
  const { data: leaderboard = [] } = useLeaderboard("week");
  const { data: weekData } = useCurrentWeekData();
  const [descExpanded, setDescExpanded] = useState(false);
  const [scheduleFullscreen, setScheduleFullscreen] = useState(false);

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

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";
  const initials = displayName.slice(0, 2).toUpperCase();

  const hasDayData = progress?.day_id != null;

  const rankingEntries = leaderboard.slice(0, 5).map((e) => ({
    position: e.position,
    name: e.display_name,
    score: e.score,
    isCurrentUser: e.user_id === user?.id,
  }));
  const currentUserPos = leaderboard.find((e) => e.user_id === user?.id)?.position ?? 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 1. Header */}
      <header className="px-5 pt-12 pb-2">
        <div className="flex items-center justify-between">
          <Logo variant="compact" />
          <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">{initials}</span>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-5">
        {/* 2. Greeting */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Hola, {displayName} 👋
          </h1>
          {progress?.month_theme && (
            <p className="text-sm text-muted-foreground mt-1">
              Enfoque: <span className="text-primary font-medium">{progress.month_theme}</span>
            </p>
          )}
        </div>

        {/* Announcements */}
        <AnnouncementBanner />

        {/* 3. Reto Banner (Hero) */}
        {weekData && (
          <Link
            to={`/reto/${weekData.id}`}
            className="block glass-card gold-border rounded-xl overflow-hidden"
          >
            {weekData.cover_url && (
              <div className="relative h-32">
                <img src={weekData.cover_url} alt={weekData.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
            )}
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Reto {weekData.number} — Semana {weekData.number}
              </p>
              <h2 className="text-lg font-display font-bold text-foreground mt-1">{weekData.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold text-primary flex items-center gap-1">
                  Continuar hoy <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* 4. Audio Player */}
        {weekData?.audio_url && (
          <AudioPlayer src={weekData.audio_url} title="Audio de introducción" />
        )}

        {/* 5. Description (collapsible) */}
        {weekData?.description_long && (
          <div className="glass-card rounded-xl p-4">
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <p className="text-sm font-semibold text-foreground">Sobre este reto</p>
              {descExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {descExpanded && (
              <p className="text-sm text-secondary-foreground mt-3 whitespace-pre-wrap leading-relaxed">
                {weekData.description_long}
              </p>
            )}
            {!descExpanded && (
              <p className="text-xs text-muted-foreground mt-1">Toca para leer más</p>
            )}
          </div>
        )}

        {/* 6. Daily Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold text-foreground">Tus Tareas de Hoy</h2>
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

        {/* 7. Playlists */}
        {weekData?.spiritual_playlist_url && (
          <PlaylistCard title="Vibración Espiritual" subtitle={weekData.name} url={weekData.spiritual_playlist_url} />
        )}
        {weekData?.mental_playlist_url && (
          <PlaylistCard title="Vibración Mental" subtitle={weekData.name} url={weekData.mental_playlist_url} />
        )}

        {/* 8. Schedule Image */}
        {weekData?.schedule_image_url && (
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" /> Cronograma Semanal
              </p>
              <button
                onClick={() => setScheduleFullscreen(true)}
                className="text-xs text-primary font-semibold"
              >
                Ver completo
              </button>
            </div>
            <img
              src={weekData.schedule_image_url}
              alt="Cronograma"
              className="w-full rounded-lg cursor-pointer"
              onClick={() => setScheduleFullscreen(true)}
            />
          </div>
        )}

        {/* Deposit Card */}
        <DepositCard />

        {/* Streak */}
        <StreakBadge current={streak?.current_streak ?? 0} record={streak?.max_streak ?? 0} />

        {/* 9. Progress Rings */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-around">
            <ProgressRing progress={hasDayData ? dayProgress : 0} label="Hoy" size={76} strokeWidth={5} />
            <ProgressRing progress={progress?.week_pct ?? 0} label="Semana" size={64} strokeWidth={4} />
            <ProgressRing progress={progress?.month_pct ?? 0} label="Mes" size={64} strokeWidth={4} />
            <ProgressRing progress={progress?.year_pct ?? 0} label="Año" size={64} strokeWidth={4} />
          </div>
        </div>

        {/* 10. Mini Ranking */}
        <section>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">Ranking Semanal</h2>
          {rankingEntries.length > 0 ? (
            <MiniRanking entries={rankingEntries} currentUserPosition={currentUserPos} />
          ) : (
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">Completa tareas para aparecer en el ranking</p>
            </div>
          )}
        </section>
      </main>

      {/* Schedule Fullscreen Modal */}
      {scheduleFullscreen && weekData?.schedule_image_url && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
          <button
            onClick={() => setScheduleFullscreen(false)}
            className="absolute top-6 right-6 text-foreground bg-card rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={weekData.schedule_image_url}
            alt="Cronograma"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Index;
