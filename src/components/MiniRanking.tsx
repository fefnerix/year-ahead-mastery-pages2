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
  1: <Crown className="w-4 h-4 text-primary" />,
  2: <Medal className="w-4 h-4 text-secondary-foreground" />,
  3: <Trophy className="w-4 h-4 text-streak" />,
};

const MiniRanking = ({ entries, currentUserPosition }: MiniRankingProps) => {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Ranking Semanal</h3>
        <span className="text-xs text-muted-foreground">Tu posición: #{currentUserPosition}</span>
      </div>
      <div className="divide-y divide-border/30">
        {entries.map((entry) => (
          <div
            key={entry.position}
            className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
              entry.isCurrentUser ? "bg-primary/5" : ""
            }`}
          >
            <div className="w-6 flex justify-center">
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
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {entry.score}pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniRanking;
