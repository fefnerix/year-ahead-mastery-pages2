import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMonthResources, type MonthResource } from "@/hooks/useMonthResources";
import BottomNav from "@/components/BottomNav";
import AudioPlayer from "@/components/AudioPlayer";
import YouTubeProgressPlayer from "@/components/YouTubeProgressPlayer";
import ExpandableTextCard from "@/components/ExpandableTextCard";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { ArrowLeft, ArrowRight, Loader2, FileText, ExternalLink, Image, Headphones, Play } from "lucide-react";
import { getYouTubeId, isYouTubeUrl } from "@/lib/media-utils";

const RESOURCE_ICON: Record<string, React.ReactNode> = {
  image: <Image className="w-4 h-4 text-primary" />,
  video: <Play className="w-4 h-4 text-primary" />,
  audio: <Headphones className="w-4 h-4 text-primary" />,
  file: <FileText className="w-4 h-4 text-primary" />,
  link: <ExternalLink className="w-4 h-4 text-primary" />,
};

const MonthDetail = () => {
  const { monthId } = useParams<{ monthId: string }>();
  const navigate = useNavigate();

  const { data: month, isLoading } = useQuery({
    queryKey: ["month-detail", monthId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("months")
        .select("*")
        .eq("id", monthId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!monthId,
  });

  const { data: resources = [] } = useMonthResources(monthId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!month) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-5">
        <p className="text-muted-foreground text-sm">Mes no encontrado</p>
        <button onClick={() => navigate("/")} className="text-primary text-sm font-semibold">
          Volver al inicio
        </button>
      </div>
    );
  }

  const videoId = month.video_url ? getYouTubeId(month.video_url) : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
          Reto del Mes
        </span>
        <h1 className="text-2xl font-display font-bold text-foreground mt-1">
          {month.theme || month.name}
        </h1>
        {month.theme && (
          <p className="text-sm text-muted-foreground mt-0.5">{month.name}</p>
        )}
      </header>

      <main className="px-5 space-y-4">
        {/* 1. Image */}
        {(month as any).image_url && (
          <img
            src={(month as any).image_url}
            alt=""
            className="w-full rounded-[20px] border border-border/30"
            loading="lazy"
          />
        )}

        {/* 2. Video — YouTubeProgressPlayer */}
        {videoId && (
          <YouTubeProgressPlayer videoId={videoId} />
        )}

        {/* 3. Audio */}
        {month.audio_url && (
          <AudioPlayer src={month.audio_url} title={month.theme || month.name} />
        )}

        {/* 4. Text — Markdown or plain */}
        {month.macro_text ? (
          <div className="premium-card rounded-[20px] p-5">
            <MarkdownRenderer content={month.macro_text} />
          </div>
        ) : (
          <ExpandableTextCard text={null} />
        )}

        {/* 5. Month Resources */}
        {resources.length > 0 && (
          <MonthResourcesList resources={resources} />
        )}

        {/* CTA */}
        <button
          onClick={() => navigate("/")}
          className="w-full py-4 rounded-2xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2 gold-glow shimmer press-scale"
        >
          Ir al inicio <ArrowRight className="w-4 h-4" />
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

/* ── Resources List for App ── */

const MonthResourcesList = ({ resources }: { resources: MonthResource[] }) => {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Recursos del Mes
      </p>
      <div className="space-y-2">
        {resources.map((r) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-2.5 px-3 bg-muted/50 rounded-lg text-sm text-secondary-foreground hover:text-foreground transition-colors"
          >
            <span className="shrink-0">{RESOURCE_ICON[r.kind] || RESOURCE_ICON.link}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{r.title || "Recurso"}</p>
              {r.description && (
                <p className="text-[10px] text-muted-foreground truncate">{r.description}</p>
              )}
            </div>
            {r.kind === "file" && (
              <span className="text-[10px] font-semibold text-primary shrink-0">Descargar</span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
};

export default MonthDetail;
