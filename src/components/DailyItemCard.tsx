import { useState, useEffect, useRef } from "react";
import { BookOpen, Target, Check, Loader2, Undo2 } from "lucide-react";
import { TaskWithCheck } from "@/hooks/useDayTasks";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import YouTubeProgressPlayer from "@/components/YouTubeProgressPlayer";
import AudioPlayer from "@/components/AudioPlayer";
import { getYouTubeId } from "@/lib/media-utils";
import { useTaskNotes, useSaveNote } from "@/hooks/useTaskNotes";

interface DailyItemCardProps {
  task: TaskWithCheck | null;
  type: "prayer" | "activity";
  onToggle: (id: string) => void;
  dayId?: string | null;
}

const DailyItemCard = ({ task, type, onToggle, dayId }: DailyItemCardProps) => {
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: notes = [] } = useTaskNotes(dayId);
  const saveNote = useSaveNote();

  const existingNote = task ? notes.find((n) => n.task_id === task.id) : null;

  useEffect(() => {
    if (existingNote?.content != null) setNoteText(existingNote.content);
  }, [existingNote?.content]);

  const isPrayer = type === "prayer";
  const icon = isPrayer ? <BookOpen className="w-4 h-4" /> : <Target className="w-4 h-4" />;
  const label = isPrayer ? "Oración del día" : "Tarea del día";
  const accentColor = isPrayer ? "bg-violet-400/50" : "bg-amber-400/50";
  const iconColor = isPrayer ? "text-violet-400" : "text-amber-400";
  const labelColor = isPrayer ? "text-violet-300" : "text-amber-300";

  const handleNoteChange = (val: string) => {
    setNoteText(val);
    setNoteSaved(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!task || !dayId) return;
    debounceRef.current = setTimeout(() => {
      saveNote.mutate(
        { taskId: task.id, dayId, content: val },
        { onSuccess: () => setNoteSaved(true) }
      );
    }, 1500);
  };

  const handleNoteBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!task || !dayId) return;
    if (noteText !== (existingNote?.content ?? "")) {
      saveNote.mutate(
        { taskId: task.id, dayId, content: noteText },
        { onSuccess: () => setNoteSaved(true) }
      );
    }
  };

  if (!task) {
    return (
      <div className="glass-card rounded-2xl p-4 border border-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted/30">
            <span className="text-muted-foreground">{icon}</span>
          </div>
          <p className="text-xs text-muted-foreground">{label} — No disponible</p>
        </div>
      </div>
    );
  }

  const isCompleted = task.completed;

  return (
    <>
      <div
        className={`relative glass-card rounded-2xl border overflow-hidden transition-all duration-200 press-scale ${
          isCompleted
            ? "border-success/30 bg-success/5"
            : "border-primary/10 hover:border-primary/25"
        }`}
      >
        <div
          className={`absolute left-0 top-0 bottom-0 w-[3px] ${
            isCompleted ? "bg-success/70" : accentColor
          }`}
        />

        <button onClick={() => setOpen(true)} className="w-full pl-5 pr-14 py-4 text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`${isCompleted ? "text-success" : iconColor}`}>{icon}</span>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isCompleted ? "text-success" : labelColor}`}>
              {label}
            </p>
            {!isPrayer && task.category && (
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground capitalize">
                {task.category}
              </span>
            )}
          </div>
          <p className={`text-sm font-semibold leading-snug ${isCompleted ? "text-foreground/60 line-through" : "text-foreground"}`}>
            {task.title}
          </p>
        </button>

        <div
          role="button"
          aria-label={isCompleted ? "Ver tarea completada" : "Abrir tarea"}
          onClick={() => setOpen(true)}
          className={`absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 press-scale ${
            isCompleted
              ? "bg-success/20 border-success/60"
              : "bg-white/5 border-white/15 hover:border-primary/40"
          }`}
        >
          <Check
            className={`w-4 h-4 transition-all duration-200 ${
              isCompleted ? "text-success scale-100" : "text-muted-foreground/40 scale-75"
            }`}
          />
        </div>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center gap-2 justify-center">
              <span className={isCompleted ? "text-success" : iconColor}>{icon}</span>
              <DrawerTitle>{label}</DrawerTitle>
            </div>
            {!isPrayer && task.category && (
              <span className="mx-auto mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                {task.category}
              </span>
            )}
          </DrawerHeader>
          <div className="px-6 pb-2 space-y-3">
            <p className="text-base font-semibold text-foreground">{task.title}</p>

            {task.media_image_url && (
              <img src={task.media_image_url} alt="" className="w-full rounded-xl" loading="lazy" />
            )}

            {task.media_video_url && (() => {
              const ytId = getYouTubeId(task.media_video_url!);
              if (ytId) return <YouTubeProgressPlayer videoId={ytId} />;
              return null;
            })()}

            {task.media_audio_url && <AudioPlayer src={task.media_audio_url} />}

            {task.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
            )}

            {/* Note section — only visible when completed */}
            {dayId && isCompleted && (
              <div className="glass-card rounded-xl border border-primary/10 focus-within:border-primary/30 transition-colors duration-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                  <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex-1">
                    Nota (opcional)
                  </p>
                  {saveNote.isPending && <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />}
                  {noteSaved && !saveNote.isPending && (
                    <span className="flex items-center gap-1 text-[10px] text-success font-semibold">
                      <Check className="w-3 h-3" /> Guardado
                    </span>
                  )}
                </div>
                <textarea
                  ref={noteTextareaRef}
                  value={noteText}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  onBlur={handleNoteBlur}
                  onFocus={() => {
                    requestAnimationFrame(() => {
                      noteTextareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    });
                  }}
                  placeholder="Escribe tu reflexión…"
                  rows={2}
                  className="w-full bg-transparent text-[16px] md:text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none px-3 pb-3 min-h-[50px]"
                />
              </div>
            )}
          </div>
          <DrawerFooter>
            {!isCompleted ? (
              /* Estado A: Incompleta → Marcar como hecha */
              <button
                onClick={() => onToggle(task.id)}
                className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 press-scale gold-gradient text-primary-foreground gold-glow"
              >
                <Check className="w-4 h-4" />
                Marcar como hecha
              </button>
            ) : (
              /* Estado B: Completa → Finalizar + Desmarcar separado */
              <>
                <button
                  onClick={() => {
                    // Flush pending note save
                    if (debounceRef.current) {
                      clearTimeout(debounceRef.current);
                      if (task && dayId && noteText !== (existingNote?.content ?? "")) {
                        saveNote.mutate({ taskId: task.id, dayId, content: noteText });
                      }
                    }
                    setOpen(false);
                  }}
                  className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 press-scale bg-success/15 text-success border border-success/30"
                >
                  <Check className="w-4 h-4" />
                  Finalizar tarea
                </button>
                <button
                  onClick={() => onToggle(task.id)}
                  className="w-full py-2 text-xs font-medium flex items-center justify-center gap-1.5 text-destructive/70 hover:text-destructive transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Desmarcar
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

export default DailyItemCard;
