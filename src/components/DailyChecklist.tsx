import { Check } from "lucide-react";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  category: "cuerpo" | "mente" | "alma" | "finanzas";
  completed: boolean;
}

const categoryColors: Record<string, string> = {
  cuerpo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  mente: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  alma: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  finanzas: "bg-primary/15 text-primary border-primary/20",
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
}

const DailyChecklist = ({ tasks, onToggle }: DailyChecklistProps) => {
  return (
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <button
          key={task.id}
          onClick={() => onToggle(task.id)}
          className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 ${
            task.completed
              ? "glass-card gold-border gold-glow"
              : "glass-card hover:border-muted-foreground/20"
          }`}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
              task.completed
                ? "bg-primary border-primary"
                : "border-muted-foreground/30"
            }`}
          >
            {task.completed && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
          </div>
          <span
            className={`flex-1 text-left text-sm font-medium transition-all duration-300 ${
              task.completed ? "text-foreground" : "text-secondary-foreground"
            }`}
          >
            {task.title}
          </span>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryColors[task.category]}`}
          >
            {categoryLabels[task.category]}
          </span>
        </button>
      ))}
    </div>
  );
};

export default DailyChecklist;
