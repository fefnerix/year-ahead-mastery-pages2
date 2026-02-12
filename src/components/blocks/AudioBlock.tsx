import AudioPlayer from "@/components/AudioPlayer";

interface AudioBlockProps {
  config: Record<string, any>;
  title?: string | null;
}

const AudioBlock = ({ config, title }: AudioBlockProps) => {
  const { audio_url, description } = config;
  if (!audio_url) return null;

  return (
    <div className="space-y-2">
      <AudioPlayer src={audio_url} title={title || "Audio"} />
      {description && (
        <p className="text-xs text-muted-foreground px-1">{description}</p>
      )}
    </div>
  );
};

export default AudioBlock;
