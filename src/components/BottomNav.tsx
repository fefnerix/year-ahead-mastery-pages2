import { Home, CalendarDays, Trophy, User, Shield } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useAdmin";

const BottomNav = () => {
  const location = useLocation();
  const { data: isAdmin } = useIsAdmin();

  const navItems = [
    { icon: Home, label: "Hoy", path: "/" },
    { icon: CalendarDays, label: "Semana", path: "/semana" },
    { icon: Trophy, label: "Ranking", path: "/ranking" },
    { icon: User, label: "Perfil", path: "/perfil" },
    ...(isAdmin ? [{ icon: Shield, label: "Admin", path: "/admin" }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 py-2.5 px-3 transition-all duration-200 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : ""}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
