import { useState } from "react";
import { BookOpen, Target, Check } from "lucide-react";
import { TaskWithCheck } from "@/hooks/useDayTasks";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

interface DailyItemCardProps {
  task: TaskWithCheck | null;
  type: "prayer" | "activity";
  onToggle: (id: string) => void;
}

const DailyItemCard = ({ task, type, onToggle }: DailyItemCardProps) => {
  const [open, setOpen] = useState(false);

  const isPrayer = type === "prayer";
  const icon = isPrayer ? <BookOpen className="w-4 h-4 text-primary" /> : <Target className="w-4 h-4 text-primary" />;
  const label = isPrayer ? "Oración del día" : "Tarea del día";
  const emoji = isPrayer ? "🙏🏼" : "🔥";

  if (!task) {
    return (
      <div className="glass-card rounded-2xl p-4 border border-muted/30 text-center">
        <p className="text-xs text-muted-foreground">{emoji} {label} — No disponible</p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full glass-card rounded-2xl p-4 border border-primary/10 text-left hover:border-primary/30 transition-colors space-y-2"
      >
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{emoji} {label}</p>
          {!isPrayer && task.category && (
            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
              {task.category}
            </span>
          )}
          {task.completed && (
            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              ✓
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-foreground">{task.title}</p>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center gap-2 justify-center">
              {icon}
              <DrawerTitle>{label}</DrawerTitle>
            </div>
            {!isPrayer && task.category && (
              <span className="mx-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                {task.category}
              </span>
            )}
          </DrawerHeader>
          <div className="px-6 pb-2 space-y-3">
            <p className="text-base font-semibold text-foreground">{task.title}</p>
            {task.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
            )}
          </div>
          <DrawerFooter>
            <button
              onClick={() => {
                onToggle(task.id);
                setOpen(false);
              }}
              className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                task.completed
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Check className={`w-4 h-4 ${task.completed ? "opacity-100" : "opacity-30"}`} />
              {task.completed ? "Completada" : "Marcar como hecha"}
            </button>
            <DrawerClose asChild>
              <button className="w-full py-2 text-sm text-muted-foreground">Cerrar</button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default DailyItemCard;
