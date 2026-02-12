import BottomNav from "@/components/BottomNav";
import { Award, ChevronRight, Settings } from "lucide-react";

const Perfil = () => {
  const stats = [
    { label: "Días completados", value: "68" },
    { label: "Streak actual", value: "12" },
    { label: "Streak récord", value: "34" },
    { label: "Progreso anual", value: "74%" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center">
            <span className="text-xl font-bold text-primary-foreground">JR</span>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Juan Reyes</h1>
            <p className="text-sm text-muted-foreground">Miembro desde Enero 2026</p>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
              <div className="text-2xl font-bold gold-text">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Certification Status */}
        <div className="glass-card gold-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Certificación Anual</h3>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
            <div className="h-full gold-gradient rounded-full" style={{ width: "74%" }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso: 74%</span>
            <span>Meta: 80%</span>
          </div>
          <p className="text-xs text-secondary-foreground mt-2">
            Te faltan <span className="text-primary font-semibold">6%</span> para obtener tu certificación
          </p>
        </div>

        {/* Menu */}
        <div className="glass-card rounded-xl overflow-hidden">
          {["Mi Progreso", "Materiales Guardados", "Configuración"].map((item, i) => (
            <button
              key={item}
              className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-foreground hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
            >
              <span className="font-medium">{item}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Perfil;
