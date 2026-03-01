import { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
}

const inputClass =
  "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

const MarkdownEditor = ({
  value,
  onChange,
  placeholder = "Usa Markdown: # Título, **negrita**, - listas…",
  rows = 4,
  label,
}: MarkdownEditorProps) => {
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">
          {label}
        </label>
      )}
      <div className="flex gap-1 mb-1.5">
        <button
          type="button"
          onClick={() => setTab("edit")}
          className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
            tab === "edit"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
            tab === "preview"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preview
        </button>
      </div>

      {tab === "edit" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={inputClass}
        />
      ) : (
        <div className="min-h-[80px] bg-muted/40 border border-border rounded-lg px-3 py-2">
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">Sin contenido</p>
          )}
        </div>
      )}

      {tab === "edit" && (
        <p className="text-[10px] text-muted-foreground/50">
          Markdown: # Título, **negrita**, *cursiva*, - listas, [link](url)
        </p>
      )}
    </div>
  );
};

export default MarkdownEditor;
