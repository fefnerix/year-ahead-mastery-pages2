import { useState } from "react";
import { useDepositTotal } from "@/hooks/useDeposits";
import { DollarSign, Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import DepositModal from "./DepositModal";

const DepositCard = () => {
  const total = useDepositTotal();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="glass-card gold-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Depósito de Abundancia</p>
              <p className="text-lg font-display font-bold text-foreground">
                ${total.toFixed(2)} <span className="text-xs text-primary font-semibold">x100</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg gold-gradient text-primary-foreground text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar depósito
          </button>
          <Link
            to="/deposito"
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-muted text-secondary-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
          >
            Historial <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
      <DepositModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default DepositCard;
