import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Headphones, Play, ArrowRight, CalendarDays } from "lucide-react";
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

// Status cell styles — border + background + text
const STATUS_CELL: Record<string, string> = {
  complete: "border-2 border-success/60 bg-success/12 text-success",
  partial:  "border-2 border-primary/40 bg-primary/8 text-primary",
  pending:  "border border-white/10 bg-white/4 text-muted-foreground",
  future:   "border border-white/5 bg-transparent text-muted-foreground/30",
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
  weekMap.forEach((w) => w.days.sort((a, b) => a.date.localeCompare(b.date)));
  const weeks = Array.from(weekMap.entries()).sort(([a], [b]) => a - b);

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background pb-28 flex flex-col items-center justify-center px-5 text-center">
        <CalendarDays className="w-10 h-10 text-muted-foreground mb-3" />
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
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/calendario"
            className="w-9 h-9 rounded-full bg-card border border-primary/10 flex items-center justify-center press-scale hover:border-primary/30 transition-colors"
          >
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

      <main className="px-5 space-y-5 pt-1">
        {/* Month Macro Card */}
        {monthRecord && (monthRecord as any).macro_text ? (
          <div className="glass-card rounded-2xl p-4 border border-primary/10 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Macro del mes</p>
            <p className="text-sm text-foreground leading-relaxed">{(monthRecord as any).macro_text}</p>
            {((monthRecord as any).audio_url || (monthRecord as any).video_url) && (
              <div className="flex gap-2">
                {(monthRecord as any).audio_url && (
                  <a
                    href={(monthRecord as any).audio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors press-scale"
                  >
                    <Headphones className="w-3.5 h-3.5" /> Audio
                  </a>
                )}
                {(monthRecord as any).video_url && (
                  <a
                    href={(monthRecord as any).video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors press-scale"
                  >
                    <Play className="w-3.5 h-3.5" /> Video
                  </a>
                )}
              </div>
            )}
          </div>
        ) : monthRecord && !isLoading ? (
          <div className="glass-card rounded-2xl p-3 border border-muted/20 text-center">
            <p className="text-xs text-muted-foreground">Macro del mes — Próximamente</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-white/10 rounded w-1/4 animate-pulse" />
                <div className="glass-card rounded-2xl p-4 h-24 animate-pulse bg-muted/30" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="glass-card rounded-2xl p-6 text-center space-y-3 border border-muted/20">
            <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Error al cargar el mes.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors press-scale"
            >
              Reintentar
            </button>
          </div>
        ) : days.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center border border-muted/20">
            <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No hay días configurados para este mes.</p>
          </div>
        ) : (
          <>
            {/* Retos de este mes */}
            <section className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Retos del mes</p>
              {weeks.map(([weekNum, w]) => (
                <Link
                  key={`reto-${weekNum}`}
                  to={`/reto/${w.week_id}`}
                  className="glass-card rounded-xl p-3.5 border border-primary/10 flex items-center justify-between hover:border-primary/30 transition-colors press-scale"
                >
                  <div>
                    <p className="text-sm font-bold text-foreground">{w.week_name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Semana {weekNum}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                </Link>
              ))}
            </section>

            {/* Day grid by week */}
            <section className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Días del mes</p>
              {weeks.map(([weekNum, w]) => (
                <div key={`days-${weekNum}`}>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Semana {weekNum}
                  </p>
                  <div className="grid grid-cols-7 gap-1.5">
                    {w.days.map((d) => {
                      const isFuture = d.status === "future";
                      const style = STATUS_CELL[d.status] ?? STATUS_CELL.pending;
                      const dayNum = new Date(d.date + "T12:00:00").getDate();

                      const content = (
                        <div
                          className={`rounded-xl py-2 px-1 text-center transition-all duration-150 ${style} ${
                            !isFuture ? "hover:brightness-110 active:scale-95" : "cursor-default"
                          }`}
                        >
                          <p className="text-[10px] font-semibold leading-none">{dayNum}</p>
                          <p className="text-[10px] font-bold mt-1 leading-none">
                            {isFuture ? "·" : `${d.day_pct}%`}
                          </p>
                        </div>
                      );

                      if (isFuture) return <div key={d.day_id}>{content}</div>;

                      return (
                        <Link key={d.day_id} to={`/day/${d.day_id}`}>
                          {content}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>

            {/* Legend */}
            <div className="flex items-center gap-4 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm border-2 border-success/60 bg-success/12" />
                <span className="text-[10px] text-muted-foreground">Completo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm border-2 border-primary/40 bg-primary/8" />
                <span className="text-[10px] text-muted-foreground">Parcial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm border border-white/10 bg-white/4" />
                <span className="text-[10px] text-muted-foreground">Pendiente</span>
              </div>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default CalendarioMes;
