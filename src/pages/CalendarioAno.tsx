import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

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

const CalendarioAno = () => {
  const currentYear = 2026;
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
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <Logo variant="compact" />
        </div>
      </header>

      <main className="px-5 space-y-6 pt-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Calendario {currentYear}</h1>
          <p className="text-xs text-muted-foreground mt-1">Tu progreso anual por mes</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 h-28 animate-pulse bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <div className="glass-card rounded-2xl p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Error al cargar el calendario.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : months.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">No hay meses configurados aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {months.map((m) => (
              <Link
                key={m.month_id}
                to={`/calendario/${currentYear}/${m.month_number}`}
                className="glass-card rounded-2xl p-4 border border-primary/10 hover:border-primary/30 transition-colors"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {MONTH_NAMES[m.month_number - 1] ?? `Mes ${m.month_number}`}
                </p>
                <p className="text-sm font-bold text-foreground mt-1 truncate">
                  {m.month_name}
                </p>
                {m.month_theme && (
                  <p className="text-[10px] text-primary mt-0.5 truncate">{m.month_theme}</p>
                )}
                <p className="text-2xl font-bold text-primary mt-2">{m.month_pct}%</p>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default CalendarioAno;
