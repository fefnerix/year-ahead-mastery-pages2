import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays } from "lucide-react";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface YearMonth {
  month_id: string;
  month_number: number;
  month_name: string;
  month_theme: string;
  month_pct: number;
}

const currentMonth = new Date().getMonth() + 1; // 1-12
const currentYear = 2026;

const CalendarioAno = () => {
  const { user } = useAuth();

  const { data: months = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["year_calendar", currentYear, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_year_calendar", {
        p_user_id: user!.id,
        p_year: currentYear,
      });
      if (error) throw error;
      return (data as unknown as YearMonth[]) ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <Logo variant="compact" />
        </div>
      </header>

      <main className="px-5 space-y-6 pt-2">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Calendario {currentYear}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tu progreso anual mes a mes</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(10)].map((_, i) => (
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
            <p className="text-sm text-muted-foreground">No hay meses configurados aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {months
              .filter((m) => m.month_number >= 3 && m.month_number <= 12)
              .map((m) => {
                const pct = Math.min(100, Math.max(0, Math.round(m.month_pct ?? 0)));
                const isCurrentMonth = m.month_number === currentMonth;

                return (
                  <Link
                    key={m.month_id}
                    to={`/calendario/${currentYear}/${m.month_number}`}
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
