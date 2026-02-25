import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const CalendarioAno = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const { data: months = [], isLoading } = useQuery({
    queryKey: ["calendar-months", currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("months")
        .select("id, number, name, theme, program_id")
        .order("number", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
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
              <div key={i} className="glass-card rounded-2xl p-5 h-24 animate-pulse bg-muted" />
            ))}
          </div>
        ) : months.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">No hay meses configurados aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {months.map((m) => (
              <Link
                key={m.id}
                to={`/calendario/${currentYear}/${m.number}`}
                className="glass-card rounded-2xl p-5 border border-primary/10 hover:border-primary/30 transition-colors"
              >
                <p className="text-xs text-muted-foreground">{MONTH_NAMES[m.number - 1] ?? `Mes ${m.number}`}</p>
                <p className="text-lg font-bold text-foreground mt-1">{m.name}</p>
                {m.theme && (
                  <p className="text-[10px] text-primary mt-1 truncate">{m.theme}</p>
                )}
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
