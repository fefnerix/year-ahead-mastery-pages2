import { useState, useEffect, useRef } from "react";
import {
  Check, Image, Headphones, Play, FileText, BookOpen, Loader2, Undo2, X,
} from "lucide-react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose,
} from "@/components/ui/drawer";
import YouTubeProgressPlayer from "@/components/YouTubeProgressPlayer";
import AudioPlayer from "@/components/AudioPlayer";
import { getYouTubeId } from "@/lib/media-utils";
import type { MonthTask } from "@/hooks/useMonthTasks";

interface MonthTaskItemProps {
  task: MonthTask;
  checked: boolean;
  checkId?: string;
  onToggle: (monthTaskId: string, currentlyChecked: boolean, checkId?: string) => void;
}

const MonthTaskItem = ({ task, checked, checkId, onToggle }: MonthTaskItemProps) => {
  const [open, setOpen] = useState(false);

  const hasImage = !!task.image_url;
  const hasAudio = !!task.audio_url;
  const hasVideo = !!task.video_url;
  const hasFile = !!task.file_url;
  const hasMedia = hasImage || hasAudio || hasVideo || hasFile;

  return (
    <>
      {/* List item */}
      <div
        className={`relative glass-card rounded-2xl border overflow-hidden transition-all duration-200 ${
          checked ? "border-success/30 bg-success/5" : "border-primary/10 hover:border-primary/25"
        }`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${checked ? "bg-success/70" : "bg-primary/30"}`} />

        <button onClick={() => setOpen(true)} className="w-full pl-5 pr-14 py-3.5 text-left">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold leading-snug flex-1 ${checked ? "text-foreground/60 line-through" : "text-foreground"}`}>
              {task.title}
            </p>
            {hasMedia && (
              <div className="flex items-center gap-1 shrink-0">
                {hasImage && <Image className="w-3 h-3 text-muted-foreground" />}
                {hasAudio && <Headphones className="w-3 h-3 text-muted-foreground" />}
                {hasVideo && <Play className="w-3 h-3 text-muted-foreground" />}
                {hasFile && <FileText className="w-3 h-3 text-muted-foreground" />}
              </div>
            )}
          </div>
        </button>

        {/* Check circle */}
        <div
          role="button"
          aria-label={checked ? "Desmarcar tarea" : "Marcar tarea"}
          onClick={() => onToggle(task.id, checked, checkId)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 press-scale ${
            checked ? "bg-success/20 border-success/60" : "bg-white/5 border-white/15 hover:border-primary/40"
          }`}
        >
          <Check
            className={`w-3.5 h-3.5 transition-all duration-200 ${
              checked ? "text-success scale-100" : "text-muted-foreground/40 scale-75"
            }`}
          />
        </div>
      </div>

      {/* Detail drawer */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="flex flex-col max-h-[85vh]">
          {/* ── Header (sticky) ── */}
          <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/40 px-5 pt-5 pb-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
                {task.title}
              </h3>
              {hasMedia && (
                <p className="text-[11px] text-muted-foreground mt-0.5">Recursos de esta tarea</p>
              )}
            </div>
            <DrawerClose asChild>
              <button className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted/40 hover:bg-muted/60 transition-colors" aria-label="Cerrar">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </DrawerClose>
          </div>

          {/* ── Content (scrollable) ── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-28">
            {/* Description */}
            {task.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
            )}

            {/* Section A — Image / Banner */}
            {task.image_url && (
              <div className="rounded-xl overflow-hidden border border-border/30">
                <img src={task.image_url} alt="" className="w-full aspect-video object-cover" loading="lazy" />
              </div>
            )}

            {/* Section B — Video */}
            {task.video_url && (() => {
              const ytId = getYouTubeId(task.video_url!);
              if (ytId) return (
                <div className="glass-card rounded-xl overflow-hidden border border-border/30">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 pt-3 pb-1.5 flex items-center gap-1.5">
                    <Play className="w-3 h-3" /> Video
                  </p>
                  <div className="px-3 pb-3">
                    <div className="rounded-lg overflow-hidden max-h-[260px] aspect-video">
                      <YouTubeProgressPlayer videoId={ytId} />
                    </div>
                  </div>
                </div>
              );
              return (
                <a href={task.video_url!} target="_blank" rel="noopener noreferrer"
                  className="glass-card rounded-xl border border-border/30 flex items-center gap-3 px-4 py-3 text-sm text-primary hover:text-primary/80 transition-colors">
                  <Play className="w-4 h-4 shrink-0" /> Ver video externo
                </a>
              );
            })()}

            {/* Section C — Audio */}
            {task.audio_url && (
              <div className="glass-card rounded-xl border border-border/30">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 pt-3 pb-1.5 flex items-center gap-1.5">
                  <Headphones className="w-3 h-3" /> Audio
                </p>
                <div className="px-4 pb-3">
                  <AudioPlayer src={task.audio_url} />
                </div>
              </div>
            )}

            {/* Section D — File / PDF */}
            {task.file_url && (
              <a href={task.file_url} target="_blank" rel="noopener noreferrer"
                className="glass-card rounded-xl border border-border/30 flex items-center gap-3 px-4 py-3.5 group transition-colors hover:border-primary/30">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Descargar archivo</p>
                  <p className="text-[11px] text-muted-foreground">PDF / Recurso</p>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary shrink-0">Abrir</span>
              </a>
            )}
          </div>

          {/* ── Footer (sticky CTA) ── */}
          <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-md border-t border-border/40 p-4 flex flex-col gap-2">
            {!checked ? (
              <button
                onClick={() => { onToggle(task.id, false); setOpen(false); }}
                className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 press-scale gold-gradient text-primary-foreground gold-glow"
              >
                <Check className="w-4 h-4" /> Marcar como hecha
              </button>
            ) : (
              <>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 press-scale bg-success/15 text-success border border-success/30"
                >
                  <Check className="w-4 h-4" /> Completada
                </button>
                <button
                  onClick={() => { onToggle(task.id, true, checkId); }}
                  className="w-full py-2 text-xs font-medium flex items-center justify-center gap-1.5 text-destructive/70 hover:text-destructive transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Desmarcar
                </button>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default MonthTaskItem;
