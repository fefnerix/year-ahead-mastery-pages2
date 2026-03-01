import { useState } from "react";
import { useAdminUsers, useStudentDetail, useSetAccess, type AdminUser } from "@/hooks/useAccessAdminV2";
import {
  Loader2,
  Search,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  Users,
  ChevronDown,
  ChevronUp,
  Flame,
  Trophy,
  CheckCircle2,
  Circle,
  Calendar,
  FileText,
  BookOpen,
  Clock,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; icon: typeof ShieldCheck }> = {
  active: { label: "Activo", color: "text-success", icon: ShieldCheck },
  pending: { label: "Pendiente", color: "text-warning", icon: ShieldAlert },
  past_due: { label: "Pago pendiente", color: "text-warning", icon: ShieldAlert },
  canceled: { label: "Cancelado", color: "text-destructive", icon: ShieldOff },
  revoked: { label: "Revocado", color: "text-destructive", icon: ShieldOff },
  blocked: { label: "Bloqueado", color: "text-destructive", icon: ShieldOff },
};

const AdminAccesos = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout>>();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const { data, isLoading, error } = useAdminUsers(
    debouncedSearch || undefined,
    statusFilter || undefined,
    page
  );
  const setAccess = useSetAccess();

  const users = data?.users || [];
  const total = data?.total || 0;
  const perPage = data?.per_page || 50;
  const totalPages = Math.ceil(total / perPage);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(setTimeout(() => setDebouncedSearch(val), 400));
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await setAccess.mutateAsync({ userId, status: newStatus });
      toast.success(`Estado actualizado a ${statusConfig[newStatus]?.label || newStatus}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const inputClass =
    "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-display font-bold text-foreground">Alumnos</h2>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {total} registrados
        </span>
      </div>

      {/* Search + Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Buscar por nombre, email o ID..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {["", "active", "pending", "past_due", "revoked", "blocked"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                statusFilter === s
                  ? "gold-gradient text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s === "" ? "Todos" : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <ShieldOff className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive font-semibold">No tienes permisos para ver alumnos</p>
          <p className="text-xs text-muted-foreground mt-1">{(error as Error).message}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {debouncedSearch || statusFilter ? "No se encontraron alumnos con esos filtros." : "No hay alumnos registrados."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {users.map((u: AdminUser) => (
              <StudentRow
                key={u.user_id}
                user={u}
                isExpanded={expandedUserId === u.user_id}
                onToggle={() =>
                  setExpandedUserId(expandedUserId === u.user_id ? null : u.user_id)
                }
                onStatusChange={handleStatusChange}
                isPending={setAccess.isPending}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-muted text-muted-foreground disabled:opacity-30"
              >
                Anterior
              </button>
              <span className="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-muted text-muted-foreground disabled:opacity-30"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

/* ── Student Row ──────────────────────────────── */

interface StudentRowProps {
  user: AdminUser;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (userId: string, status: string) => void;
  isPending: boolean;
}

const StudentRow = ({ user: u, isExpanded, onToggle, onStatusChange, isPending }: StudentRowProps) => {
  const cfg = statusConfig[u.access_status] || statusConfig.pending;
  const Icon = cfg.icon;

  const lastLogin = u.last_sign_in_at
    ? new Date(u.last_sign_in_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
    : "Nunca";

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">
              {u.display_name || u.email.split("@")[0]}
            </p>
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${cfg.color} shrink-0`}>
              <Icon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
          {/* Metrics row */}
          <div className="flex gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Flame className="w-3 h-3 text-primary" />
              {u.current_streak}/{u.max_streak}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CheckCircle2 className="w-3 h-3 text-success" />
              {u.month_completed}/{u.month_total}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {lastLogin}
            </span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      {isExpanded && <StudentDetail userId={u.user_id} onStatusChange={onStatusChange} isPending={isPending} />}
    </div>
  );
};

/* ── Student Detail (Ficha) ───────────────────── */

