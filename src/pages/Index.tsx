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
import { useIsAdmin } from "@/hooks/useAdmin";

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
  const { data: isAdmin } = useIsAdmin();
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
      {/* Header */}
      <header className="px-5 pt-12 pb-3 border-b border-primary/15">
        <div className="flex items-center justify-between">
          <Logo variant="compact" />
          <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center ring-2 ring-primary/20">
            <span className="text-sm font-bold text-primary-foreground">{initials}</span>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-6 pt-5">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Hola, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Hoy avanzas un paso.</p>
        </div>

        {/* Announcements */}
        <AnnouncementBanner />

        {/* Hero del Reto Activo */}
        {weekData && (
          <Link
            to={`/reto/${weekData.id}`}
            className="block rounded-2xl overflow-hidden relative"
          >
            <div className="relative h-44">
              {weekData.cover_url ? (
                <img src={weekData.cover_url} alt={weekData.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gold-gradient opacity-30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <span className="inline-flex self-start px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-card/80 text-muted-foreground backdrop-blur-sm mb-3">
                  Día {progress?.day_number ?? "—"} de 7
                </span>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                  Reto {weekData.number}
                </p>
                <h2 className="text-xl font-display font-bold text-foreground">{weekData.name}</h2>
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-wider">
                    Continuar <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Audio */}
        {weekData?.audio_url && (
          <AudioPlayer src={weekData.audio_url} title="Escucha la intro" />
        )}

        {/* Description */}
        {weekData?.description_long && (
          <div className="glass-card rounded-2xl p-4">
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
              <p className="text-xs text-muted-foreground mt-1">Leer más</p>
            )}
          </div>
        )}

        {/* Tareas de Hoy */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="section-title">Tus tareas de hoy</h2>
            <span className="text-xs font-bold text-muted-foreground tabular-nums">
              {completedCount}/{tasks.length}
            </span>
          </div>

          {/* Progress bar */}
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
              <p className="text-sm font-medium text-foreground">Aún no empieza tu reto.</p>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient text-primary-foreground text-xs font-bold"
                >
                  Activar reto
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground">El reto será activado pronto.</p>
              )}
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
            className="w-full py-4 rounded-2xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2 gold-glow shimmer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {updateStreak.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Concluir Día
          </button>
        )}

        {/* Playlists */}
        {weekData?.spiritual_playlist_url && (
          <PlaylistCard title="Vibración Espiritual" subtitle={weekData.name} url={weekData.spiritual_playlist_url} />
        )}
        {weekData?.mental_playlist_url && (
          <PlaylistCard title="Vibración Mental" subtitle={weekData.name} url={weekData.mental_playlist_url} />
        )}

        {/* Schedule Image */}
        {weekData?.schedule_image_url && (
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" /> Cronograma
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
              className="w-full rounded-xl cursor-pointer"
              onClick={() => setScheduleFullscreen(true)}
            />
          </div>
        )}

        {/* Deposit */}
        <DepositCard />

        {/* Streak */}
        <StreakBadge current={streak?.current_streak ?? 0} record={streak?.max_streak ?? 0} />

        {/* Progress */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex flex-col items-center gap-4">
            <ProgressRing progress={hasDayData ? dayProgress : 0} label="Hoy" size={88} strokeWidth={6} />
            <div className="flex items-center gap-3 w-full">
              <ProgressChip label="Semana" value={progress?.week_pct ?? 0} />
              <ProgressChip label="Mes" value={progress?.month_pct ?? 0} />
              <ProgressChip label="Año" value={progress?.year_pct ?? 0} />
            </div>
          </div>
        </div>

        {/* Ranking */}
        <section>
          <h2 className="section-title mb-3">Ranking</h2>
          {rankingEntries.length > 0 ? (
            <MiniRanking entries={rankingEntries} currentUserPosition={currentUserPos} />
          ) : (
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="text-sm text-muted-foreground">Completa tu primer día para entrar al ranking.</p>
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
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        </div>
      )}

      <BottomNav />
    </div>
  );
};

const ProgressChip = ({ label, value }: { label: string; value: number }) => (
  <div className="flex-1 glass-card rounded-xl py-2.5 px-3 text-center">
    <p className="text-lg font-bold text-foreground tabular-nums">{value}%</p>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
  </div>
);

export default Index;
