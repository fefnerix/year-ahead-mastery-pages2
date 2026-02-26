import { Check, Zap, StickyNote } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  title: string;
  category: "cuerpo" | "mente" | "alma" | "finanzas";
  completed: boolean;
  order: number;
}

const categoryColors: Record<string, string> = {
  cuerpo: "bg-emerald-500/15 text-emerald-400",
  mente: "bg-blue-500/15 text-blue-400",
  alma: "bg-purple-500/15 text-purple-400",
  finanzas: "bg-primary/15 text-primary",
};

const categoryLabels: Record<string, string> = {
  cuerpo: "Cuerpo",
  mente: "Mente",
  alma: "Alma",
  finanzas: "Finanzas",
};

interface DailyChecklistProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  notes?: Record<string, string>;
  onNoteChange?: (taskId: string, content: string) => void;
  onNoteSave?: (taskId: string, content: string) => void;
  highlightTaskId?: string | null;
  onOpenNoteModal?: (taskId: string) => void;
}

const DailyChecklist = ({
  tasks,
  onToggle,
  notes = {},
  onNoteChange,
  onNoteSave,
  highlightTaskId,
  onOpenNoteModal,
}: DailyChecklistProps) => {
  const [noteModalTask, setNoteModalTask] = useState<string | null>(null);
  const [modalNote, setModalNote] = useState("");
  const prevCompleted = useRef<Record<string, boolean>>({});
  const highlightRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted task
  useEffect(() => {
    if (highlightTaskId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightTaskId]);

  // Track completion changes to auto-open modal
  useEffect(() => {
    const prev = prevCompleted.current;
    for (const task of tasks) {
      if (task.completed && prev[task.id] === false) {
        setModalNote(notes[task.id] ?? "");
        setNoteModalTask(task.id);
        break;
      }
    }
    const next: Record<string, boolean> = {};
    tasks.forEach((t) => { next[t.id] = t.completed; });
    prevCompleted.current = next;
  }, [tasks]);

  const activeModalTask = noteModalTask ? tasks.find((t) => t.id === noteModalTask) : null;
  // Momento 5 = task with order 5 (exponencial), NOT array index
  const isMomento5 = activeModalTask ? activeModalTask.order === 5 : false;

  const openNoteModal = (taskId: string) => {
    setModalNote(notes[taskId] ?? "");
    setNoteModalTask(taskId);
  };

  // Expose openNoteModal via onOpenNoteModal callback registration
  useEffect(() => {
    // Parent can call onOpenNoteModal to trigger opening
  }, []);

  const handleSaveNote = () => {
    if (noteModalTask) {
      onNoteChange?.(noteModalTask, modalNote);
      onNoteSave?.(noteModalTask, modalNote);
    }
    setNoteModalTask(null);
    setModalNote("");
  };

  const handleCloseModal = () => {
    if (noteModalTask && modalNote.trim()) {
      onNoteChange?.(noteModalTask, modalNote);
      onNoteSave?.(noteModalTask, modalNote);
    }
    setNoteModalTask(null);
    setModalNote("");
  };

  // Sort tasks by order for stable rendering
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="glass-card rounded-2xl p-3 space-y-2">
        {sortedTasks.map((task) => {
          const isHighlighted = highlightTaskId === task.id;
          return (
            <div
              key={task.id}
              ref={isHighlighted ? highlightRef : undefined}
              className={`bg-card/30 rounded-xl p-4 border transition-all duration-300 ${
                isHighlighted
                  ? "border-primary/50 ring-1 ring-primary/30 shadow-[0_0_20px_hsl(43_56%_59%/0.15)]"
                  : "border-border/30 hover:border-primary/20"
              }`}
            >
              <button
                onClick={() => onToggle(task.id)}
                className="w-full flex items-center gap-3 transition-all duration-200"
              >
                {/* Moment number */}
                <span className="text-[11px] font-bold text-muted-foreground/50 tabular-nums w-5 shrink-0">
                  {String(task.order).padStart(2, "0")}
                </span>

                {/* Checkbox */}
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
                    task.completed
                      ? "bg-primary border-primary shadow-[0_0_12px_hsl(43_56%_59%/0.4)] scale-110"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                  style={{ transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                >
                  {task.completed && <Check className="w-4 h-4 text-primary-foreground" />}
                </div>

                {/* Title + Momento 5 indicator */}
                <span
                  className={`flex-1 text-left text-sm font-medium transition-all duration-200 ${
                    task.completed ? "text-foreground" : "text-secondary-foreground"
                  }`}
                >
                  {task.title}
                  {task.order === 5 && (
                    <Zap className="inline-block w-3.5 h-3.5 ml-1.5 text-primary" />
                  )}
                </span>

                {/* Category badge */}
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryColors[task.category]}`}>
                  {categoryLabels[task.category]}
                </span>
              </button>

              {/* Inline note preview */}
              {task.completed && notes[task.id] && (
                <button
                  onClick={() => openNoteModal(task.id)}
                  className="ml-12 mt-2 text-xs text-muted-foreground hover:text-primary transition-colors truncate max-w-full text-left"
                >
                  <StickyNote className="w-3 h-3 inline mr-1" />{notes[task.id].slice(0, 60)}{notes[task.id].length > 60 ? "…" : ""}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Note Modal */}
      <Dialog
        open={!!noteModalTask}
        onOpenChange={(open) => { if (!open) handleCloseModal(); }}
      >
        <DialogContent className="glass-card border-primary/20 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {activeModalTask
                ? `Momento ${activeModalTask.order} — ${activeModalTask.title}`
                : "Tu Cuaderno"}
            </DialogTitle>
            {isMomento5 && (
              <p className="text-xs text-primary mt-1">
                Este momento requiere una reflexión escrita.
              </p>
            )}
          </DialogHeader>

          <Textarea
            placeholder={
              isMomento5
                ? "Escribe tu reflexión exponencial…"
                : "Escribe una línea sobre tu experiencia…"
            }
            value={modalNote}
            onChange={(e) => setModalNote(e.target.value)}
            className="min-h-[100px] bg-card/50 border-primary/15 text-sm resize-none rounded-xl"
            
          />

          <DialogFooter>
            {!isMomento5 && (
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                Omitir
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSaveNote}
              disabled={isMomento5 && !modalNote.trim()}
              className="gold-gradient text-primary-foreground font-bold"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DailyChecklist;