const StudentDetail = ({
  userId,
  onStatusChange,
  isPending,
}: {
  userId: string;
  onStatusChange: (userId: string, status: string) => void;
  isPending: boolean;
}) => {
  const { data: detail, isLoading } = useStudentDetail(userId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6 border-t border-border">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  if (!detail) return null;

  const currentStatus = detail.entitlements?.[0]?.status || "pending";

  return (
    <div className="border-t border-border p-3 space-y-4">
      {/* Quick Actions */}
      <div>
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">Acciones rápidas</p>
        <div className="flex gap-1.5 flex-wrap">
          {currentStatus !== "active" && (
            <button
              onClick={() => onStatusChange(userId, "active")}
              disabled={isPending}
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors"
            >
              Activar
            </button>
          )}
          {currentStatus !== "pending" && (
            <button
              onClick={() => onStatusChange(userId, "pending")}
              disabled={isPending}
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-md bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
            >
              Pendiente
            </button>
          )}
          {currentStatus !== "past_due" && (
            <button
              onClick={() => onStatusChange(userId, "past_due")}
              disabled={isPending}
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-md bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
            >
              Suspender
            </button>
          )}
          {currentStatus !== "revoked" && (
            <button
              onClick={() => onStatusChange(userId, "revoked")}
              disabled={isPending}
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              Revocar
            </button>
          )}
        </div>
      </div>

      {/* Profile info */}
      <div>
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">Datos del alumno</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <span className="text-muted-foreground">Email</span>
          <span className="text-foreground truncate">{detail.email}</span>
          <span className="text-muted-foreground">Registro</span>
          <span className="text-foreground">{new Date(detail.created_at).toLocaleDateString("es-ES")}</span>
          <span className="text-muted-foreground">Último login</span>
          <span className="text-foreground">
            {detail.last_sign_in_at
              ? new Date(detail.last_sign_in_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
              : "Nunca"}
          </span>
          <span className="text-muted-foreground">Origen</span>
          <span className="text-foreground">{detail.entitlements?.[0]?.source || "—"}</span>
        </div>
      </div>

      {/* Streak */}
      <div>
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">Racha & Récord</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">{detail.streak?.current_streak || 0}</p>
              <p className="text-[9px] text-muted-foreground">Racha actual</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">{detail.streak?.max_streak || 0}</p>
              <p className="text-[9px] text-muted-foreground">Récord</p>
            </div>
          </div>
        </div>
      </div>

      {/* Month Progress */}
      {detail.current_month && (
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">
            Progreso del mes — {detail.current_month.name} {detail.current_month.year}
          </p>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full gold-gradient rounded-full transition-all"
                style={{
                  width: `${detail.month_progress.total > 0 ? (detail.month_progress.completed / detail.month_progress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-foreground shrink-0">
              {detail.month_progress.completed}/{detail.month_progress.total}
            </span>
          </div>

          {/* Task list */}
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {detail.month_progress.tasks.map((t: any) => (
              <div key={t.id} className="flex items-center gap-2 py-0.5">
                {t.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
                <span className={`text-[11px] ${t.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {t.sort_order + 1}. {t.title}
                </span>
              </div>
            ))}
          </div>

          {/* Subtask summary */}
          {detail.subtask_progress.total > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Subtareas: {detail.subtask_progress.completed}/{detail.subtask_progress.total} completadas
            </p>
          )}
        </div>
      )}

      {/* Programs (entitlements) */}
      {detail.entitlements?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">Programas vinculados</p>
          <div className="space-y-1">
            {detail.entitlements.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between text-[11px]">
                <span className="text-foreground">{e.access_products?.name || e.access_products?.code || "—"}</span>
                <span className={`font-semibold ${statusConfig[e.status]?.color || "text-muted-foreground"}`}>
                  {statusConfig[e.status]?.label || e.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Notes */}
      {detail.task_notes?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Notas de tareas recientes
          </p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {detail.task_notes.map((n: any) => (
              <div key={n.id} className="text-[11px] bg-muted/50 rounded-lg px-2.5 py-1.5">
                <p className="text-foreground line-clamp-2">{n.note}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {new Date(n.created_at).toLocaleDateString("es-ES")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journal entries */}
      {detail.journals?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Diario reciente
          </p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {detail.journals.map((j: any) => (
              <div key={j.id} className="text-[11px] bg-muted/50 rounded-lg px-2.5 py-1.5">
                <p className="text-foreground line-clamp-2">{j.content}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{j.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent audit actions */}
      {detail.recent_actions?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Historial de acciones
          </p>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {detail.recent_actions.map((a: any, i: number) => (
              <div key={i} className="text-[10px] flex items-center gap-2">
                <span className="text-muted-foreground shrink-0">
                  {new Date(a.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                </span>
                <span className="text-foreground font-medium">{a.action}</span>
                {a.reason && <span className="text-muted-foreground truncate">— {a.reason}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccesos;
