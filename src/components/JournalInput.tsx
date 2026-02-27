import { useState, useEffect, useRef } from "react";
import { useJournalEntry, useSaveJournal } from "@/hooks/useJournal";
import { PenLine, Check, Loader2 } from "lucide-react";

interface JournalInputProps {
  date: string;
  dayId?: string;
  weekId?: string;
  monthId?: string;
}

const JournalInput = ({ date, dayId, weekId, monthId }: JournalInputProps) => {
  const { data: entry } = useJournalEntry(date);
  const saveJournal = useSaveJournal();
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (entry?.content != null) setContent(entry.content);
  }, [entry?.content]);

  const handleChange = (val: string) => {
    setContent(val);
    setSaved(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveJournal.mutate(
        { date, content: val, dayId, weekId, monthId },
        { onSuccess: () => setSaved(true) }
      );
    }, 1500);
  };

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (content !== (entry?.content ?? "")) {
      saveJournal.mutate(
        { date, content, dayId, weekId, monthId },
        { onSuccess: () => setSaved(true) }
      );
    }
  };

  return (
    <section className="glass-card rounded-xl border border-primary/10 focus-within:border-primary/30 transition-colors duration-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <PenLine className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1">
          Reflexión del día
        </p>
        {saveJournal.isPending && (
          <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
        )}
        {saved && !saveJournal.isPending && (
          <span className="flex items-center gap-1 text-[10px] text-success font-semibold">
            <Check className="w-3 h-3" /> Guardado
          </span>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onFocus={() => {
          requestAnimationFrame(() => {
            textareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          });
        }}
        placeholder="¿Qué aprendiste hoy? ¿Qué te movió?"
        rows={3}
        className="w-full bg-transparent text-[16px] md:text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none px-4 pb-4 min-h-[80px]"
      />
    </section>
  );
};

export default JournalInput;
