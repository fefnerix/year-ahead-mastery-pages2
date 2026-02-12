import { Flame } from "lucide-react";

interface StreakBadgeProps {
  current: number;
  record: number;
}

const StreakBadge = ({ current, record }: StreakBadgeProps) => {
  return (
    <div className="glass-card gold-border rounded-xl p-4 flex items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-streak/10 flex items-center justify-center pulse-gold">
          <Flame className="w-6 h-6 text-streak" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">{current}</span>
          <span className="text-sm text-muted-foreground">días seguidos</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Récord: <span className="text-gold-light font-semibold">{record} días</span>
        </div>
      </div>
    </div>
  );
};

export default StreakBadge;
