import { useState } from "react";
import {
  useEntitlements,
  useUpdateEntitlementStatus,
  useAccessActions,
  useGrantAccess,
} from "@/hooks/useAccessAdmin";
import {
  Loader2,
  Search,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; icon: typeof ShieldCheck }> = {
  active: { label: "Activo", color: "text-success", icon: ShieldCheck },
  past_due: { label: "Pendiente", color: "text-warning", icon: ShieldAlert },
  canceled: { label: "Cancelado", color: "text-destructive", icon: ShieldOff },
  revoked: { label: "Revocado", color: "text-destructive", icon: ShieldOff },
};

const AdminAccesos = () => {
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantUserId, setGrantUserId] = useState("");

  const { data: entitlements = [], isLoading } = useEntitlements(search || undefined);
  const updateStatus = useUpdateEntitlementStatus();
  const grantAccess = useGrantAccess();
  const { data: actions = [] } = useAccessActions(expandedUser || undefined);

  const handleStatusChange = async (
    entId: string,
    userId: string,
    productId: string,
    newStatus: string
  ) => {
    try {
      await updateStatus.mutateAsync({
        entitlementId: entId,
        userId,
        productId,
        newStatus,
      });
      toast.success(`Estado actualizado a ${statusConfig[newStatus]?.label || newStatus}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleGrant = async () => {
    if (!grantUserId.trim()) return;
    try {
      await grantAccess.mutateAsync({ userId: grantUserId.trim() });
      toast.success("Acceso otorgado");
      setGrantUserId("");
      setShowGrantForm(false);
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
        <button
          onClick={() => setShowGrantForm(!showGrantForm)}
          className="text-primary text-sm font-semibold flex items-center gap-1"
        >
          <UserPlus className="w-4 h-4" /> Otorgar
        </button>
      </div>

      {showGrantForm && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <input
            placeholder="User ID (UUID)"
            value={grantUserId}
            onChange={(e) => setGrantUserId(e.target.value)}
            className={inputClass}
          />
          <button
            onClick={handleGrant}
            disabled={grantAccess.isPending}
            className="w-full py-2 rounded-lg gold-gradient font-bold text-primary-foreground text-sm"
          >
            {grantAccess.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              "Otorgar acceso PROGRESS 2026"
            )}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Buscar por nombre o ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} pl-9`}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : entitlements.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">No hay accesos registrados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entitlements.map((ent: any) => {
            const cfg = statusConfig[ent.status] || statusConfig.revoked;
            const Icon = cfg.icon;
            const isExpanded = expandedUser === ent.user_id;

            return (
              <div key={ent.id} className="glass-card rounded-xl overflow-hidden">
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {ent.display_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {ent.product_name} · {ent.source}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                      <button
                        onClick={() =>
                          setExpandedUser(isExpanded ? null : ent.user_id)
                        }
                        className="p-1 text-muted-foreground"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 flex-wrap">
                    {ent.status !== "active" && (
                      <button
                        onClick={() =>
                          handleStatusChange(ent.id, ent.user_id, ent.product_id, "active")
                        }
                        disabled={updateStatus.isPending}
                        className="text-[10px] font-semibold px-2 py-1 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors"
                      >
                        Activar
                      </button>
                    )}
                    {ent.status !== "past_due" && (
                      <button
                        onClick={() =>
                          handleStatusChange(ent.id, ent.user_id, ent.product_id, "past_due")
                        }
                        disabled={updateStatus.isPending}
                        className="text-[10px] font-semibold px-2 py-1 rounded-md bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
                      >
                        Suspender
                      </button>
                    )}
                    {ent.status !== "revoked" && (
                      <button
                        onClick={() =>
                          handleStatusChange(ent.id, ent.user_id, ent.product_id, "revoked")
                        }
                        disabled={updateStatus.isPending}
                        className="text-[10px] font-semibold px-2 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        Revocar
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded: Action history */}
                {isExpanded && (
                  <div className="border-t border-border px-3 py-2 space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Historial
                    </p>
                    {actions.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground">Sin historial.</p>
                    ) : (
                      actions.slice(0, 10).map((a: any) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between text-[10px]"
                        >
                          <span className="text-foreground font-medium">
                            {a.action.toUpperCase()}
                          </span>
                          <span className="text-muted-foreground">
                            {a.reason || "—"} ·{" "}
                            {new Date(a.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AdminAccesos;
