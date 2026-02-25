import { useState, useMemo } from "react";
import { useAllNotes } from "@/hooks/useTaskNotes";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, BookOpen, Search, Loader2, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categoryColors: Record<string, string> = {
  cuerpo: "bg-emerald-500/15 text-emerald-400",
  mente: "bg-blue-500/15 text-blue-400",
  alma: "bg-purple-500/15 text-purple-400",
  finanzas: "bg-primary/15 text-primary",
};

const Cuaderno = () => {
  const navigate = useNavigate();
  const { data: notes = [], isLoading } = useAllNotes();
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  // Extract unique months for filter
  const months = useMemo(() => {
    const map = new Map<string, { name: string; number: number }>();
    notes.forEach((n) => {
      const m = n.days?.weeks?.months;
      if (m) {
        const key = `${m.number}`;
        if (!map.has(key)) map.set(key, { name: m.name, number: m.number });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.number - b.number);
  }, [notes]);

  // Filter notes
  const filtered = useMemo(() => {
    let result = notes;

    if (monthFilter !== "all") {
      result = result.filter((n) => String(n.days?.weeks?.months?.number) === monthFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.content.toLowerCase().includes(q) ||
          n.tasks?.title.toLowerCase().includes(q)
      );
    }

    return result;
  }, [notes, search, monthFilter]);

  // Group by month > week > day
  type NoteItem = (typeof notes)[number];
  const grouped = useMemo(() => {
    const monthMap = new Map<string, { label: string; weeks: Map<string, { label: string; notes: NoteItem[] }> }>();

    filtered.forEach((note) => {
      const m = note.days?.weeks?.months;
      const w = note.days?.weeks;
      const monthKey = m ? `${m.number}` : "?";
      const monthLabel = m ? `${m.name}` : "Sin contexto";
      const weekKey = w ? `${w.number}` : "?";
      const weekLabel = w ? `Semana ${w.number} — ${w.name}` : "Sin semana";

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { label: monthLabel, weeks: new Map() });
      }
      const monthEntry = monthMap.get(monthKey)!;
      if (!monthEntry.weeks.has(weekKey)) {
        monthEntry.weeks.set(weekKey, { label: weekLabel, notes: [] });
      }
      monthEntry.weeks.get(weekKey)!.notes.push(note);
    });

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, v]) => ({
        label: v.label,
        weeks: Array.from(v.weeks.entries())
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([, w]) => w),
      }));
  }, [filtered]);

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

        {/* Search + Filter */}
        <div className="flex gap-2 mt-4">
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
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center">
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {search || monthFilter !== "all"
                ? "No se encontraron notas con esos filtros"
                : "Aún no tienes notas. Completa tareas y escribe tus reflexiones."}
            </p>
          </div>
        ) : (
          grouped.map((monthGroup) => (
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
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Cuaderno;
