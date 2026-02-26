import BottomNav from "@/components/BottomNav";
import DepositCard from "@/components/DepositCard";
import { ChevronRight, Settings, HelpCircle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDeposits } from "@/hooks/useDeposits";


const Perfil = () => {
  const { user, signOut } = useAuth();
  const { data: deposits = [] } = useDeposits();

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";
  const initials = displayName.slice(0, 2).toUpperCase();
  const email = user?.email ?? "";

  const recentDeposits = deposits.slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center">
            <span className="text-xl font-bold text-primary-foreground">{initials}</span>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-5">
        {/* Abundancia */}
        <DepositCard />

        {/* Recent deposits */}
        {recentDeposits.length > 0 && (
          <div className="glass-card rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Últimos depósitos
            </p>
            {recentDeposits.map((dep) => (
              <div key={dep.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {dep.note || "Sin nota"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {(() => { const [y, mo, da] = dep.date.split("-"); return `${da}/${mo}/${y}`; })()}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary tabular-nums ml-3">
                  +{Number(dep.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Settings */}
        <div className="glass-card rounded-xl overflow-hidden">
          <button className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-foreground hover:bg-muted/50 transition-colors border-b border-border/30">
            <span className="flex items-center gap-3 font-medium">
              <Settings className="w-4 h-4 text-muted-foreground" /> Configuración
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-foreground hover:bg-muted/50 transition-colors border-b border-border/30">
            <span className="flex items-center gap-3 font-medium">
              <HelpCircle className="w-4 h-4 text-muted-foreground" /> Soporte y Ayuda
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-destructive hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-3 font-medium">
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </span>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Perfil;
