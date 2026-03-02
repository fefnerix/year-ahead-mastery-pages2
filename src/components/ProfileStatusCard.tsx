import { useState, useEffect } from "react";
import { useProfileStatus, useUpsertProfileStatus } from "@/hooks/useProfileStatus";
import { Pencil, Check, X, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const FIELDS = [
  { key: "ingresos_actuales", label: "Ingresos actuales", placeholder: "Ej: $1,000" },
  { key: "gastos_actuales", label: "Gastos actuales", placeholder: "Ej: $1,000" },
  { key: "ahorro_actual", label: "Ahorro actual", placeholder: "Ej: $1,000" },
  { key: "deuda_total", label: "Deuda total actual", placeholder: "Ej: $1,000" },
  { key: "pagos_minimos", label: "Pagos mínimos totales", placeholder: "Ej: $1,000" },
  { key: "inversion_en_uno", label: "Inversión en uno mismo", placeholder: "Ej: $1,000" },
  { key: "libros_leidos", label: "Libros leídos al año", placeholder: "Ej: 12" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

const ProfileStatusCard = () => {
  const { data: status, isLoading } = useProfileStatus();
  const upsert = useUpsertProfileStatus();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<FieldKey, string>>({
    ingresos_actuales: "",
    gastos_actuales: "",
    ahorro_actual: "",
    deuda_total: "",
    pagos_minimos: "",
    inversion_en_uno: "",
    libros_leidos: "",
  });

  useEffect(() => {
    if (status) {
      setForm({
        ingresos_actuales: status.ingresos_actuales || "",
        gastos_actuales: status.gastos_actuales || "",
        ahorro_actual: status.ahorro_actual || "",
        deuda_total: status.deuda_total || "",
        pagos_minimos: status.pagos_minimos || "",
        inversion_en_uno: status.inversion_en_uno || "",
        libros_leidos: status.libros_leidos || "",
      });
    }
  }, [status]);

  const handleSave = async () => {
    try {
      await upsert.mutateAsync(form);
      setEditing(false);
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al guardar");
    }
  };

  const hasData = status && FIELDS.some((f) => status[f.key]);

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Mi estado actual
        </p>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              disabled={upsert.isPending}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-primary"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditing(false);
                if (status) {
                  setForm({
                    ingresos_actuales: status.ingresos_actuales || "",
                    gastos_actuales: status.gastos_actuales || "",
                    ahorro_actual: status.ahorro_actual || "",
                    deuda_total: status.deuda_total || "",
                    pagos_minimos: status.pagos_minimos || "",
                    inversion_en_uno: status.inversion_en_uno || "",
                    libros_leidos: status.libros_leidos || "",
                  });
                }
              }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      ) : editing ? (
        <div className="space-y-2.5">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-0.5">
              <label className="text-[11px] text-muted-foreground font-medium">
                {f.label}
              </label>
              <input
                type="text"
                value={form[f.key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>
      ) : !hasData ? (
        <button
          onClick={() => setEditing(true)}
          className="w-full py-6 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          Toca para registrar tu estado actual →
        </button>
      ) : (
        <div className="space-y-1.5">
          {FIELDS.map((f) => {
            const val = status?.[f.key];
            if (!val) return null;
            return (
              <div
                key={f.key}
                className="flex items-center justify-between py-1 border-b border-border/20 last:border-0"
              >
                <span className="text-xs text-muted-foreground">{f.label}</span>
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileStatusCard;
