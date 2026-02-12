import { Crown, Medal, Trophy } from "lucide-react";

interface RankEntry {
  position: number;
  name: string;
  score: number;
  isCurrentUser?: boolean;
}

interface MiniRankingProps {
  entries: RankEntry[];
  currentUserPosition: number;
}

const positionIcons: Record<number, React.ReactNode> = {
  1: <Crown className="w-5 h-5 text-primary" />,
  2: <Medal className="w-5 h-5 text-secondary-foreground" />,
  3: <Trophy className="w-5 h-5 text-streak" />,
};

const MiniRanking = ({ entries, currentUserPosition }: MiniRankingProps) => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top 5</span>
        <span className="text-xs text-primary font-bold">#{currentUserPosition}</span>
      </div>
      <div className="divide-y divide-border/30">
        {entries.map((entry) => (
          <div
            key={entry.position}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              entry.isCurrentUser ? "bg-primary/5 border-l-2 border-l-primary" : ""
            }`}
          >
            <div className="w-7 flex justify-center">
              {positionIcons[entry.position] || (
                <span className="text-xs font-bold text-muted-foreground">
                  {entry.position}
                </span>
              )}
            </div>
            <span
              className={`flex-1 text-sm ${
                entry.isCurrentUser ? "font-bold text-primary" : "font-medium text-foreground"
              }`}
            >
              {entry.name}
            </span>
            <span className="text-xs font-bold text-muted-foreground tabular-nums">
              {entry.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniRanking;
