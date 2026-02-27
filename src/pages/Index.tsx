import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import ProgressDonut from "@/components/ProgressDonut";
import MonthChecklist from "@/components/MonthChecklist";
import JournalInput from "@/components/JournalInput";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useProgress } from "@/hooks/useTodayData";
import { useMonthTasks, useMonthTaskChecks } from "@/hooks/useMonthTasks";
import { useIsAdmin } from "@/hooks/useAdmin";
import { getTodayBRT } from "@/lib/dates";

const formattedToday = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "numeric",
  month: "short",
}).format(new Date());

const Index = () => {
  const { user } = useAuth();
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: isAdmin } = useIsAdmin();

  const monthId = progress?.month_id ?? null;

  // Month tasks progress for donut
  const { data: monthTasks = [] } = useMonthTasks(monthId);
  const { data: monthChecks = [] } = useMonthTaskChecks(monthId);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";
  const initials = displayName.slice(0, 2).toUpperCase();
  const hasMonthData = monthId != null;

  // Progress: hoy = month checks / total active tasks, mes = same, total from RPC
  const totalActive = monthTasks.length;
  const checkedCount = monthChecks.length;
  const mesPct = totalActive > 0 ? Math.min(100, Math.round((checkedCount / totalActive) * 100)) : 0;
  const totalPct = Math.min(100, Math.max(0, Math.round(progress?.year_pct ?? 0)));

  const monthTheme = progress?.month_theme || "";
  const now = new Date();
  const currentMonthLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(now);

  const todayDate = getTodayBRT();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="px-5 pt-10 pb-2 flex items-center justify-between shrink-0">
        <Logo variant="compact" />
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground capitalize">{formattedToday}</span>
          <Link
            to="/perfil"
            className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center ring-1 ring-primary/20 press-scale"
          >
            <span className="text-[10px] font-bold text-primary-foreground">{initials}</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-5 flex flex-col gap-4 pt-2 pb-2 overflow-y-auto">
        {!hasMonthData && !progressLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">Sin contenido publicado</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
                {isAdmin
                  ? "Ve a Admin para publicar el mes y el día."
                  : "Vuelve más tarde cuando haya contenido disponible."}
              </p>
            </div>
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-wider press-scale"
              >
                Ir a Admin
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Hero — Reto del Mes */}
            <section className="rounded-2xl overflow-hidden relative shrink-0">
              <div className="relative h-36">
                <div className="w-full h-full gold-gradient opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-1">
                    Reto del Mes
                  </span>
                  <h2 className="text-lg font-display font-bold text-foreground leading-tight">
                    {monthTheme || "—"}
                  </h2>
                  {progress?.month_id && (
                    <Link
                      to={`/mes/${progress.month_id}`}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient text-primary-foreground text-[11px] font-bold uppercase tracking-wider self-start press-scale"
                    >
                      Ver reto del mes <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </section>

            {/* Progress donut */}
            <section className="shrink-0">
              {progressLoading ? (
                <div className="h-[76px] rounded-xl animate-pulse bg-muted/20" />
              ) : (
                <ProgressDonut
                  hoyPct={mesPct}
                  mesPct={mesPct}
                  totalPct={totalPct}
                  monthLabel={currentMonthLabel}
                />
              )}
            </section>

            {/* Month Checklist */}
            <MonthChecklist monthId={monthId} />

            {/* Mi diario de hoy */}
            {hasMonthData && (
              <section className="shrink-0">
                <JournalInput
                  date={todayDate}
                  dayId={undefined}
                  weekId={undefined}
                  monthId={progress?.month_id ?? undefined}
                />
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
