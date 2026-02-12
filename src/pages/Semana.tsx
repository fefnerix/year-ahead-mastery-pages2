import BottomNav from "@/components/BottomNav";
import { CalendarDays, Lock } from "lucide-react";

const days = [
  { day: 1, label: "Lun", completed: true, progress: 100 },
  { day: 2, label: "Mar", completed: true, progress: 100 },
  { day: 3, label: "Mié", completed: true, progress: 80 },
  { day: 4, label: "Jue", completed: false, progress: 60, isToday: true },
  { day: 5, label: "Vie", completed: false, progress: 0, locked: true },
  { day: 6, label: "Sáb", completed: false, progress: 0, locked: true },
  { day: 7, label: "Dom", completed: false, progress: 0, locked: true },
];

const Semana = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Reto 3</p>
        <h1 className="text-3xl font-display font-bold text-foreground mt-1">Semana 12</h1>
        <p className="text-sm text-muted-foreground mt-1">Progreso semanal: <span className="text-gold-light font-medium">57%</span></p>
      </header>

      <main className="px-5 space-y-3">
        {days.map((d) => (
          <div
            key={d.day}
            className={`glass-card rounded-xl p-4 flex items-center gap-4 transition-all ${
              d.isToday ? "gold-border gold-glow" : ""
            } ${d.locked ? "opacity-50" : ""}`}
          >
            <div className="flex flex-col items-center w-10">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.label}</span>
              <span className={`text-lg font-bold ${d.isToday ? "text-primary" : "text-foreground"}`}>{d.day}</span>
            </div>
            <div className="flex-1">
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gold-gradient rounded-full transition-all duration-500"
                  style={{ width: `${d.progress}%` }}
                />
              </div>
            </div>
            <div className="w-8 flex justify-center">
              {d.locked ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : d.completed ? (
                <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                  <span className="text-[10px] font-bold text-success-foreground">✓</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-primary">{d.progress}%</span>
              )}
            </div>
          </div>
        ))}

        <div className="glass-card rounded-xl p-4 mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Materiales de la Semana
          </h3>
          <div className="space-y-2">
            {["Guía de la semana (PDF)", "Cronograma semanal", "Recurso: Meditación guiada"].map((m, i) => (
              <div key={i} className="text-sm text-secondary-foreground py-1.5 px-3 bg-muted/50 rounded-lg">
                {m}
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Semana;
