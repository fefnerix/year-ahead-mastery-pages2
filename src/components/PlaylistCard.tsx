import { Music, ExternalLink, Shuffle } from "lucide-react";

interface PlaylistCardProps {
  title: string;
  subtitle?: string;
  url: string;
}

const PlaylistCard = ({ title, subtitle, url }: PlaylistCardProps) => {
  const openPlaylist = () => window.open(url, "_blank", "noopener");
  const openShuffle = () => window.open(url, "_blank", "noopener");

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-[#1DB954]/15 flex items-center justify-center">
          <Music className="w-5 h-5 text-[#1DB954]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={openPlaylist}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1DB954]/15 text-[#1DB954] text-xs font-semibold hover:bg-[#1DB954]/25 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Abrir playlist
        </button>
        <button
          onClick={openShuffle}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-secondary-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
        >
          <Shuffle className="w-3.5 h-3.5" /> Al azar
        </button>
      </div>
    </div>
  );
};

export default PlaylistCard;
