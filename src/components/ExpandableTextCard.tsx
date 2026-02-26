import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableTextCardProps {
  text: string | null | undefined;
  emptyMessage?: string;
  maxLines?: number;
}

const ExpandableTextCard = ({
  text,
  emptyMessage = "Contenido del mes aún no fue publicado.",
  maxLines = 12,
}: ExpandableTextCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el || !text) return;
    // Check if text exceeds maxLines
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24;
    const maxHeight = lineHeight * maxLines;
    setNeedsExpand(el.scrollHeight > maxHeight + 4);
  }, [text, maxLines]);

  if (!text) {
    return (
      <div className="premium-card rounded-[20px] p-5">
        <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="premium-card rounded-[20px] p-5">
      <div className="relative">
        <p
          ref={textRef}
          className="text-[15px] leading-[1.7] text-foreground/90 whitespace-pre-line transition-all"
          style={
            !expanded && needsExpand
              ? { maxHeight: `${maxLines * 1.7}em`, overflow: "hidden" }
              : undefined
          }
        >
          {text}
        </p>
        {/* Gradient fade when collapsed */}
        {needsExpand && !expanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, transparent, hsl(230 40% 6% / 0.95))",
            }}
          />
        )}
      </div>
      {needsExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {expanded ? (
            <>Mostrar menos <ChevronUp className="w-3.5 h-3.5" /></>
          ) : (
            <>Leer más <ChevronDown className="w-3.5 h-3.5" /></>
          )}
        </button>
      )}
    </div>
  );
};

export default ExpandableTextCard;
