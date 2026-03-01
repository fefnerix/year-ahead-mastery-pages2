import { useState } from "react";
import { useAdminUsers, useSetAccess, type AdminUser } from "@/hooks/useAccessAdminV2";
import {
  Loader2,
  Search,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  Users,
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

  const { data: users = [], isLoading, error } = useAdminUsers(debouncedSearch || undefined);
  const setAccess = useSetAccess();

  const handleSearch = (val: string) => {
    setSearch(val);
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-display font-bold text-foreground">Accesos</h2>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {users.length} usuarios
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className={`${inputClass} pl-9`}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <ShieldOff className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive font-semibold">No tienes permisos para ver accesos</p>
          <p className="text-xs text-muted-foreground mt-1">{(error as Error).message}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {debouncedSearch ? "No se encontraron usuarios." : "No hay usuarios registrados."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u: AdminUser) => {
            const cfg = statusConfig[u.access_status] || statusConfig.pending;
            const Icon = cfg.icon;

            return (
              <div key={u.user_id} className="glass-card rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {u.display_name || u.email.split("@")[0]}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${cfg.color} shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 flex-wrap">
                  {u.access_status !== "active" && (
                    <button
                      onClick={() => handleStatusChange(u.user_id, "active")}
                      disabled={setAccess.isPending}
                      className="text-[10px] font-semibold px-2 py-1 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors"
                    >
                      Activar
                    </button>
                  )}
                  {u.access_status !== "pending" && u.access_status !== "past_due" && (
                    <button
                      onClick={() => handleStatusChange(u.user_id, "past_due")}
                      disabled={setAccess.isPending}
                      className="text-[10px] font-semibold px-2 py-1 rounded-md bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
                    >
                      Suspender
                    </button>
                  )}
                  {u.access_status !== "revoked" && (
                    <button
                      onClick={() => handleStatusChange(u.user_id, "revoked")}
                      disabled={setAccess.isPending}
                      className="text-[10px] font-semibold px-2 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      Revocar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AdminAccesos;
