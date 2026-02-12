import { useState } from "react";
import { useDepositTotal } from "@/hooks/useDeposits";
import { Vault, Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import DepositModal from "./DepositModal";

const DepositCard = () => {
  const total = useDepositTotal();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="glass-card gold-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Vault className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Depósito de Abundancia</p>
              <p className="text-xl font-display font-bold text-foreground">
                ${total.toFixed(2)}
                <span className="text-[10px] text-primary font-semibold ml-1.5 font-sans">×100</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar
          </button>
          <Link
            to="/deposito"
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-muted text-secondary-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
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
