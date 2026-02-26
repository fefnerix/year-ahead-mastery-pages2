import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import AudioPlayer from "@/components/AudioPlayer";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

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

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/);
    return match?.[1] || null;
  };

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
  const isYouTube = !!videoId;

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

      <main className="px-5 space-y-6">
        {/* 1. Video (first) */}
        {month.video_url && (
          <section className="rounded-2xl overflow-hidden">
            {isYouTube ? (
              <>
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0`}
                    title="Video del mes"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-2xl"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/50 mt-1 text-center">
                  Este video se reproduce via YouTube
                </p>
              </>
            ) : (
              <CustomVideoPlayer src={month.video_url} />
            )}
          </section>
        )}

        {/* 2. Audio (second) */}
        {month.audio_url && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              🎧 Audio del mes
            </p>
            <AudioPlayer src={month.audio_url} title={month.theme || month.name} />
          </section>
        )}

        {/* 3. Macro text (last) */}
        <section className="glass-card rounded-2xl p-5">
          {month.macro_text ? (
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line max-h-[40vh] overflow-y-auto">
              {month.macro_text}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Contenido del mes aún no fue publicado.
            </p>
          )}
        </section>

        {/* 4. CTA — IR A HOY (always visible, navigates to home) */}
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
