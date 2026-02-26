import { useState } from "react";
import { useCreateDeposit } from "@/hooks/useDeposits";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
}

const DepositModal = ({ open, onClose }: DepositModalProps) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const createDeposit = useCreateDeposit();

  if (!open) return null;

  const formatDateBR = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(",", "."));
    if (!num || num <= 0) {
      setError("Ingresa un valor mayor a 0");
      return;
    }
    if (!date) {
      setError("Selecciona una fecha");
      return;
    }
    setError("");
    try {
      await createDeposit.mutateAsync({
        amount: num,
        date,
        note: note.trim() || undefined,
      });
      toast.success("Depósito registrado ✅");
      setAmount("");
      setNote("");
      setDate(new Date().toISOString().split("T")[0]);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const inputClass =
    "w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

  const isValid = (() => {
    const num = parseFloat(amount.replace(",", "."));
    return !!(num && num > 0 && date);
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pb-24 pt-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[calc(100vh-140px)] glass-card gold-border rounded-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 shrink-0">
          <div>
            <h3 className="text-lg font-display font-bold text-foreground">Registrar depósito</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Anota un valor y el motivo. Quedará guardado en tu historial.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-5 space-y-4 pb-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">
                Valor
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.,]/g, "");
                  setAmount(v);
                  if (error) setError("");
                }}
                autoFocus
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">
                Nota <span className="text-muted-foreground/50 normal-case">(opcional)</span>
              </label>
              <textarea
                placeholder="¿Qué significa este depósito para ti?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 px-5 py-4 border-t border-border/30 backdrop-blur-md flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-muted text-secondary-foreground text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createDeposit.isPending || !isValid}
              className="flex-1 py-3 rounded-xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {createDeposit.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando…
                </>
              ) : (
                "Guardar depósito"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
