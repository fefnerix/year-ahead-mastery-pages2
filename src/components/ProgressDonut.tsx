interface DonutProps {
  value: number;
  label: string;
  gradientId: string;
  size?: number;
  strokeWidth?: number;
}

const Donut = ({ value, label, gradientId, size = 48, strokeWidth = 4.5 }: DonutProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(43 56% 59%)" />
              <stop offset="100%" stopColor="hsl(43 60% 75%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-foreground">{value}%</span>
        </div>
      </div>
      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
  );
};

interface ProgressDonutProps {
  mesPct: number;
  totalPct: number;
  monthLabel: string;
}

import React from "react";

const ProgressDonut = React.memo(({ mesPct, totalPct, monthLabel }: ProgressDonutProps) => {
  return (
    <div className="glass-card rounded-xl px-4 py-3 border border-primary/10 flex items-center gap-4">
      <Donut value={mesPct} label="Mes" gradientId="gold-grad-mes" />
      <Donut value={totalPct} label="Total" gradientId="gold-grad-total" />
      <div className="flex-1 min-w-0 text-right">
        <p className="text-[11px] font-semibold text-foreground truncate capitalize">{monthLabel}</p>
      </div>
    </div>
  );
});

ProgressDonut.displayName = "ProgressDonut";

export default ProgressDonut;
