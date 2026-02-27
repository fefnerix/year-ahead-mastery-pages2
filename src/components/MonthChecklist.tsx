import { useMonthTasks, useMonthTaskChecks, useToggleMonthTaskCheck } from "@/hooks/useMonthTasks";
import { useMonthTasksAssetsBatch } from "@/hooks/useMonthTaskAssets";
import MonthTaskItem from "@/components/MonthTaskItem";
import { ListChecks, Loader2 } from "lucide-react";

interface MonthChecklistProps {
  monthId: string | null | undefined;
}

const MonthChecklist = ({ monthId }: MonthChecklistProps) => {
  const { data: tasks = [], isLoading: tasksLoading } = useMonthTasks(monthId);
  const { data: checks = [], isLoading: checksLoading } = useMonthTaskChecks(monthId);
  const toggleCheck = useToggleMonthTaskCheck(monthId);

  const taskIds = tasks.map((t) => t.id);
  const { data: allAssets = [] } = useMonthTasksAssetsBatch(taskIds);

  const isLoading = tasksLoading || checksLoading;

  const checkMap = new Map(checks.map((c) => [c.month_task_id, c]));
  const checkedCount = checks.length;
  const totalCount = tasks.length;

  const handleToggle = (monthTaskId: string, currentlyChecked: boolean, checkId?: string) => {
    toggleCheck.mutate({ monthTaskId, currentlyChecked, checkId });
  };

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

      {tasks.map((task) => {
        const check = checkMap.get(task.id);
        const taskAssets = allAssets.filter((a) => a.month_task_id === task.id);
        return (
          <MonthTaskItem
            key={task.id}
            task={task}
            checked={!!check}
            checkId={check?.id}
            onToggle={handleToggle}
            assets={taskAssets}
          />
        );
      })}
    </section>
  );
};

export default MonthChecklist;
