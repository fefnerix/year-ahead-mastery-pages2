import { WeekBlock } from "@/hooks/useWeekBlocks";
import HeroBlock from "./blocks/HeroBlock";
import AudioBlock from "./blocks/AudioBlock";
import VideoBlock from "./blocks/VideoBlock";
import TextBlock from "./blocks/TextBlock";
import CronogramaBlock from "./blocks/CronogramaBlock";
import PlaylistsBlock from "./blocks/PlaylistsBlock";
import ResourcesBlock from "./blocks/ResourcesBlock";
import DaysMapBlock from "./blocks/DaysMapBlock";

interface BlockRendererProps {
  block: WeekBlock;
  weekId: string;
  days?: any[];
  weekProgress?: number;
}

const BlockRenderer = ({ block, weekId, days, weekProgress }: BlockRendererProps) => {
  if (!block.is_visible) return null;

  const config = block.config;

  switch (block.type) {
    case "hero":
      return <HeroBlock config={config} weekId={weekId} />;
    case "audio":
      return <AudioBlock config={config} title={block.title} />;
    case "video":
      return <VideoBlock config={config} title={block.title} />;
    case "text":
      return <TextBlock config={config} title={block.title} />;
    case "cronograma":
      return <CronogramaBlock config={config} />;
    case "playlists":
      return <PlaylistsBlock config={config} />;
    case "resources":
      return <ResourcesBlock config={config} title={block.title} />;
    case "days_map":
      return <DaysMapBlock config={config} weekId={weekId} days={days} />;
    default:
      return (
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Bloque desconocido: {block.type}</p>
        </div>
      );
  }
};

export default BlockRenderer;
