import BottomNav from "@/components/BottomNav";
import { Crown, Medal, Trophy, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAuth } from "@/hooks/useAuth";

const tabs = ["Semana", "Mes", "Año"] as const;
const periodMap: Record<typeof tabs[number], "week" | "month" | "year"> = {
  Semana: "week",
  Mes: "month",
  Año: "year",
};

const positionIcons: Record<number, React.ReactNode> = {
  1: <Crown className="w-5 h-5 text-primary" />,
  2: <Medal className="w-5 h-5 text-secondary-foreground" />,
  3: <Trophy className="w-5 h-5 text-streak" />,
};

const Ranking = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Semana");
  const { user } = useAuth();
  const { data: ranking = [], isLoading } = useLeaderboard(periodMap[activeTab]);

  const currentUserEntry = ranking.find((e) => e.user_id === user?.id);
  const nextAbove = currentUserEntry
    ? ranking.find((e) => e.position === currentUserEntry.position - 1)
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Ranking</h1>
        <p className="text-sm text-muted-foreground mt-1">Compite con consistencia, no velocidad</p>
      </header>

      <div className="px-5 mb-5">
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
      </div>

      <main className="px-5">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : ranking.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-muted-foreground">No hay datos de ranking todavía.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Completa tareas para aparecer aquí.</p>
          </div>
        ) : (
          <>
            {/* User position summary */}
            {currentUserEntry && (
              <div className="glass-card gold-border rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Tu posición</p>
                    <p className="text-2xl font-bold text-primary">#{currentUserEntry.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Puntos</p>
                    <p className="text-2xl font-bold text-foreground">{currentUserEntry.score}</p>
                  </div>
                  {nextAbove && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Para subir</p>
                      <p className="text-lg font-bold text-primary">+{nextAbove.score - currentUserEntry.score + 1}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="glass-card rounded-xl overflow-hidden">
              <div className="divide-y divide-border/30">
                {ranking.map((entry) => {
                  const isMe = entry.user_id === user?.id;
                  return (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                        isMe ? "bg-primary/5 gold-border" : ""
                      }`}
                    >
                      <div className="w-8 flex justify-center">
                        {positionIcons[entry.position] || (
                          <span className="text-sm font-bold text-muted-foreground">{entry.position}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm ${isMe ? "font-bold text-primary" : "font-medium text-foreground"}`}>
                          {isMe ? "Tú" : entry.display_name}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-foreground tabular-nums">{entry.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="glass-card rounded-xl p-4 mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reglas del Ranking</h3>
          <ul className="text-xs text-secondary-foreground space-y-1">
            <li>• Cada tarea completada = 1 punto</li>
            <li>• Día completo (5/5) = +2 puntos bono</li>
            <li>• Semana completa (7/7) = +10 puntos bono</li>
            <li>• Desempate: % conclusión → streak → semanas completas</li>
          </ul>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Ranking;
