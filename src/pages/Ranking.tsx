import BottomNav from "@/components/BottomNav";
import { Crown, Medal, Trophy, Loader2, Flame, TrendingUp, Target, Award } from "lucide-react";
import { useState } from "react";
import { useLeaderboard, useRankingSummary } from "@/hooks/useLeaderboard";
import { useAuth } from "@/hooks/useAuth";

const tabs = ["Hoy", "Mes", "Total"] as const;
const scopeMap: Record<typeof tabs[number], "day" | "month" | "total"> = {
  Hoy: "day",
  Mes: "month",
  Total: "total",
};

const positionIcons: Record<number, React.ReactNode> = {
  1: <Crown className="w-5 h-5 text-primary" />,
  2: <Medal className="w-5 h-5 text-secondary-foreground" />,
  3: <Trophy className="w-5 h-5 text-streak" />,
};

const ProgressBar = ({ value, max, label }: { value: number; max: number; label: string }) => {
  const pct = max > 0 ? Math.min(100, Math.round(((value / max) * 100) * 100) / 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-xs text-foreground tabular-nums">
          <span className="font-bold">{value}/{max}</span>
          <span className="text-muted-foreground ml-1.5">({pct}%)</span>
        </span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full gold-gradient rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const Ranking = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Hoy");
  const { user } = useAuth();
  const { data: ranking = [], isLoading } = useLeaderboard(scopeMap[activeTab]);
  const { data: summary } = useRankingSummary();

  const currentUserEntry = ranking.find((e) => e.user_id === user?.id);
  const nextAbove = currentUserEntry
    ? ranking.find((e) => e.position === currentUserEntry.position - 1)
    : null;

  const top10 = ranking.slice(0, 10);
  const userInTop10 = top10.some((e) => e.user_id === user?.id);
  const displayRanking = userInTop10
    ? top10
    : [...top10, ...(currentUserEntry ? [currentUserEntry] : [])];

  const pointsToNext = nextAbove && currentUserEntry
    ? nextAbove.points - currentUserEntry.points + 1
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Ranking</h1>
      </header>

      <main className="px-5 space-y-4">
        {/* Tu Posición card */}
        <div className="glass-card gold-border rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Posición</p>
              <p className="text-4xl font-display font-bold gold-text">
                #{summary?.position || "—"}
              </p>
            </div>
            <div className="flex-1 space-y-1 pl-4 border-l border-border/30">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm text-foreground">
                  <span className="font-bold">{summary?.total_points ?? 0}</span>
                  <span className="text-muted-foreground ml-1">puntos</span>
                </span>
              </div>
              {pointsToNext && nextAbove ? (
                <p className="text-xs text-muted-foreground">
                  Te faltan <span className="text-primary font-bold">+{pointsToNext}</span> para pasar a <span className="font-semibold text-foreground">{nextAbove.display_name}</span>
                </p>
              ) : (summary?.position ?? 0) === 1 ? (
                <p className="text-xs text-primary font-semibold flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> ¡Estás #1!</p>
              ) : (
                <p className="text-xs text-muted-foreground">Completa tareas para subir</p>
              )}
            </div>
          </div>
        </div>

        {/* Mi Progreso: barras X/2, X/60, X/730 + streak */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mi Progreso</h2>
          <ProgressBar value={summary?.today_points ?? 0} max={2} label="Puntos hoy" />
          <ProgressBar value={summary?.month_points ?? 0} max={60} label="Puntos mes" />
          <ProgressBar value={summary?.total_points ?? 0} max={730} label="Puntos total" />

          <div className="flex gap-3 pt-1">
            <div className="glass-card rounded-xl p-3 text-center flex-1">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Flame className="w-4 h-4 text-streak" />
                <span className="text-lg font-bold text-foreground tabular-nums">{summary?.streak ?? 0}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Racha</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center flex-1">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold text-foreground tabular-nums">{summary?.max_streak ?? 0}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Récord</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center flex-1">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold text-foreground tabular-nums">
                  {Math.round(((summary?.total_points ?? 0) / 730) * 10000) / 100}%
                </span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Ciclo</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : ranking.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-muted-foreground">Aún no hay ranking.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Completa tu primera tarea para entrar.</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="divide-y divide-border/30">
              {displayRanking.map((entry, idx) => {
                const isMe = entry.user_id === user?.id;
                const showSeparator = !userInTop10 && idx === top10.length && currentUserEntry;
                return (
                  <div key={entry.user_id}>
                    {showSeparator && (
                      <div className="px-4 py-1.5 text-center text-[10px] text-muted-foreground bg-muted/30">···</div>
                    )}
                    <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                      <div className="w-7 flex justify-center shrink-0">
                        {positionIcons[entry.position] || (
                          <span className="text-sm font-bold text-muted-foreground">{entry.position}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm block truncate ${isMe ? "font-bold text-primary" : "font-medium text-foreground"}`}>
                          {isMe ? "Tú" : entry.display_name}
                        </span>
                      </div>
                      {entry.streak > 0 && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Flame className="w-3 h-3 text-streak" />
                          <span className="text-[10px] font-bold text-streak tabular-nums">{entry.streak}</span>
                        </div>
                      )}
                      <span className="text-sm font-bold text-foreground tabular-nums shrink-0">{entry.points}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reglas */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reglas</h3>
          <ul className="text-xs text-secondary-foreground space-y-1">
            <li>• 1 tarea = 1 punto</li>
            <li>• Máximo: 2 puntos/día</li>
            <li>• Desempate: más puntos → mayor racha → fecha de última tarea</li>
          </ul>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Ranking;
