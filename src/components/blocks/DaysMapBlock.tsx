import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

const dayLabels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface DaysMapBlockProps {
  config: Record<string, any>;
  weekId: string;
  days?: Array<{
    id: string;
    number: number;
    date: string;
    unlock_date: string;
    tasks_total: number;
    tasks_completed: number;
    is_unlocked: boolean;
    is_today: boolean;
  }>;
}

const DaysMapBlock = ({ config, weekId, days = [] }: DaysMapBlockProps) => {
  const navigate = useNavigate();
  const { lock_future_days = true } = config;

  if (days.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-display font-bold text-foreground mb-3">Días</h2>
      <div className="space-y-2">
        {days.map((day) => {
          const pct = day.tasks_total > 0 ? Math.round((day.tasks_completed / day.tasks_total) * 100) : 0;
          const isComplete = day.tasks_total > 0 && day.tasks_completed === day.tasks_total;
          const locked = lock_future_days && !day.is_unlocked;

          return (
            <button
              key={day.id}
              disabled={locked}
              onClick={() => navigate(`/reto/${weekId}/dia/${day.number}`)}
              className={`w-full glass-card rounded-xl p-4 flex items-center gap-4 transition-all text-left ${
                day.is_today ? "gold-border gold-glow" : ""
              } ${locked ? "opacity-50" : "hover:border-primary/30"}`}
            >
              <div className="flex flex-col items-center w-12">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {dayLabels[day.number - 1]?.slice(0, 3)}
                </span>
                <span className={`text-lg font-bold ${day.is_today ? "text-primary" : "text-foreground"}`}>
                  {day.number}
                </span>
              </div>
              <div className="flex-1">
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full gold-gradient rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {day.tasks_completed}/{day.tasks_total} tareas
                </span>
              </div>
              <div className="w-8 flex justify-center">
                {locked ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : isComplete ? (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-foreground">✓</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-primary">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default DaysMapBlock;
