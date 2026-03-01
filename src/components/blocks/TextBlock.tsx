import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface TextBlockProps {
  config: Record<string, any>;
  title?: string | null;
}

const TextBlock = ({ config, title }: TextBlockProps) => {
  const { content_richtext = "", collapsed_preview_lines = 12 } = config;
  const [expanded, setExpanded] = useState(false);

  if (!content_richtext) return null;

  const lines = content_richtext.split("\n");
  const isLong = lines.length > collapsed_preview_lines;

  return (
    <div className="glass-card rounded-xl p-4">
      {title && (
        <p className="text-sm font-semibold text-foreground mb-2">{title}</p>
      )}
      <div
        className={`${!expanded && isLong ? "overflow-hidden" : ""}`}
        style={!expanded && isLong ? { maxHeight: `${collapsed_preview_lines * 1.5}em`, overflow: "hidden" } : undefined}
      >
        <MarkdownRenderer content={content_richtext} />
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-semibold text-primary flex items-center gap-1"
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

export default TextBlock;
