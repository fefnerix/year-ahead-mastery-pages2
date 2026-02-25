import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import FileUpload from "@/components/FileUpload";
import {
  usePrograms, useMonths, useWeeks,
  useCreateProgram, useCreateMonth, useCreateWeekWithDays,
  useUpdateWeekAsset, useAdjustWeekDates, useActivateWeek,
} from "@/hooks/useAdmin";
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import { Loader2, Plus, ChevronRight, Trash2, Megaphone, Wrench, Calendar, Zap, ChevronDown, BookOpen } from "lucide-react";
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
  const [showWeekForm, setShowWeekForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  const { data: programs = [], isLoading: progLoading } = usePrograms();
  const { data: months = [] } = useMonths(selectedProgram);
  const { data: weeks = [] } = useWeeks(selectedMonth);
  const { data: announcements = [] } = useAnnouncements();

  const createProgram = useCreateProgram();
  const createMonth = useCreateMonth();
  const createWeek = useCreateWeekWithDays();
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const updateAsset = useUpdateWeekAsset();
  const adjustDates = useAdjustWeekDates();
  const activateWeek = useActivateWeek();

  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  // Program form state
  const [pName, setPName] = useState("");
  const [pYear, setPYear] = useState(new Date().getFullYear());
  const [pStart, setPStart] = useState("");
  const [pEnd, setPEnd] = useState("");

  // Month form state
  const [mName, setMName] = useState("");
  const [mNumber, setMNumber] = useState(1);
  const [mTheme, setMTheme] = useState("");

  // Week form state
  const [wName, setWName] = useState("");
  const [wNumber, setWNumber] = useState(1);
  const [wObjective, setWObjective] = useState("");
  const [wStartDate, setWStartDate] = useState("");
  const [wCover, setWCover] = useState("");
  const [wAudio, setWAudio] = useState("");
  const [wScheduleImg, setWScheduleImg] = useState("");
  const [wSchedulePdf, setWSchedulePdf] = useState("");
  const [wDescLong, setWDescLong] = useState("");
  const [wSpiritualPlaylist, setWSpiritualPlaylist] = useState("");
  const [wMentalPlaylist, setWMentalPlaylist] = useState("");

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

  const handleCreateWeek = async () => {
    if (!selectedMonth) return;
    try {
      await createWeek.mutateAsync({
        name: wName, number: wNumber, month_id: selectedMonth, objective: wObjective || undefined,
        start_date: wStartDate,
        cover_url: wCover || undefined, audio_url: wAudio || undefined,
        schedule_image_url: wScheduleImg || undefined, schedule_pdf_url: wSchedulePdf || undefined,
        description_long: wDescLong || undefined,
        spiritual_playlist_url: wSpiritualPlaylist || undefined,
        mental_playlist_url: wMentalPlaylist || undefined,
      });
      toast.success("Reto creado con 7 días y 35 tareas");
      setShowWeekForm(false);
      setWName(""); setWObjective(""); setWStartDate("");
      setWCover(""); setWAudio(""); setWScheduleImg(""); setWSchedulePdf("");
      setWDescLong(""); setWSpiritualPlaylist(""); setWMentalPlaylist("");
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
        <p className="text-sm text-muted-foreground mt-1">Gestión de programas, meses, retos y comunicados</p>

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
                    <button
                      key={m.id}
                      onClick={() => setSelectedMonth(m.id)}
                      className={`w-full glass-card rounded-xl p-3 flex items-center justify-between text-left ${selectedMonth === m.id ? "gold-border" : ""}`}
                    >
                      <div>
                        <span className="text-sm font-semibold text-foreground">{m.name}</span>
                        {m.theme && <span className="text-xs text-muted-foreground ml-2">{m.theme}</span>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Weeks/Retos */}
            {selectedMonth && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-display font-bold text-foreground">Retos / Semanas</h2>
                  <button onClick={() => setShowWeekForm(!showWeekForm)} className="text-primary text-sm font-semibold flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Nuevo
                  </button>
                </div>

                {showWeekForm && (
                  <div className="glass-card rounded-xl p-4 space-y-3 mb-3">
                    <input placeholder="Nombre del reto" value={wName} onChange={(e) => setWName(e.target.value)} className={inputClass} />
                    <input type="number" placeholder="Número de semana" value={wNumber} onChange={(e) => setWNumber(Number(e.target.value))} className={inputClass} />
                    <input placeholder="Objetivo (opcional)" value={wObjective} onChange={(e) => setWObjective(e.target.value)} className={inputClass} />
                    <input type="date" placeholder="Fecha inicio (lunes)" value={wStartDate} onChange={(e) => setWStartDate(e.target.value)} className={inputClass} />
                    <textarea placeholder="Descripción extendida del reto" value={wDescLong} onChange={(e) => setWDescLong(e.target.value)} rows={3} className={inputClass} />
                    <input placeholder="URL playlist espiritual (Spotify)" value={wSpiritualPlaylist} onChange={(e) => setWSpiritualPlaylist(e.target.value)} className={inputClass} />
                    <input placeholder="URL playlist mental (Spotify)" value={wMentalPlaylist} onChange={(e) => setWMentalPlaylist(e.target.value)} className={inputClass} />
                    <FileUpload bucket="covers" accept="image/*" label="Subir capa" onUploaded={setWCover} />
                    <FileUpload bucket="audios" accept="audio/*" label="Subir audio" onUploaded={setWAudio} />
                    <FileUpload bucket="schedules" accept="image/*" label="Subir cronograma (imagen)" onUploaded={setWScheduleImg} />
                    <FileUpload bucket="pdfs" accept=".pdf" label="Subir cronograma (PDF)" onUploaded={setWSchedulePdf} />
                    <button onClick={handleCreateWeek} disabled={createWeek.isPending} className="w-full py-2 rounded-lg gold-gradient font-bold text-primary-foreground text-sm">
                      {createWeek.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Crear Reto (+ 7 días + 35 tareas)"}
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {weeks.map((w) => (
                    <div key={w.id} className="glass-card rounded-xl p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{w.name}</span>
                          <span className="text-xs text-muted-foreground">Semana {w.number}</span>
                          {w.status === "active" && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary">Activa</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/admin/retos/${w.id}/tareas`)}
                            className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/retos/${w.id}/builder`)}
                            className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setExpandedWeek(expandedWeek === w.id ? null : w.id)}
                            className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedWeek === w.id ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                      </div>

                      {expandedWeek === w.id && (
                        <div className="space-y-3 pt-2 border-t border-border">
                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  await activateWeek.mutateAsync(w.id);
                                  toast.success("Semana activada");
                                } catch (e: any) { toast.error(e.message); }
                              }}
                              disabled={activateWeek.isPending || w.status === "active"}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold disabled:opacity-40"
                            >
                              <Zap className="w-3.5 h-3.5" /> {w.status === "active" ? "Activa" : "Activar"}
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await adjustDates.mutateAsync(w.id);
                                  toast.success("Fechas ajustadas a esta semana");
                                } catch (e: any) { toast.error(e.message); }
                              }}
                              disabled={adjustDates.isPending}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-foreground text-xs font-semibold"
                            >
                              <Calendar className="w-3.5 h-3.5" /> Ajustar fechas
                            </button>
                          </div>

                          {/* Asset uploads */}
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assets</p>
                          <div className="grid grid-cols-2 gap-2">
                            <FileUpload
                              bucket="covers"
                              accept="image/*"
                              label="Banner/Cover"
                              onUploaded={async (url) => {
                                try {
                                  await updateAsset.mutateAsync({ weekId: w.id, field: "cover_url", value: url });
                                  toast.success("Cover actualizado");
                                } catch (e: any) { toast.error(e.message); }
                              }}
                            />
                            <FileUpload
                              bucket="audios"
                              accept="audio/*"
                              label="Audio apertura"
                              onUploaded={async (url) => {
                                try {
                                  await updateAsset.mutateAsync({ weekId: w.id, field: "audio_url", value: url });
                                  toast.success("Audio actualizado");
                                } catch (e: any) { toast.error(e.message); }
                              }}
                            />
                            <FileUpload
                              bucket="schedules"
                              accept="image/*"
                              label="Cronograma img"
                              onUploaded={async (url) => {
                                try {
                                  await updateAsset.mutateAsync({ weekId: w.id, field: "schedule_image_url", value: url });
                                  toast.success("Cronograma imagen actualizado");
                                } catch (e: any) { toast.error(e.message); }
                              }}
                            />
                            <FileUpload
                              bucket="pdfs"
                              accept=".pdf"
                              label="Cronograma PDF"
                              onUploaded={async (url) => {
                                try {
                                  await updateAsset.mutateAsync({ weekId: w.id, field: "schedule_pdf_url", value: url });
                                  toast.success("PDF actualizado");
                                } catch (e: any) { toast.error(e.message); }
                              }}
                            />
                          </div>

                          {/* Current assets status */}
                          <div className="text-[10px] text-muted-foreground/60 space-y-0.5">
                            <p>Cover: {w.cover_url ? "✅" : "❌"} | Audio: {w.audio_url ? "✅" : "❌"}</p>
                            <p>Cronograma: {w.schedule_image_url ? "✅" : "❌"} | PDF: {w.schedule_pdf_url ? "✅" : "❌"}</p>
                          </div>
                        </div>
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

export default Admin;
