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
    <section className="glass-card rounded-xl p-4 border border-primary/10">
      <div className="flex items-center gap-2 mb-2">
        <PenLine className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reflexión del día</p>
        {saveJournal.isPending && <Loader2 className="w-3 h-3 text-muted-foreground animate-spin ml-auto" />}
        {saved && !saveJournal.isPending && <Check className="w-3 h-3 text-emerald-400 ml-auto" />}
      </div>
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="¿Qué aprendiste hoy? ¿Qué te movió?"
        rows={3}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
      />
    </section>
  );
};

export default JournalInput;
