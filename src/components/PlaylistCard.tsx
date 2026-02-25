import { Music, ExternalLink, Shuffle } from "lucide-react";

interface PlaylistCardProps {
  title: string;
  subtitle?: string;
  url: string;
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    console.warn("[PlaylistCard] Invalid URL:", url);
    return false;
  }
};

const PlaylistCard = ({ title, subtitle, url }: PlaylistCardProps) => {
  const valid = isValidUrl(url);

  if (!valid) return null;

  const openPlaylist = () => window.open(url, "_blank", "noopener");

  // Build shuffle URL for Spotify
  const isSpotify = url.includes("spotify.com") || url.includes("spotify:");
  const shuffleUrl = isSpotify && url.includes("playlist")
    ? `${url}${url.includes("?") ? "&" : "?"}go=1&nd=1`
    : url;
  const openShuffle = () => window.open(shuffleUrl, "_blank", "noopener");

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Music className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={openPlaylist}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-wider"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Abrir playlist
        </button>
        <button
          onClick={openShuffle}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted text-secondary-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
        >
          <Shuffle className="w-3.5 h-3.5" /> Al azar
        </button>
      </div>
    </div>
  );
};

export default PlaylistCard;
