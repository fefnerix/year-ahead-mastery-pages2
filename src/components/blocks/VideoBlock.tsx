interface VideoBlockProps {
  config: Record<string, any>;
  title?: string | null;
}

const VideoBlock = ({ config, title }: VideoBlockProps) => {
  const { provider = "youtube", video_url, description, aspect = "16:9" } = config;
  if (!video_url) return null;

  const aspectClass = aspect === "16:9" ? "aspect-video" : aspect === "4:3" ? "aspect-[4/3]" : "aspect-video";

  let embedUrl = video_url;
  if (provider === "youtube") {
    const match = video_url.match(/(?:youtu\.be\/|v=)([\w-]+)/);
    if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
  } else if (provider === "vimeo") {
    const match = video_url.match(/vimeo\.com\/(\d+)/);
    if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {title && (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground p-4 pb-0">{title}</p>
      )}
      <div className={`${aspectClass} w-full`}>
        {provider === "url" ? (
          <video src={video_url} controls className="w-full h-full object-contain rounded-b-xl" />
        ) : (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground p-4 pt-2">{description}</p>
      )}
    </div>
  );
};

export default VideoBlock;
