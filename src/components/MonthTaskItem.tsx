import { useState, useEffect, useRef } from "react";
import {
  Check, Image, Headphones, Play, FileText, BookOpen, Loader2, Undo2,
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
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{task.title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-2 space-y-3 max-h-[60vh] overflow-y-auto">
            {task.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
            )}

            {task.image_url && (
              <img src={task.image_url} alt="" className="w-full rounded-xl" loading="lazy" />
            )}

            {task.video_url && (() => {
              const ytId = getYouTubeId(task.video_url!);
              if (ytId) return <YouTubeProgressPlayer videoId={ytId} />;
              return (
                <a href={task.video_url!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary underline">
                  <Play className="w-4 h-4" /> Ver video
                </a>
              );
            })()}

            {task.audio_url && <AudioPlayer src={task.audio_url} />}

            {task.file_url && (
              <a href={task.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary underline">
                <FileText className="w-4 h-4" /> Descargar archivo
              </a>
            )}
          </div>
          <DrawerFooter>
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
            <DrawerClose asChild>
              <button className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cerrar
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default MonthTaskItem;
