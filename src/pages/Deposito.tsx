import { useState } from "react";
import { useDeposits, useDeleteDeposit } from "@/hooks/useDeposits";
import BottomNav from "@/components/BottomNav";
import DepositModal from "@/components/DepositModal";
import { ArrowLeft, DollarSign, Plus, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Deposito = () => {
  const navigate = useNavigate();
  const { data: deposits = [], isLoading } = useDeposits();
  const deleteDeposit = useDeleteDeposit();
  const [showModal, setShowModal] = useState(false);

  const total = deposits.reduce((sum, d) => sum + Number(d.amount), 0);

  const handleDelete = async (id: string) => {
    try {
      await deleteDeposit.mutateAsync(id);
      toast.success("Depósito eliminado");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Depósito de Abundancia</h1>
            <p className="text-sm text-muted-foreground">
              Total: <span className="text-primary font-bold">${total.toFixed(2)}</span>{" "}
              <span className="text-xs text-primary">x100</span>
            </p>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-4">
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 rounded-xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo depósito
        </button>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : deposits.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center">
            <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aún no tienes depósitos registrados.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {deposits.map((d) => (
              <div key={d.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    ${Number(d.amount).toFixed(2)} <span className="text-xs text-muted-foreground">{d.currency}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{d.date}</p>
                  {d.note && <p className="text-xs text-secondary-foreground mt-1">{d.note}</p>}
                </div>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <DepositModal open={showModal} onClose={() => setShowModal(false)} />
      <BottomNav />
    </div>
  );
};

export default Deposito;
