import { ExternalLink, FileText } from "lucide-react";

interface ResourcesBlockProps {
  config: Record<string, any>;
  title?: string | null;
}

const ResourcesBlock = ({ config, title }: ResourcesBlockProps) => {
  const items: Array<{ label: string; url: string; type: string }> = config.items ?? [];
  if (items.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {title || "Recursos"}
      </p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-2 px-3 bg-muted/50 rounded-lg text-sm text-secondary-foreground hover:text-foreground transition-colors"
          >
            {item.type === "file" ? (
              <FileText className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <ExternalLink className="w-4 h-4 text-primary shrink-0" />
            )}
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
};

export default ResourcesBlock;
