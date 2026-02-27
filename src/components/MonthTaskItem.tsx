import { useState, useRef, useCallback, useEffect } from "react";
import {
  Check, Image, Headphones, Play, FileText, Loader2, Undo2, X, LinkIcon, PenLine,
} from "lucide-react";
import {
  Drawer, DrawerContent, DrawerClose,
} from "@/components/ui/drawer";
import YouTubeProgressPlayer from "@/components/YouTubeProgressPlayer";
import AudioPlayer from "@/components/AudioPlayer";
import { getYouTubeId } from "@/lib/media-utils";
import { useUpsertMonthTaskNote } from "@/hooks/useMonthTaskNotes";
import type { MonthTask } from "@/hooks/useMonthTasks";
import type { MonthTaskAsset } from "@/hooks/useMonthTaskAssets";

interface MonthTaskItemProps {
  task: MonthTask;
  checked: boolean;
  checkId?: string;
  onToggle: (monthTaskId: string, currentlyChecked: boolean, checkId?: string) => void;
  assets?: MonthTaskAsset[];
  note?: string;
  monthId: string;
}

const MonthTaskItem = ({ task, checked, checkId, onToggle, assets = [], note = "", monthId }: MonthTaskItemProps) => {
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState(note);
  const noteChangedRef = useRef(false);
  const upsertNote = useUpsertMonthTaskNote();

  // Sync external note prop when it updates
  useEffect(() => {
    setNoteText(note);
    noteChangedRef.current = false;
  }, [note]);

  const saveNote = useCallback(async () => {
    if (!noteChangedRef.current) return;
    noteChangedRef.current = false;
    await upsertNote.mutateAsync({ monthId, monthTaskId: task.id, note: noteText });
  }, [noteText, monthId, task.id, upsertNote]);

  const handleOpenChange = useCallback(async (isOpen: boolean) => {
    if (!isOpen && noteChangedRef.current) {
      await saveNote();
    }
    setOpen(isOpen);
  }, [saveNote]);

  const handleMarkDone = useCallback(async () => {
    if (noteChangedRef.current) await saveNote();
    onToggle(task.id, false);
    setOpen(false);
  }, [saveNote, onToggle, task.id]);

  // Legacy fields as fallback
  const hasLegacyMedia = !!task.image_url || !!task.audio_url || !!task.video_url || !!task.file_url;
  const hasAssets = assets.length > 0;
  const hasMedia = hasAssets || hasLegacyMedia;

  const images = assets.filter((a) => a.kind === "image");
  const videos = assets.filter((a) => a.kind === "video");
  const audios = assets.filter((a) => a.kind === "audio");
  const files = assets.filter((a) => a.kind === "file");
  const links = assets.filter((a) => a.kind === "link");

  const orderLabel = String(task.sort_order).padStart(2, "0");

  return (
    <>
      {/* List item */}
      <div
        className={`relative glass-card rounded-2xl border overflow-hidden transition-all duration-200 ${
          checked ? "border-success/30 bg-success/5" : "border-primary/10 hover:border-primary/25"
        }`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${checked ? "bg-success/70" : "bg-primary/30"}`} />

        <button onClick={() => setOpen(true)} className="w-full pl-4 pr-14 py-3.5 text-left">
          <div className="flex items-start gap-2.5">
            {/* Number badge */}
            <span className={`text-[10px] font-bold tabular-nums mt-0.5 w-5 shrink-0 text-center rounded ${
              checked ? "text-success/60" : "text-primary/70"
            }`}>
              {orderLabel}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold leading-snug flex-1 ${checked ? "text-foreground/60 line-through" : "text-foreground"}`}>
                  {task.title}
                </p>
                {hasMedia && (
                  <div className="flex items-center gap-1 shrink-0">
                    {(images.length > 0 || (!hasAssets && task.image_url)) && <Image className="w-3 h-3 text-muted-foreground" />}
                    {(audios.length > 0 || (!hasAssets && task.audio_url)) && <Headphones className="w-3 h-3 text-muted-foreground" />}
                    {(videos.length > 0 || (!hasAssets && task.video_url)) && <Play className="w-3 h-3 text-muted-foreground" />}
                    {(files.length > 0 || (!hasAssets && task.file_url)) && <FileText className="w-3 h-3 text-muted-foreground" />}
                    {links.length > 0 && <LinkIcon className="w-3 h-3 text-muted-foreground" />}
                  </div>
                )}
              </div>
              {/* Note preview */}
              {note && (
                <p className="text-[11px] text-muted-foreground/70 line-clamp-1 mt-0.5 flex items-center gap-1">
                  <PenLine className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{note}</span>
                </p>
              )}
            </div>
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
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/40 px-5 pt-5 pb-3 flex items-start gap-3">
            <span className="text-xs font-bold tabular-nums text-primary/70 mt-1 shrink-0">{orderLabel}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">{task.title}</h3>
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-28">
            {/* Description */}
            {task.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
            )}

            {hasAssets ? (
              <>
                {images.length > 0 && (
                  <div className="space-y-2">
                    {images.map((asset) => (
                      <div key={asset.id} className="rounded-xl overflow-hidden border border-border/30">
                        <img src={asset.url} alt={asset.title || ""} className="w-full aspect-video object-cover" loading="lazy" />
                        {asset.title && <p className="text-[11px] text-muted-foreground px-3 py-1.5">{asset.title}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {videos.length > 0 && (
                  <div className="space-y-2">
                    {videos.map((asset) => {
                      const ytId = getYouTubeId(asset.url);
                      if (ytId) return (
                        <div key={asset.id} className="glass-card rounded-xl overflow-hidden border border-border/30">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 pt-3 pb-1.5 flex items-center gap-1.5">
                            <Play className="w-3 h-3" /> {asset.title || "Video"}
                          </p>
                          <div className="px-3 pb-3">
                            <div className="rounded-lg overflow-hidden max-h-[260px] aspect-video">
                              <YouTubeProgressPlayer videoId={ytId} />
                            </div>
                          </div>
                        </div>
                      );
                      return (
                        <a key={asset.id} href={asset.url} target="_blank" rel="noopener noreferrer"
                          className="glass-card rounded-xl border border-border/30 flex items-center gap-3 px-4 py-3 text-sm text-primary hover:text-primary/80 transition-colors">
                          <Play className="w-4 h-4 shrink-0" /> {asset.title || "Ver video externo"}
                        </a>
                      );
                    })}
                  </div>
                )}
                {audios.length > 0 && (
                  <div className="space-y-2">
                    {audios.map((asset) => (
                      <div key={asset.id} className="glass-card rounded-xl border border-border/30">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 pt-3 pb-1.5 flex items-center gap-1.5">
                          <Headphones className="w-3 h-3" /> {asset.title || "Audio"}
                        </p>
                        <div className="px-4 pb-3"><AudioPlayer src={asset.url} /></div>
                      </div>
                    ))}
                  </div>
                )}
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((asset) => (
                      <a key={asset.id} href={asset.url} target="_blank" rel="noopener noreferrer"
                        className="glass-card rounded-xl border border-border/30 flex items-center gap-3 px-4 py-3.5 group transition-colors hover:border-primary/30">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{asset.title || "Descargar archivo"}</p>
                          <p className="text-[11px] text-muted-foreground">PDF / Recurso</p>
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary shrink-0">Abrir</span>
                      </a>
                    ))}
                  </div>
                )}
                {links.length > 0 && (
                  <div className="space-y-2">
                    {links.map((asset) => (
                      <a key={asset.id} href={asset.url} target="_blank" rel="noopener noreferrer"
                        className="glass-card rounded-xl border border-border/30 flex items-center gap-3 px-4 py-3 text-sm text-primary hover:text-primary/80 transition-colors">
                        <LinkIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{asset.title || asset.url}</span>
                      </a>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {task.image_url && (
                  <div className="rounded-xl overflow-hidden border border-border/30">
                    <img src={task.image_url} alt="" className="w-full aspect-video object-cover" loading="lazy" />
                  </div>
                )}
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
                {task.audio_url && (
                  <div className="glass-card rounded-xl border border-border/30">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 pt-3 pb-1.5 flex items-center gap-1.5">
                      <Headphones className="w-3 h-3" /> Audio
                    </p>
                    <div className="px-4 pb-3"><AudioPlayer src={task.audio_url} /></div>
                  </div>
                )}
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
                {!hasLegacyMedia && (
                  <p className="text-[11px] text-muted-foreground/60 text-center py-4">Sin recursos por ahora</p>
                )}
              </>
            )}

            {/* Note section */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <PenLine className="w-3 h-3" /> Tu nota
              </label>
              <textarea
                value={noteText}
                onChange={(e) => {
                  setNoteText(e.target.value);
                  noteChangedRef.current = true;
                }}
                placeholder="Escribe una nota para ti..."
                rows={3}
                className="w-full bg-muted/40 border border-border/30 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
              />
            </div>
          </div>

          {/* Footer CTA */}
          <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-md border-t border-border/40 p-4 flex flex-col gap-2">
            {!checked ? (
              <button
                onClick={handleMarkDone}
                className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 press-scale gold-gradient text-primary-foreground gold-glow"
              >
                <Check className="w-4 h-4" /> Marcar como hecha
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleOpenChange(false)}
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
