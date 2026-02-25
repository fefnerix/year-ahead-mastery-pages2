import { Home, CalendarDays, Calendar, Trophy, User, Shield, PenLine } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useAdmin";

const BottomNav = () => {
  const location = useLocation();
  const { data: isAdmin } = useIsAdmin();

  const navItems = [
    { icon: Home, label: "Hoy", path: "/" },
    { icon: Calendar, label: "Calendario", path: "/calendario" },
    { icon: PenLine, label: "Diario", path: "/cuaderno" },
    { icon: Trophy, label: "Ranking", path: "/ranking" },
    { icon: User, label: "Perfil", path: "/perfil" },
    ...(isAdmin ? [{ icon: Shield, label: "Admin", path: "/admin" }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-primary/10 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`relative flex flex-col items-center gap-1 py-2.5 px-3 min-w-[48px] transition-all duration-200 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full gold-gradient" />
              )}
              <Icon
                className={`w-5 h-5 transition-all duration-200 ${
                  isActive ? "drop-shadow-[0_0_10px_hsl(43_56%_59%/0.6)] scale-110" : ""
                }`}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground/70"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
