import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import {
  usePrograms, useMonths,
  useCreateProgram, useCreateMonth,
} from "@/hooks/useAdmin";
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import { Loader2, Plus, ChevronRight, Trash2, Megaphone, BookOpen, Save } from "lucide-react";
import { toast } from "sonner";
import Logo from "@/components/Logo";

const Admin = () => {
  const navigate = useNavigate();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "announcements">("content");

  // Forms
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [showMonthForm, setShowMonthForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  const { data: programs = [], isLoading: progLoading } = usePrograms();
  const { data: months = [] } = useMonths(selectedProgram);
  const { data: announcements = [] } = useAnnouncements();

  const createProgram = useCreateProgram();
  const createMonth = useCreateMonth();
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  // Program form state
  const [pName, setPName] = useState("");
  const [pYear, setPYear] = useState(new Date().getFullYear());
  const [pStart, setPStart] = useState("");
  const [pEnd, setPEnd] = useState("");

  // Month form state
  const [mName, setMName] = useState("");
  const [mNumber, setMNumber] = useState(1);
  const [mTheme, setMTheme] = useState("");

  // Announcement form state
  const [aTitle, setATitle] = useState("");
  const [aBody, setABody] = useState("");
  const [aPinned, setAPinned] = useState(false);

  const handleCreateProgram = async () => {
    try {
      await createProgram.mutateAsync({ name: pName, year: pYear, start_date: pStart, end_date: pEnd });
      toast.success("Programa creado");
      setShowProgramForm(false);
      setPName(""); setPStart(""); setPEnd("");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCreateMonth = async () => {
    if (!selectedProgram) return;
    try {
      await createMonth.mutateAsync({ name: mName, number: mNumber, program_id: selectedProgram, theme: mTheme || undefined });
      toast.success("Mes creado");
      setShowMonthForm(false);
      setMName(""); setMTheme("");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCreateAnnouncement = async () => {
    try {
      await createAnnouncement.mutateAsync({ title: aTitle, body: aBody, pinned: aPinned });
      toast.success("Comunicado creado");
      setShowAnnouncementForm(false);
      setATitle(""); setABody(""); setAPinned(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const inputClass = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <Logo variant="compact" className="mb-3" />
        <h1 className="text-3xl font-display font-bold text-foreground">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión de programas, meses y comunicados</p>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab("content")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "content" ? "gold-gradient text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            Contenido
          </button>
          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "announcements" ? "gold-gradient text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            Comunicados
          </button>
        </div>
      </header>

      <main className="px-5 space-y-6">
        {activeTab === "content" && (
          <>
            {/* Programs */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-display font-bold text-foreground">Programas</h2>
                <button onClick={() => setShowProgramForm(!showProgramForm)} className="text-primary text-sm font-semibold flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Nuevo
                </button>
              </div>

              {showProgramForm && (
                <div className="glass-card rounded-xl p-4 space-y-3 mb-3">
                  <input placeholder="Nombre del programa" value={pName} onChange={(e) => setPName(e.target.value)} className={inputClass} />
                  <input type="number" placeholder="Año" value={pYear} onChange={(e) => setPYear(Number(e.target.value))} className={inputClass} />
                  <div className="flex gap-2">
                    <input type="date" value={pStart} onChange={(e) => setPStart(e.target.value)} className={inputClass} />
                    <input type="date" value={pEnd} onChange={(e) => setPEnd(e.target.value)} className={inputClass} />
                  </div>
                  <button onClick={handleCreateProgram} disabled={createProgram.isPending} className="w-full py-2 rounded-lg gold-gradient font-bold text-primary-foreground text-sm">
                    {createProgram.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Crear Programa"}
                  </button>
                </div>
              )}

              {progLoading ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : (
                <div className="space-y-2">
                  {programs.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedProgram(p.id); setSelectedMonth(null); }}
                      className={`w-full glass-card rounded-xl p-3 flex items-center justify-between text-left ${selectedProgram === p.id ? "gold-border" : ""}`}
                    >
                      <div>
                        <span className="text-sm font-semibold text-foreground">{p.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{p.year}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Months */}
            {selectedProgram && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-display font-bold text-foreground">Meses</h2>
                  <button onClick={() => setShowMonthForm(!showMonthForm)} className="text-primary text-sm font-semibold flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Nuevo
                  </button>
                </div>

                {showMonthForm && (
                  <div className="glass-card rounded-xl p-4 space-y-3 mb-3">
                    <input placeholder="Nombre (ej: Febrero)" value={mName} onChange={(e) => setMName(e.target.value)} className={inputClass} />
                    <input type="number" placeholder="Número del mes" value={mNumber} onChange={(e) => setMNumber(Number(e.target.value))} className={inputClass} />
                    <input placeholder="Tema (opcional)" value={mTheme} onChange={(e) => setMTheme(e.target.value)} className={inputClass} />
                    <button onClick={handleCreateMonth} disabled={createMonth.isPending} className="w-full py-2 rounded-lg gold-gradient font-bold text-primary-foreground text-sm">
                      {createMonth.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Crear Mes"}
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {months.map((m) => (
                    <div key={m.id} className="glass-card rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedMonth(selectedMonth === m.id ? null : m.id)}
                          className="flex-1 text-left"
                        >
                          <div>
                            <span className="text-sm font-semibold text-foreground">{m.name}</span>
                            {m.theme && <span className="text-xs text-muted-foreground ml-2">{m.theme}</span>}
                          </div>
                        </button>
                        <button
                          onClick={() => navigate(`/admin/months/${m.id}/days`)}
                          className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Editar días
                        </button>
                      </div>

                      {selectedMonth === m.id && (
                        <MonthMacroEditor month={m} />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === "announcements" && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-display font-bold text-foreground">Comunicados</h2>
              <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)} className="text-primary text-sm font-semibold flex items-center gap-1">
                <Plus className="w-4 h-4" /> Nuevo
              </button>
            </div>

            {showAnnouncementForm && (
              <div className="glass-card rounded-xl p-4 space-y-3 mb-3">
                <input placeholder="Título del comunicado" value={aTitle} onChange={(e) => setATitle(e.target.value)} className={inputClass} />
                <textarea placeholder="Contenido" value={aBody} onChange={(e) => setABody(e.target.value)} rows={3} className={inputClass} />
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={aPinned} onChange={(e) => setAPinned(e.target.checked)} className="rounded" />
                  Fijar en la parte superior (pinned)
                </label>
                <button onClick={handleCreateAnnouncement} disabled={createAnnouncement.isPending} className="w-full py-2 rounded-lg gold-gradient font-bold text-primary-foreground text-sm">
                  {createAnnouncement.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Publicar Comunicado"}
                </button>
              </div>
            )}

            <div className="space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className="glass-card rounded-xl p-4 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {a.pinned && <Megaphone className="w-3.5 h-3.5 text-primary shrink-0" />}
                      <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await deleteAnnouncement.mutateAsync(a.id);
                        toast.success("Comunicado eliminado");
                      } catch (err: any) {
                        toast.error(err.message);
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive p-2 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="glass-card rounded-xl p-6 text-center">
                  <p className="text-sm text-muted-foreground">No hay comunicados aún.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

/* ── Month Macro Editor ─────────────────────────── */

interface MonthData {
  id: string;
  name: string;
  theme?: string | null;
  macro_text?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
}

const MonthMacroEditor = ({ month }: { month: MonthData }) => {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState(month.theme ?? "");
  const [macroText, setMacroText] = useState((month as any).macro_text ?? "");
  const [audioUrl, setAudioUrl] = useState((month as any).audio_url ?? "");
  const [videoUrl, setVideoUrl] = useState((month as any).video_url ?? "");

  useEffect(() => {
    setTheme(month.theme ?? "");
    setMacroText((month as any).macro_text ?? "");
    setAudioUrl((month as any).audio_url ?? "");
    setVideoUrl((month as any).video_url ?? "");
  }, [month.id]);

  const saveMacro = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("months")
        .update({
          theme: theme || null,
          macro_text: macroText || null,
          audio_url: audioUrl || null,
          video_url: videoUrl || null,
        } as any)
        .eq("id", month.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Macro del mes actualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-months"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-month-id"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inputClass = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Macro del Mes</p>
      <div>
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">Tema</label>
        <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ej: Encontrando mi propósito" className={inputClass} />
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">Texto del Macro</label>
        <textarea value={macroText} onChange={(e) => setMacroText(e.target.value)} placeholder="Explicación del macro del mes..." rows={3} className={inputClass} />
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">URL Audio</label>
        <input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://..." className={inputClass} />
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">URL Video</label>
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." className={inputClass} />
      </div>
      <button
        onClick={() => saveMacro.mutate()}
        disabled={saveMacro.isPending}
        className="w-full py-2 rounded-lg gold-gradient font-bold text-primary-foreground text-sm flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {saveMacro.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar Macro
      </button>
    </div>
  );
};

export default Admin;
