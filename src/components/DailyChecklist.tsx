import { Check } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface Task {
  id: string;
  title: string;
  category: "cuerpo" | "mente" | "alma" | "finanzas";
  completed: boolean;
}

const categoryColors: Record<string, string> = {
  cuerpo: "text-emerald-400/70",
  mente: "text-blue-400/70",
  alma: "text-purple-400/70",
  finanzas: "text-primary/70",
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
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  return (
    <div className="divide-y divide-border/50">
      {tasks.map((task) => (
        <div key={task.id}>
          <button
            onClick={() => onToggle(task.id)}
            className="w-full flex items-center gap-3 py-3.5 transition-all duration-200"
          >
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
                task.completed
                  ? "bg-primary border-primary shadow-[0_0_8px_hsl(43_56%_59%/0.3)]"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              {task.completed && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
            </div>
            <span
              className={`flex-1 text-left text-sm font-medium transition-all duration-200 ${
                task.completed ? "text-foreground" : "text-secondary-foreground"
              }`}
            >
              {task.title}
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${categoryColors[task.category]}`}>
              {categoryLabels[task.category]}
            </span>
          </button>

          {task.completed && onNoteChange && (
            <div className="ml-9 pb-3">
              {expandedNote === task.id ? (
                <Textarea
                  placeholder="Tu cuaderno (opcional)..."
                  value={notes[task.id] ?? ""}
                  onChange={(e) => onNoteChange(task.id, e.target.value)}
                  onBlur={() => {
                    onNoteSave?.(task.id, notes[task.id] ?? "");
                    setExpandedNote(null);
                  }}
                  className="min-h-[60px] bg-card/50 border-primary/15 text-sm resize-none rounded-xl"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setExpandedNote(task.id)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors py-0.5"
                >
                  {notes[task.id] ? `📝 ${notes[task.id].slice(0, 50)}${notes[task.id].length > 50 ? "..." : ""}` : "📝 Agregar nota..."}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DailyChecklist;
