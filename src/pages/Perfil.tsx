import BottomNav from "@/components/BottomNav";
import { ChevronRight, Settings, HelpCircle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Perfil = () => {
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";
  const initials = displayName.slice(0, 2).toUpperCase();
  const email = user?.email ?? "";

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
