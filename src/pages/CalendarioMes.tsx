import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const CalendarioMes = () => {
  const { year, month } = useParams<{ year: string; month: string }>();
  const { user } = useAuth();
  const monthNum = Number(month);
  const yearNum = Number(year);

  const isValid = monthNum >= 1 && monthNum <= 12 && !isNaN(yearNum);

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-month-detail", yearNum, monthNum, user?.id],
    queryFn: async () => {
      // Get the month record
      const { data: monthData, error: monthErr } = await supabase
        .from("months")
        .select("id, name, theme, number")
        .eq("number", monthNum)
        .limit(1)
        .maybeSingle();

      if (monthErr) throw monthErr;
      if (!monthData) return null;

      // Get weeks for this month
      const { data: weeks, error: weeksErr } = await supabase
        .from("weeks")
        .select("id, name, number, status")
        .eq("month_id", monthData.id)
        .order("number", { ascending: true });

      if (weeksErr) throw weeksErr;

      // Get days for all weeks
      const weekIds = (weeks ?? []).map((w) => w.id);
      const { data: days } = weekIds.length > 0
        ? await supabase
            .from("days")
            .select("id, number, date, unlock_date, week_id")
            .in("week_id", weekIds)
            .order("number", { ascending: true })
        : { data: [] };

      // Get user's checks for these days
      const dayIds = (days ?? []).map((d) => d.id);
      const { data: checks } = dayIds.length > 0 && user
        ? await supabase
            .from("task_checks")
            .select("id, day_id")
            .in("day_id", dayIds)
            .eq("user_id", user.id)
        : { data: [] };

      // Get tasks count per day
      const { data: tasks } = dayIds.length > 0
        ? await supabase
            .from("tasks")
            .select("id, day_id")
            .in("day_id", dayIds)
        : { data: [] };

      // Aggregate
      const checksByDay: Record<string, number> = {};
      const tasksByDay: Record<string, number> = {};

      (checks ?? []).forEach((c) => {
        checksByDay[c.day_id] = (checksByDay[c.day_id] ?? 0) + 1;
      });
      (tasks ?? []).forEach((t) => {
        tasksByDay[t.day_id] = (tasksByDay[t.day_id] ?? 0) + 1;
      });

      return {
        month: monthData,
        weeks: (weeks ?? []).map((w) => ({
          ...w,
          days: (days ?? [])
            .filter((d) => d.week_id === w.id)
            .map((d) => ({
              ...d,
              completed: checksByDay[d.id] ?? 0,
              total: tasksByDay[d.id] ?? 0,
            })),
        })),
      };
    },
    enabled: isValid && !!user,
  });

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background pb-24 flex flex-col items-center justify-center px-5">
        <p className="text-lg font-bold text-foreground">Mes no válido</p>
        <p className="text-sm text-muted-foreground mt-2">El mes debe estar entre 1 y 12.</p>
        <Link to="/calendario" className="mt-4 text-primary text-sm font-semibold hover:underline">
          ← Volver al calendario
        </Link>
        <BottomNav />
      </div>
    );
  }

  const TOTAL_TASKS_PER_DAY = 5;
  const monthName = MONTH_NAMES[monthNum - 1] ?? `Mes ${monthNum}`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <Link to="/calendario" className="w-9 h-9 rounded-full bg-card border border-primary/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">{monthName}</h1>
            {data?.month?.theme && (
              <p className="text-xs text-primary">{data.month.theme}</p>
            )}
          </div>
        </div>
      </header>

      <main className="px-5 space-y-6 pt-3">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 h-28 animate-pulse bg-muted" />
            ))}
          </div>
        ) : !data ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">No hay datos para este mes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.weeks.map((w) => (
              <div key={w.id} className="glass-card rounded-2xl p-4 border border-primary/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{w.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Semana {w.number} · {w.status}
                    </p>
                  </div>
                  <Link
                    to={`/reto/${w.id}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Ver reto
                  </Link>
                </div>
                <div className="flex gap-2">
                  {w.days.map((d) => {
                    const pct = Math.min(100, Math.round((d.completed / TOTAL_TASKS_PER_DAY) * 100));
                    const isComplete = d.completed >= TOTAL_TASKS_PER_DAY;
                    return (
                      <div
                        key={d.id}
                        className={`flex-1 rounded-xl p-2 text-center border transition-colors ${
                          isComplete
                            ? "border-primary/40 bg-primary/10"
                            : d.total > 0
                            ? "border-primary/10 bg-card"
                            : "border-muted bg-muted/30"
                        }`}
                      >
                        <p className="text-[10px] text-muted-foreground">D{d.number}</p>
                        <p className={`text-sm font-bold ${isComplete ? "text-primary" : "text-foreground"}`}>
                          {d.total > 0 ? `${pct}%` : "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default CalendarioMes;
