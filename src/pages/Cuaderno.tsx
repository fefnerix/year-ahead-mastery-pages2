import { useState, useMemo } from "react";
import { useAllNotes } from "@/hooks/useTaskNotes";
import { useAllJournalEntries } from "@/hooks/useJournal";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, BookOpen, PenLine, Search, ChevronDown, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  cuerpo: "bg-emerald-500/15 text-emerald-400",
  mente: "bg-blue-500/15 text-blue-400",
  alma: "bg-purple-500/15 text-purple-400",
  finanzas: "bg-primary/15 text-primary",
};

type ViewMode = "notas" | "diario";

const formatDateLabel = (dateStr: string) => {
  try {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
};

/** Get YYYY-MM-DD for today in BRT */
const getTodayBRT = () => {
  const now = new Date();
  const brt = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const y = brt.getFullYear();
  const m = String(brt.getMonth() + 1).padStart(2, "0");
  const d = String(brt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** Extract YYYY-MM-DD from an ISO date or date string */
const toDayKey = (dateStr: string) => {
  // If already YYYY-MM-DD, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Otherwise parse ISO and extract date portion
  try {
    const d = new Date(dateStr);
    const brt = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const y = brt.getFullYear();
    const m = String(brt.getMonth() + 1).padStart(2, "0");
    const day = String(brt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return dateStr.slice(0, 10);
  }
};

type DayFilter = "all" | "today" | string; // string = YYYY-MM-DD

const NotesSkeleton = () => (
  <div className="space-y-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="glass-card rounded-xl p-4 animate-pulse border border-primary/5">
        <div className="flex gap-2 mb-3">
          <div className="h-4 bg-white/10 rounded-full w-16" />
          <div className="h-4 bg-white/10 rounded w-20" />
        </div>
        <div className="h-3.5 bg-white/10 rounded w-3/4 mb-2" />
        <div className="h-3 bg-white/8 rounded w-full mb-1" />
        <div className="h-3 bg-white/8 rounded w-2/3" />
      </div>
    ))}
  </div>
);

const Cuaderno = () => {
  const navigate = useNavigate();
  const { data: notes = [], isLoading: notesLoading } = useAllNotes();
  const { data: journalEntries = [], isLoading: journalLoading } = useAllJournalEntries();
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const [view, setView] = useState<ViewMode>("diario");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);

  const isLoading = view === "notas" ? notesLoading : journalLoading;

  const activeDayKey = useMemo(() => {
    if (dayFilter === "all") return null;
    if (dayFilter === "today") return getTodayBRT();
    return dayFilter; // YYYY-MM-DD
  }, [dayFilter]);

  const dayFilterLabel = useMemo(() => {
    if (dayFilter === "all") return "Todos";
    if (dayFilter === "today") return "Hoy";
    return formatDateLabel(dayFilter);
  }, [dayFilter]);

  // --- Notes filtering & grouping by date ---
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeDayKey) {
      result = result.filter((n) => {
        const key = n.days?.date ? toDayKey(n.days.date) : toDayKey(n.created_at);
        return key === activeDayKey;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) => n.content.toLowerCase().includes(q) || n.tasks?.title.toLowerCase().includes(q)
      );
    }
    return result;
  }, [notes, search, activeDayKey]);

  const filteredJournal = useMemo(() => {
    let result = journalEntries;
    if (activeDayKey) {
      result = result.filter((j: any) => {
        const key = toDayKey(j.date);
        return key === activeDayKey;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((j: any) => j.content.toLowerCase().includes(q));
    }
    return result;
  }, [journalEntries, search, activeDayKey]);

  // Group notes by date (descending)
  type NoteItem = (typeof notes)[number];
  const groupedNotes = useMemo(() => {
    const dateMap = new Map<string, NoteItem[]>();
    filteredNotes.forEach((note) => {
      const key = note.days?.date ? toDayKey(note.days.date) : toDayKey(note.created_at);
      if (!dateMap.has(key)) dateMap.set(key, []);
      dateMap.get(key)!.push(note);
    });
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => b.localeCompare(a)) // newest first
      .map(([dateKey, items]) => ({ dateKey, label: formatDateLabel(dateKey), notes: items }));
  }, [filteredNotes]);

  // Group journal by date (descending)
  const groupedJournal = useMemo(() => {
    const dateMap = new Map<string, any[]>();
    filteredJournal.forEach((entry: any) => {
      const key = toDayKey(entry.date);
      if (!dateMap.has(key)) dateMap.set(key, []);
      dateMap.get(key)!.push(entry);
    });
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, entries]) => ({ dateKey, label: formatDateLabel(dateKey), entries }));
  }, [filteredJournal]);

  const currentFiltered = view === "notas" ? filteredNotes : filteredJournal;

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    setCalendarDate(date);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    setDayFilter(`${y}-${m}-${d}`);
    setCalendarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pt-12 pb-4 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors press-scale"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="flex items-center gap-2">
          <PenLine className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Mi Diario</h1>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">Tus reflexiones y notas del programa</p>

        <div className="flex gap-1 p-1 rounded-xl bg-card border border-border">
          {(["diario", "notas"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 press-scale ${
                view === v
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "diario" ? <PenLine className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
              {v === "diario" ? "Diario" : "Notas de tareas"}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          {/* Day filter dropdown */}
          <div className="relative">
            <select
              value={dayFilter === "all" || dayFilter === "today" ? dayFilter : "custom"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "all" || val === "today") {
                  setDayFilter(val);
                  setCalendarDate(undefined);
                } else {
                  setCalendarOpen(true);
                }
              }}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary/40 cursor-pointer transition-colors"
            >
              <option value="all">Todos</option>
              <option value="today">Hoy</option>
              <option value="custom">
                {dayFilter !== "all" && dayFilter !== "today" ? dayFilterLabel : "Elegir fecha..."}
              </option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Calendar popover for custom date */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button className="sr-only" aria-label="Abrir calendario" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={calendarDate}
                onSelect={handleCalendarSelect}
                className={cn("p-3 pointer-events-auto")}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <main className="px-5 space-y-6">
        {isLoading ? (
          <NotesSkeleton />
        ) : currentFiltered.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center border border-muted/20 space-y-3">
            {view === "notas" ? (
              <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto" />
            ) : (
              <PenLine className="w-10 h-10 text-muted-foreground/50 mx-auto" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">
                {search || dayFilter !== "all" ? "Sin resultados" : view === "notas" ? "Sin notas aun" : "Sin entradas aun"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || dayFilter !== "all"
                  ? "Prueba con otros filtros o terminos de busqueda."
                  : view === "notas"
                  ? "Completa tareas y escribe tus reflexiones para verlas aqui."
                  : "Escribe tu reflexion del dia desde la pantalla de Inicio."}
              </p>
            </div>
          </div>
        ) : view === "notas" ? (
          groupedNotes.map((group) => (
            <div key={group.dateKey}>
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.notes.map((note) => (
                  <div key={note.id} className="glass-card rounded-xl p-4 border border-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          categoryColors[note.tasks?.category] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {note.tasks?.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateLabel(note.days?.date ?? toDayKey(note.created_at))}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">{note.tasks?.title}</p>
                    <p className="text-sm text-secondary-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          groupedJournal.map((group) => (
            <div key={group.dateKey}>
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.entries.map((entry: any) => (
                  <div key={entry.id} className="glass-card rounded-xl p-4 border border-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <PenLine className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatDateLabel(entry.date)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Cuaderno;
