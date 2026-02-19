import { Check } from "lucide-react";
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
}

const DailyChecklist = ({ tasks, onToggle, notes = {}, onNoteChange, onNoteSave }: DailyChecklistProps) => {
  const [noteModalTask, setNoteModalTask] = useState<string | null>(null);
  const [modalNote, setModalNote] = useState("");
  const prevCompleted = useRef<Record<string, boolean>>({});

  // Track completion changes to auto-open modal
  useEffect(() => {
    const prev = prevCompleted.current;
    for (const task of tasks) {
      if (task.completed && prev[task.id] === false) {
        // Task just completed — open modal
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
  const activeModalIndex = activeModalTask ? tasks.indexOf(activeModalTask) : -1;
  const isMomento5 = activeModalIndex === 4;

  const handleSaveNote = () => {
    if (noteModalTask) {
      onNoteChange?.(noteModalTask, modalNote);
      onNoteSave?.(noteModalTask, modalNote);
    }
    setNoteModalTask(null);
    setModalNote("");
  };

  const handleCloseModal = () => {
    // For momento 5, save even on close if there's content
    if (noteModalTask && modalNote.trim()) {
      onNoteChange?.(noteModalTask, modalNote);
      onNoteSave?.(noteModalTask, modalNote);
    }
    setNoteModalTask(null);
    setModalNote("");
  };

  return (
    <>
      <div className="glass-card rounded-2xl p-3 space-y-2">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className="bg-card/30 rounded-xl p-4 border border-border/30 transition-all duration-200 hover:border-primary/20"
          >
            <button
              onClick={() => onToggle(task.id)}
              className="w-full flex items-center gap-3 transition-all duration-200"
            >
              {/* Moment number */}
              <span className="text-[11px] font-bold text-muted-foreground/50 tabular-nums w-5 shrink-0">
                {String(index + 1).padStart(2, "0")}
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

              {/* Title */}
              <span
                className={`flex-1 text-left text-sm font-medium transition-all duration-200 ${
                  task.completed ? "text-foreground" : "text-secondary-foreground"
                }`}
              >
                {task.title}
              </span>

              {/* Category badge */}
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryColors[task.category]}`}>
                {categoryLabels[task.category]}
              </span>
            </button>

            {/* Inline note preview (if completed and has note) */}
            {task.completed && notes[task.id] && (
              <button
                onClick={() => {
                  setModalNote(notes[task.id] ?? "");
                  setNoteModalTask(task.id);
                }}
                className="ml-12 mt-2 text-xs text-muted-foreground hover:text-primary transition-colors truncate max-w-full text-left"
              >
                📝 {notes[task.id].slice(0, 60)}{notes[task.id].length > 60 ? "…" : ""}
              </button>
            )}
          </div>
        ))}
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
                ? `Momento ${activeModalIndex + 1} — ${activeModalTask.title}`
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
            autoFocus
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
