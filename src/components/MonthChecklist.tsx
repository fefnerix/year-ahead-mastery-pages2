import { useCallback, useMemo } from "react";
import { useMonthTasks, useMonthTaskChecks, useToggleMonthTaskCheck } from "@/hooks/useMonthTasks";
import { useMonthTasksAssetsBatch } from "@/hooks/useMonthTaskAssets";
import { useMonthTaskNotes } from "@/hooks/useMonthTaskNotes";
import MonthTaskItem from "@/components/MonthTaskItem";
import { ListChecks, Dumbbell, Brain, Heart, DollarSign } from "lucide-react";

interface MonthChecklistProps {
  monthId: string | null | undefined;
}

const CATEGORY_CONFIG = {
  cuerpo: { label: "Cuerpo", icon: Dumbbell, color: "bg-emerald-500" },
  mente: { label: "Mente", icon: Brain, color: "bg-blue-500" },
  alma: { label: "Alma", icon: Heart, color: "bg-purple-500" },
  finanzas: { label: "Finanzas", icon: DollarSign, color: "bg-amber-500" },
} as const;

type CategoryKey = keyof typeof CATEGORY_CONFIG;

const MonthChecklist = ({ monthId }: MonthChecklistProps) => {
  const { data: tasks = [], isLoading: tasksLoading } = useMonthTasks(monthId);
  const { data: checks = [], isLoading: checksLoading } = useMonthTaskChecks(monthId);
  const toggleCheck = useToggleMonthTaskCheck(monthId);

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const { data: allAssets = [] } = useMonthTasksAssetsBatch(taskIds);
  const { data: notes = [] } = useMonthTaskNotes(monthId);

  const isLoading = tasksLoading || checksLoading;

  const checkMap = useMemo(() => new Map(checks.map((c) => [c.month_task_id, c])), [checks]);
  const noteMap = useMemo(() => new Map(notes.map((n) => [n.month_task_id, n.note])), [notes]);
  const checkedCount = checks.length;
  const totalCount = tasks.length;

  // Category progress
  const categoryStats = useMemo(() => {
    const stats: Record<CategoryKey, { total: number; done: number }> = {
      cuerpo: { total: 0, done: 0 },
      mente: { total: 0, done: 0 },
      alma: { total: 0, done: 0 },
      finanzas: { total: 0, done: 0 },
    };
    tasks.forEach((t) => {
      const cat = t.category as CategoryKey | null;
      if (cat && stats[cat]) {
        stats[cat].total++;
        if (checkMap.has(t.id)) stats[cat].done++;
      }
    });
    return stats;
  }, [tasks, checkMap]);

  const activeCategories = useMemo(
    () => (Object.keys(categoryStats) as CategoryKey[]).filter((k) => categoryStats[k].total > 0),
    [categoryStats],
  );

  const handleToggle = useCallback((monthTaskId: string, currentlyChecked: boolean, checkId?: string) => {
    toggleCheck.mutate({ monthTaskId, currentlyChecked, checkId });
  }, [toggleCheck]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-4 h-[52px] animate-pulse border border-primary/5" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center border border-muted/30">
        <ListChecks className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Sin tareas del mes configuradas</p>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Checklist del Mes
          </h3>
        </div>
        <span className="text-xs font-bold text-muted-foreground tabular-nums">
          {checkedCount}/{totalCount}
        </span>
      </div>

      {/* Category progress bars */}
      {activeCategories.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-1">
          {activeCategories.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const { total, done } = categoryStats[cat];
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const Icon = cfg.icon;
            return (
              <div key={cat} className="glass-card rounded-xl p-2.5 border border-border/20">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{cfg.label}</span>
                  <span className="text-[10px] font-bold tabular-nums text-muted-foreground ml-auto">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cfg.color} transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1 tabular-nums">{done}/{total}</p>
              </div>
            );
          })}
        </div>
      )}

      {tasks.map((task) => {
        const check = checkMap.get(task.id);
        const taskAssets = allAssets.filter((a) => a.month_task_id === task.id);
        const noteText = noteMap.get(task.id) || "";
        return (
          <MonthTaskItem
            key={task.id}
            task={task}
            checked={!!check}
            checkId={check?.id}
            onToggle={handleToggle}
            assets={taskAssets}
            note={noteText}
            monthId={monthId!}
          />
        );
      })}
    </section>
  );
};

export default MonthChecklist;
