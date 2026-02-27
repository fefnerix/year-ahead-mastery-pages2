import { useAdminMonthTasks, useUpsertMonthTask } from "@/hooks/useMonthTasks";
import { Loader2, ListChecks } from "lucide-react";

/**
 * @deprecated Use AdminMonthChecklist page instead (per-month editing).
 * This component was for global month tasks management.
 * Kept for backward compatibility but hidden from Admin tabs.
 */
const AdminMonthTasks = () => {
  return (
    <div className="glass-card rounded-xl p-6 text-center">
      <ListChecks className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">
        Las tareas del mes ahora se configuran por mes.
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Ve a Contenido y haz clic en "Editar checklist" en el mes que deseas editar.
      </p>
    </div>
  );
};

export default AdminMonthTasks;
