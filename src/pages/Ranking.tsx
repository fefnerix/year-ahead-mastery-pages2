import BottomNav from "@/components/BottomNav";
import { Crown, Medal, Trophy } from "lucide-react";
import { useState } from "react";

const tabs = ["Semana", "Mes", "Año"] as const;

const generateRanking = () => [
  { position: 1, name: "María García", score: 2450, change: 0 },
  { position: 2, name: "Carlos Rodríguez", score: 2380, change: 2 },
  { position: 3, name: "Ana López", score: 2310, change: -1 },
  { position: 4, name: "Tu", score: 2280, change: 1, isCurrentUser: true },
  { position: 5, name: "Pedro Martínez", score: 2200, change: -2 },
  { position: 6, name: "Laura Sánchez", score: 2150, change: 0 },
  { position: 7, name: "Diego Torres", score: 2100, change: 3 },
  { position: 8, name: "Sofia Hernández", score: 2050, change: -1 },
  { position: 9, name: "Miguel Ángel R.", score: 2000, change: 0 },
  { position: 10, name: "Isabel Moreno", score: 1950, change: -1 },
];

const positionIcons: Record<number, React.ReactNode> = {
  1: <Crown className="w-5 h-5 text-primary" />,
  2: <Medal className="w-5 h-5 text-secondary-foreground" />,
  3: <Trophy className="w-5 h-5 text-streak" />,
};

const Ranking = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Semana");
  const ranking = generateRanking();

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
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="divide-y divide-border/30">
            {ranking.map((entry) => (
              <div
                key={entry.position}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                  entry.isCurrentUser ? "bg-primary/5 gold-border" : ""
                }`}
              >
                <div className="w-8 flex justify-center">
                  {positionIcons[entry.position] || (
                    <span className="text-sm font-bold text-muted-foreground">{entry.position}</span>
                  )}
                </div>
                <div className="flex-1">
                  <span className={`text-sm ${entry.isCurrentUser ? "font-bold text-primary" : "font-medium text-foreground"}`}>
                    {entry.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-foreground tabular-nums">{entry.score}</span>
                <span className={`text-xs font-semibold w-6 text-right ${
                  entry.change > 0 ? "text-success" : entry.change < 0 ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {entry.change > 0 ? `↑${entry.change}` : entry.change < 0 ? `↓${Math.abs(entry.change)}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reglas del Ranking</h3>
          <ul className="text-xs text-secondary-foreground space-y-1">
            <li>• Cada tarea completada = 10 puntos</li>
            <li>• Bono 5/5 tareas del día = +20 puntos</li>
            <li>• Streak diario activo = +5 puntos/día</li>
            <li>• Ventana retroactiva: 48 horas</li>
          </ul>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Ranking;
