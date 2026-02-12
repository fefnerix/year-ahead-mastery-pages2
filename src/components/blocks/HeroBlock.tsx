import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeroBlockProps {
  config: Record<string, any>;
  weekId: string;
}

const HeroBlock = ({ config, weekId }: HeroBlockProps) => {
  const navigate = useNavigate();
  const {
    cover_image_url,
    headline,
    subheadline,
    primary_cta_label = "Continuar hoy",
    overlay_opacity = 0.6,
  } = config;

  return (
    <div className="relative rounded-xl overflow-hidden">
      {cover_image_url && (
        <div className="relative h-52">
          <img src={cover_image_url} alt={headline || ""} className="w-full h-full object-cover" />
          <div
            className="absolute inset-0 bg-gradient-to-t from-background to-transparent"
            style={{ opacity: overlay_opacity }}
          />
        </div>
      )}
      <div className={`${cover_image_url ? "absolute bottom-0 left-0 right-0" : ""} p-5`}>
        {headline && (
          <h2 className="text-xl font-display font-bold text-foreground">{headline}</h2>
        )}
        {subheadline && (
          <p className="text-sm text-secondary-foreground mt-1">{subheadline}</p>
        )}
        {primary_cta_label && (
          <button
            onClick={() => navigate(`/reto/${weekId}`)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            {primary_cta_label} <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default HeroBlock;
