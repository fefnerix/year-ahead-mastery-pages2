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
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const createDeposit = useCreateDeposit();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    try {
      await createDeposit.mutateAsync({
        amount: Number(amount),
        currency,
        date,
        note: note || undefined,
      });
      toast.success("Depósito registrado");
      setAmount("");
      setNote("");
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const inputClass = "w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card rounded-t-2xl sm:rounded-2xl p-6 space-y-4 safe-area-bottom">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-foreground">Registrar Depósito</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Monto"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className={`${inputClass} flex-1`}
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={`${inputClass} w-24`}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="MXN">MXN</option>
              <option value="COP">COP</option>
              <option value="ARS">ARS</option>
            </select>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
          <textarea
            placeholder="Nota (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={`${inputClass} min-h-0`}
          />
          <button
            type="submit"
            disabled={createDeposit.isPending}
            className="w-full py-3 rounded-xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {createDeposit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
