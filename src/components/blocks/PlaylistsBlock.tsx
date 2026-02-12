import PlaylistCard from "@/components/PlaylistCard";

interface PlaylistsBlockProps {
  config: Record<string, any>;
}

const PlaylistsBlock = ({ config }: PlaylistsBlockProps) => {
  const { spiritual_playlist_url, mental_playlist_url } = config;

  if (!spiritual_playlist_url && !mental_playlist_url) return null;

  return (
    <div className="space-y-3">
      {spiritual_playlist_url && (
        <PlaylistCard title="Vibración Espiritual" url={spiritual_playlist_url} />
      )}
      {mental_playlist_url && (
        <PlaylistCard title="Vibración Mental" url={mental_playlist_url} />
      )}
    </div>
  );
};

export default PlaylistsBlock;
