import { useMemo } from "react";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  showPercentage?: boolean;
}

const ProgressRing = ({ progress, size = 72, strokeWidth = 4, label, showPercentage = true }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
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
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">{progress}%</span>
          </div>
        )}
      </div>
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
};

export default ProgressRing;
