import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Headphones, Play } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface CalendarDay {
  day_id: string;
  date: string;
  week_id: string;
  day_number: number;
  week_name: string;
  week_number: number;
  day_pct: number;
  status: "complete" | "partial" | "pending" | "future";
}

const STATUS_STYLES: Record<string, string> = {
  complete: "border-primary/40 bg-primary/15 text-primary",
  partial: "border-primary/20 bg-primary/5 text-foreground",
  pending: "border-muted bg-card text-muted-foreground",
  future: "border-muted/50 bg-muted/20 text-muted-foreground/50",
};

const CalendarioMes = () => {
  const { year, month } = useParams<{ year: string; month: string }>();
  const { user } = useAuth();
  const monthNum = Number(month);
  const yearNum = Number(year);
  const isValid = monthNum >= 3 && monthNum <= 12 && !isNaN(yearNum);

  // 1) Resolve month_id from year + monthNum
  const { data: monthRecord, isLoading: monthLoading } = useQuery({
    queryKey: ["calendar-month-id", yearNum, monthNum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("months")
        .select("id, name, theme, number, macro_text, audio_url, video_url")
        .eq("number", monthNum)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isValid,
  });

  // 2) Load days via RPC
  const { data: days = [], isLoading: daysLoading, isError, refetch } = useQuery({
    queryKey: ["month_calendar", monthRecord?.id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_month_calendar", {
        p_user_id: user!.id,
        p_month_id: monthRecord!.id,
      });
      if (error) throw error;
      return (data as unknown as CalendarDay[]) ?? [];
    },
    enabled: !!user && !!monthRecord?.id,
  });

  const isLoading = monthLoading || daysLoading;
  const monthName = MONTH_NAMES[monthNum - 1] ?? `Mes ${monthNum}`;

  // Group days by week
  const weekMap = new Map<number, { week_id: string; week_name: string; days: CalendarDay[] }>();
  days.forEach((d) => {
    if (!weekMap.has(d.week_number)) {
      weekMap.set(d.week_number, { week_id: d.week_id, week_name: d.week_name, days: [] });
    }
    weekMap.get(d.week_number)!.days.push(d);
  });
  const weeks = Array.from(weekMap.entries()).sort(([a], [b]) => a - b);

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background pb-24 flex flex-col items-center justify-center px-5">
        <p className="text-lg font-bold text-foreground">Mes no disponible</p>
        <p className="text-sm text-muted-foreground mt-2">Este mes no está habilitado.</p>
        <Link to="/calendario" className="mt-4 text-primary text-sm font-semibold hover:underline">
          ← Volver al calendario
        </Link>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <Link to="/calendario" className="w-9 h-9 rounded-full bg-card border border-primary/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">{monthName}</h1>
            {monthRecord?.theme && (
              <p className="text-xs text-primary">{monthRecord.theme}</p>
            )}
          </div>
        </div>
      </header>

      <main className="px-5 space-y-5 pt-3">
        {/* Month Macro Card */}
        {monthRecord && (monthRecord as any).macro_text ? (
          <div className="glass-card rounded-2xl p-4 border border-primary/10 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Macro del mes</p>
            <p className="text-sm text-foreground leading-relaxed">{(monthRecord as any).macro_text}</p>
            <div className="flex gap-2">
              {(monthRecord as any).audio_url && (
                <a
                  href={(monthRecord as any).audio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  <Headphones className="w-3.5 h-3.5" /> Audio
                </a>
              )}
              {(monthRecord as any).video_url && (
                <a
                  href={(monthRecord as any).video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" /> Video
                </a>
              )}
            </div>
          </div>
        ) : monthRecord && !isLoading ? (
          <div className="glass-card rounded-2xl p-4 border border-muted/30 text-center">
            <p className="text-xs text-muted-foreground">Macro del mes — Próximamente</p>
          </div>
        ) : null}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 h-28 animate-pulse bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <div className="glass-card rounded-2xl p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Error al cargar el mes.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : days.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">No hay días configurados para este mes.</p>
          </div>
        ) : (
          weeks.map(([weekNum, w]) => (
            <div key={weekNum} className="glass-card rounded-2xl p-4 border border-primary/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-foreground">{w.week_name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Semana {weekNum}
                  </p>
                </div>
                <Link
                  to={`/reto/${w.week_id}`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Ver reto
                </Link>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {w.days.map((d) => {
                  const isFuture = d.status === "future";
                  const style = STATUS_STYLES[d.status] ?? STATUS_STYLES.pending;

                  const content = (
                    <div className={`rounded-xl p-2 text-center border transition-colors ${style} ${!isFuture ? "hover:border-primary/40" : "cursor-default"}`}>
                      <p className="text-[9px] font-medium">D{d.day_number}</p>
                      <p className="text-xs font-bold mt-0.5">
                        {isFuture ? "—" : `${d.day_pct}%`}
                      </p>
                    </div>
                  );

                  if (isFuture || !d.week_id) return <div key={d.day_id}>{content}</div>;

                  return (
                    <Link key={d.day_id} to={`/reto/${d.week_id}/dia/${d.day_number}`}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default CalendarioMes;
