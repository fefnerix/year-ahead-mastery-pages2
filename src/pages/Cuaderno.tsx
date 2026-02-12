import { useState } from "react";
import { useAllNotes } from "@/hooks/useTaskNotes";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, BookOpen, Search, Loader2 } from "lucide-react";
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

  const filtered = search
    ? notes.filter(
        (n) =>
          n.content.toLowerCase().includes(search.toLowerCase()) ||
          n.tasks?.title.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  // Group by week
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, note) => {
    const key = `Semana ${note.days?.weeks?.number ?? "?"} — ${note.days?.weeks?.name ?? ""}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(note);
    return acc;
  }, {});

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

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar en tus notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
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
              {search ? "No se encontraron notas" : "Aún no tienes notas. Completa tareas y escribe tus reflexiones."}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([weekKey, weekNotes]) => (
            <section key={weekKey}>
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">{weekKey}</h2>
              <div className="space-y-2">
                {weekNotes.map((note) => (
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
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Cuaderno;
