import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import AudioPlayer from "@/components/AudioPlayer";
import YouTubeProgressPlayer from "@/components/YouTubeProgressPlayer";
import ExpandableTextCard from "@/components/ExpandableTextCard";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { getYouTubeId } from "@/lib/media-utils";

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

        {/* 4. Text — ExpandableTextCard */}
        <ExpandableTextCard text={month.macro_text} />

        {/* CTA */}
        <button
          onClick={() => navigate("/")}
          className="w-full py-4 rounded-2xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2 gold-glow shimmer press-scale"
        >
          Ir a hoy <ArrowRight className="w-4 h-4" />
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

export default MonthDetail;
