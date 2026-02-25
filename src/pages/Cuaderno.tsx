import { useState, useMemo } from "react";
import { useAllNotes } from "@/hooks/useTaskNotes";
import { useAllJournalEntries } from "@/hooks/useJournal";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, BookOpen, PenLine, Search, Loader2, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categoryColors: Record<string, string> = {
  cuerpo: "bg-emerald-500/15 text-emerald-400",
  mente: "bg-blue-500/15 text-blue-400",
  alma: "bg-purple-500/15 text-purple-400",
  finanzas: "bg-primary/15 text-primary",
};

type ViewMode = "notas" | "diario";

const Cuaderno = () => {
  const navigate = useNavigate();
  const { data: notes = [], isLoading: notesLoading } = useAllNotes();
  const { data: journalEntries = [], isLoading: journalLoading } = useAllJournalEntries();
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("notas");

  const isLoading = view === "notas" ? notesLoading : journalLoading;

  // Extract unique months from current view data
  const months = useMemo(() => {
    const map = new Map<string, { name: string; number: number }>();
    if (view === "notas") {
      notes.forEach((n) => {
        const m = n.days?.weeks?.months;
        if (m) {
          const key = `${m.number}`;
          if (!map.has(key)) map.set(key, { name: m.name, number: m.number });
        }
      });
    } else {
      journalEntries.forEach((j: any) => {
        const m = j.days?.weeks?.months;
        if (m) {
          const key = `${m.number}`;
          if (!map.has(key)) map.set(key, { name: m.name, number: m.number });
        }
      });
    }
    return Array.from(map.values()).sort((a, b) => a.number - b.number);
  }, [notes, journalEntries, view]);

  // Filter task notes
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (monthFilter !== "all") {
      result = result.filter((n) => String(n.days?.weeks?.months?.number) === monthFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) => n.content.toLowerCase().includes(q) || n.tasks?.title.toLowerCase().includes(q)
      );
    }
    return result;
  }, [notes, search, monthFilter]);

  // Filter journal entries
  const filteredJournal = useMemo(() => {
    let result = journalEntries;
    if (monthFilter !== "all") {
      result = result.filter((j: any) => String(j.days?.weeks?.months?.number) === monthFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((j: any) => j.content.toLowerCase().includes(q));
    }
    return result;
  }, [journalEntries, search, monthFilter]);

  // Group notes by month > week
  type NoteItem = (typeof notes)[number];
  const groupedNotes = useMemo(() => {
    const monthMap = new Map<string, { label: string; weeks: Map<string, { label: string; notes: NoteItem[] }> }>();
    filteredNotes.forEach((note) => {
      const m = note.days?.weeks?.months;
      const w = note.days?.weeks;
      const monthKey = m ? `${m.number}` : "?";
      const monthLabel = m ? `${m.name}` : "Sin contexto";
      const weekKey = w ? `${w.number}` : "?";
      const weekLabel = w ? `Semana ${w.number} — ${w.name}` : "Sin semana";
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, { label: monthLabel, weeks: new Map() });
      const me = monthMap.get(monthKey)!;
      if (!me.weeks.has(weekKey)) me.weeks.set(weekKey, { label: weekLabel, notes: [] });
      me.weeks.get(weekKey)!.notes.push(note);
    });
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, v]) => ({
        label: v.label,
        weeks: Array.from(v.weeks.entries())
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([, w]) => w),
      }));
  }, [filteredNotes]);

  // Group journal by month > week
  const groupedJournal = useMemo(() => {
    const monthMap = new Map<string, { label: string; weeks: Map<string, { label: string; entries: any[] }> }>();
    filteredJournal.forEach((entry: any) => {
      const m = entry.days?.weeks?.months;
      const w = entry.days?.weeks;
      const monthKey = m ? `${m.number}` : "?";
      const monthLabel = m ? `${m.name}` : "Sin contexto";
      const weekKey = w ? `${w.number}` : "?";
      const weekLabel = w ? `Semana ${w.number} — ${w.name}` : "Sin semana";
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, { label: monthLabel, weeks: new Map() });
      const me = monthMap.get(monthKey)!;
      if (!me.weeks.has(weekKey)) me.weeks.set(weekKey, { label: weekLabel, entries: [] });
      me.weeks.get(weekKey)!.entries.push(entry);
    });
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, v]) => ({
        label: v.label,
        weeks: Array.from(v.weeks.entries())
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([, w]) => w),
      }));
  }, [filteredJournal]);

  const currentFiltered = view === "notas" ? filteredNotes : filteredJournal;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Mi Cuaderno</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Todas tus notas y reflexiones</p>

        {/* Toggle Notas / Diario */}
        <div className="flex gap-1 mt-4 p-1 rounded-xl bg-card border border-border">
          <button
            onClick={() => setView("notas")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${view === "notas" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Notas de tareas
          </button>
          <button
            onClick={() => setView("diario")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${view === "diario" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
          >
            <PenLine className="w-3.5 h-3.5" /> Diario
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">Todos</option>
              {months.map((m) => (
                <option key={m.number} value={String(m.number)}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </header>

      <main className="px-5 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : currentFiltered.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center">
            {view === "notas" ? (
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            ) : (
              <PenLine className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            )}
            <p className="text-sm text-muted-foreground">
              {search || monthFilter !== "all"
                ? "No se encontraron resultados con esos filtros"
                : view === "notas"
                ? "Aún no tienes notas. Completa tareas y escribe tus reflexiones."
                : "Aún no tienes entradas en tu diario. Escribe tu reflexión del día."}
            </p>
          </div>
        ) : view === "notas" ? (
          groupedNotes.map((monthGroup) => (
            <div key={monthGroup.label}>
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{monthGroup.label}</h2>
              <div className="space-y-5">
                {monthGroup.weeks.map((weekGroup) => (
                  <section key={weekGroup.label}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">{weekGroup.label}</h3>
                    <div className="space-y-2">
                      {weekGroup.notes.map((note) => (
                        <div key={note.id} className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryColors[note.tasks?.category] ?? "bg-muted text-muted-foreground"}`}>
                              {note.tasks?.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Día {note.days?.number} · {note.days?.date}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground mb-1">{note.tasks?.title}</p>
                          <p className="text-sm text-secondary-foreground whitespace-pre-wrap">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ))
        ) : (
          groupedJournal.map((monthGroup) => (
            <div key={monthGroup.label}>
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{monthGroup.label}</h2>
              <div className="space-y-5">
                {monthGroup.weeks.map((weekGroup) => (
                  <section key={weekGroup.label}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">{weekGroup.label}</h3>
                    <div className="space-y-2">
                      {weekGroup.entries.map((entry: any) => (
                        <div key={entry.id} className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <PenLine className="w-3 h-3 text-primary" />
                            <span className="text-xs text-muted-foreground">
                              Día {entry.days?.number} · {entry.date}
                            </span>
                          </div>
                          <p className="text-sm text-secondary-foreground whitespace-pre-wrap">{entry.content}</p>
                        </div>
                      ))}
                    </div>
                  </section>
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
