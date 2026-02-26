import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, Lock } from "lucide-react";
import { toast } from "sonner";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Cycle order: Mar(3)..Dec(12), Jan(1), Feb(2)
const CYCLE_ORDER = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2];

interface YearMonth {
  month_id: string;
  month_number: number;
  month_name: string;
  month_theme: string;
  month_pct: number;
}

const CalendarioAno = () => {
  const { user } = useAuth();

  // Get program for the current (or most recent) year
  const { data: program } = useQuery({
    queryKey: ["program-for-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("id, year, start_date")
        .order("year", { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const programYear = program?.year ?? new Date().getFullYear();

  const { data: months = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["year_calendar", programYear, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_year_calendar", {
        p_user_id: user!.id,
        p_year: programYear,
      });
      if (error) throw error;
      return (data as unknown as YearMonth[]) ?? [];
    },
    enabled: !!user && !!program,
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Determine if a month is in the future based on the cycle
  // Program starts March of programYear, ends February of programYear+1
  const isMonthFuture = (monthNumber: number): boolean => {
    const currentY = now.getFullYear();
    const currentM = now.getMonth() + 1;
    // Months 3-12 belong to programYear, months 1-2 belong to programYear+1
    const monthYear = monthNumber >= 3 ? programYear : programYear + 1;
    if (currentY < monthYear) return true;
    if (currentY > monthYear) return false;
    return currentM < monthNumber;
  };

  const handleFutureClick = (monthNumber: number) => {
    const name = MONTH_NAMES[monthNumber - 1];
    const year = monthNumber >= 3 ? programYear : programYear + 1;
    toast.info(`Disponible en ${name} ${year}`);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <Logo variant="compact" />
        </div>
      </header>

      <main className="px-5 space-y-6 pt-2">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Calendario {programYear}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tu progreso anual mes a mes</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 h-[112px] animate-pulse bg-muted/30" />
            ))}
          </div>
        ) : isError ? (
          <div className="glass-card rounded-2xl p-6 text-center space-y-3 border border-muted/20">
            <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Error al cargar el calendario.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors press-scale"
            >
              Reintentar
            </button>
          </div>
        ) : months.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center border border-muted/20">
            <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No hay programa configurado aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {months.map((m) => {
              const pct = Math.min(100, Math.max(0, Math.round(m.month_pct ?? 0)));
              const isCurrentMonth = m.month_number === currentMonth;
              const isFuture = isMonthFuture(m.month_number);

              if (isFuture) {
                return (
                  <button
                    key={m.month_id}
                    onClick={() => handleFutureClick(m.month_number)}
                    className="glass-card rounded-2xl p-4 border border-primary/10 opacity-50 text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {MONTH_NAMES[m.month_number - 1] ?? `Mes ${m.month_number}`}
                      </p>
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate leading-snug">
                      {m.month_name}
                    </p>
                    {m.month_theme && (
                      <p className="text-[11px] text-primary mt-0.5 truncate">{m.month_theme}</p>
                    )}
                  </button>
                );
              }

              return (
                <Link
                  key={m.month_id}
                  to={`/mes/${m.month_id}`}
                  className={`glass-card rounded-2xl p-4 border transition-all duration-200 press-scale ${
                    isCurrentMonth
                      ? "border-primary/40 ring-1 ring-primary/20"
                      : "border-primary/10 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {MONTH_NAMES[m.month_number - 1] ?? `Mes ${m.month_number}`}
                    </p>
                    {isCurrentMonth && (
                      <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full gold-gradient text-primary-foreground">
                        Ahora
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate leading-snug">
                    {m.month_name}
                  </p>
                  {m.month_theme && (
                    <p className="text-[11px] text-primary mt-0.5 truncate">{m.month_theme}</p>
                  )}
                  <p className="text-2xl font-bold text-primary mt-2 leading-none">{pct}%</p>
                  <div className="h-1 rounded-full bg-white/5 mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full gold-gradient"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default CalendarioAno;
