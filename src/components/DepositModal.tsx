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
      toast.success("Depósito salvo ✅");
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card gold-border rounded-t-2xl sm:rounded-2xl p-6 space-y-5 safe-area-bottom">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display font-bold text-foreground">Registrar depósito</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Anota um valor e o motivo. Fica salvo no seu histórico.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Valor */}
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

          {/* Data */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Nota */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">
              Nota <span className="text-muted-foreground/50 normal-case">(opcional)</span>
            </label>
            <textarea
              placeholder="O que esse depósito significa pra você?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-muted text-secondary-foreground text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createDeposit.isPending}
              className="flex-1 py-3 rounded-xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {createDeposit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
