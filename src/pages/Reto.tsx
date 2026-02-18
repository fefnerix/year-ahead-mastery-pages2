import { useParams, useNavigate } from "react-router-dom";
import { useRetoData } from "@/hooks/useRetoData";
import { useWeekBlocks } from "@/hooks/useWeekBlocks";
import BlockRenderer from "@/components/BlockRenderer";
import AudioPlayer from "@/components/AudioPlayer";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Lock, Download, Maximize2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const dayLabels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const Reto = () => {
  const { weekId } = useParams<{ weekId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useRetoData(weekId);
  const { data: blocks = [] } = useWeekBlocks(weekId);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Reto no encontrado</p>
      </div>
    );
  }

  const { week, days, weekProgress } = data;
  const todayDay = days.find((d) => d.is_today) ?? days.find((d) => d.is_unlocked);
  const hasBlocks = blocks.length > 0;

  // If blocks exist, render dynamically; otherwise fallback to legacy layout
  if (hasBlocks) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="px-5 pt-12 pb-2">
          <button onClick={() => navigate(-1)} className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold text-foreground">{week.name}</h1>
              {week.objective && <p className="text-sm text-muted-foreground mt-1">{week.objective}</p>}
            </div>
            <span className="text-sm font-bold text-muted-foreground tabular-nums">{weekProgress}%</span>
          </div>
        </header>

        <main className="px-5 space-y-5">
          {blocks.filter(b => b.is_visible).map((block) => (
            <BlockRenderer
              key={block.id}
              block={block}
              weekId={weekId!}
              days={days}
              weekProgress={weekProgress}
            />
          ))}
        </main>

        {/* Fixed CTA */}
        {todayDay && (
          <div className="fixed bottom-20 left-0 right-0 px-5 z-40">
            <button
              onClick={() => navigate(`/reto/${weekId}/dia/${todayDay.number}`)}
              className="w-full py-3.5 rounded-xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider gold-glow shimmer"
            >
              Continuar Hoy — Día {todayDay.number}
            </button>
          </div>
        )}

        <BottomNav />
      </div>
    );
  }

  // Legacy fallback (no blocks configured)
  const hoursUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 3600000));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {week.cover_url && (
        <div className="relative h-48 overflow-hidden">
          <img src={week.cover_url} alt={week.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      )}

      <header className="px-5 pt-4 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-foreground">{week.name}</h1>
            {week.objective && <p className="text-sm text-muted-foreground mt-1">{week.objective}</p>}
          </div>
          <span className="text-sm font-bold text-muted-foreground tabular-nums">{weekProgress}%</span>
        </div>
        {todayDay && (
          <button
            onClick={() => navigate(`/reto/${weekId}/dia/${todayDay.number}`)}
            className="mt-4 w-full py-3 rounded-xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider gold-glow shimmer"
          >
            Continuar Hoy — Día {todayDay.number}
          </button>
        )}
      </header>

      <main className="px-5 space-y-5">
        {week.audio_url && <AudioPlayer src={week.audio_url} title="Audio de Introducción" />}

        {week.schedule_image_url && (
          <div className="glass-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cronograma Semanal</p>
            <img src={week.schedule_image_url} alt="Cronograma" className="w-full rounded-lg cursor-pointer" onClick={() => setScheduleOpen(true)} />
            <div className="flex gap-2">
              <button onClick={() => setScheduleOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-muted text-sm text-foreground font-medium">
                <Maximize2 className="w-3.5 h-3.5" /> Pantalla completa
              </button>
              {week.schedule_pdf_url && (
                <a href={week.schedule_pdf_url} download className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-muted text-sm text-foreground font-medium">
                  <Download className="w-3.5 h-3.5" /> Descargar PDF
                </a>
              )}
            </div>
          </div>
        )}

        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-background">
            {week.schedule_image_url && <img src={week.schedule_image_url} alt="Cronograma" className="w-full h-full object-contain" />}
          </DialogContent>
        </Dialog>

        <section>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">Días</h2>
          <div className="space-y-2">
            {days.map((day) => {
              const pct = day.tasks_total > 0 ? Math.round((day.tasks_completed / day.tasks_total) * 100) : 0;
              const isComplete = day.tasks_total > 0 && day.tasks_completed === day.tasks_total;
              return (
                <button
                  key={day.id}
                  disabled={!day.is_unlocked}
                  onClick={() => navigate(`/reto/${weekId}/dia/${day.number}`)}
                  className={`w-full glass-card rounded-xl p-4 flex items-center gap-4 transition-all text-left ${day.is_today ? "gold-border gold-glow" : ""} ${!day.is_unlocked ? "opacity-50" : "hover:border-primary/30"}`}
                >
                  <div className="flex flex-col items-center w-12">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{dayLabels[day.number - 1]?.slice(0, 3)}</span>
                    <span className={`text-lg font-bold ${day.is_today ? "text-primary" : "text-foreground"}`}>{day.number}</span>
                  </div>
                  <div className="flex-1">
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full gold-gradient rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">{day.tasks_completed}/{day.tasks_total} tareas</span>
                  </div>
                  <div className="w-8 flex justify-center">
                    {!day.is_unlocked ? (
                      <div className="text-center">
                        <Lock className="w-4 h-4 text-muted-foreground mx-auto" />
                        <span className="text-[9px] text-muted-foreground">{hoursUntil(day.unlock_date)}h</span>
                      </div>
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
      </main>

      <BottomNav />
    </div>
  );
};

export default Reto;
