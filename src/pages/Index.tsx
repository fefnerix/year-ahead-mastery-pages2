import { useState } from "react";
import ProgressRing from "@/components/ProgressRing";
import StreakBadge from "@/components/StreakBadge";
import DailyChecklist from "@/components/DailyChecklist";
import MiniRanking from "@/components/MiniRanking";
import BottomNav from "@/components/BottomNav";
import { Sparkles } from "lucide-react";

const mockTasks = [
  { id: "1", title: "30 min de ejercicio físico", category: "cuerpo" as const, completed: false },
  { id: "2", title: "Leer 10 páginas del libro del mes", category: "mente" as const, completed: false },
  { id: "3", title: "Meditación guiada de 10 min", category: "alma" as const, completed: false },
  { id: "4", title: "Registrar gastos del día", category: "finanzas" as const, completed: false },
  { id: "5", title: "Escribir 3 gratitudes", category: "alma" as const, completed: false },
];

const mockRanking = [
  { position: 1, name: "María G.", score: 2450 },
  { position: 2, name: "Carlos R.", score: 2380 },
  { position: 3, name: "Ana L.", score: 2310 },
  { position: 4, name: "Tu", score: 2280, isCurrentUser: true },
  { position: 5, name: "Pedro M.", score: 2200 },
];

const Index = () => {
  const [tasks, setTasks] = useState(mockTasks);

  const completedCount = tasks.filter((t) => t.completed).length;
  const dayProgress = Math.round((completedCount / tasks.length) * 100);

  const handleToggle = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const allCompleted = completedCount === tasks.length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Reto 3 · Semana 12
            </p>
            <h1 className="text-3xl font-display font-bold text-foreground mt-1">
              Día 78
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">JR</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Enfoque del mes: <span className="text-gold-light font-medium">Disciplina Mental</span>
        </p>
      </header>

      <main className="px-5 space-y-5">
        {/* Progress Rings */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-around">
            <ProgressRing progress={dayProgress} label="Hoy" size={76} strokeWidth={5} />
            <ProgressRing progress={72} label="Semana" size={64} strokeWidth={4} />
            <ProgressRing progress={68} label="Mes" size={64} strokeWidth={4} />
            <ProgressRing progress={74} label="Año" size={64} strokeWidth={4} />
          </div>
        </div>

        {/* Streak */}
        <StreakBadge current={12} record={34} />

        {/* Daily Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold text-foreground">Tareas de Hoy</h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {completedCount}/{tasks.length}
            </span>
          </div>
          <DailyChecklist tasks={tasks} onToggle={handleToggle} />
        </section>

        {/* Complete Day Button */}
        {allCompleted && (
          <button className="w-full py-4 rounded-xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2 gold-glow shimmer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <Sparkles className="w-4 h-4" />
            Concluir Día
          </button>
        )}

        {/* Mini Ranking */}
        <section>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">Ranking</h2>
          <MiniRanking entries={mockRanking} currentUserPosition={4} />
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
