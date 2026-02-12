import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import FileUpload from "@/components/FileUpload";
import {
  usePrograms, useMonths, useWeeks,
  useCreateProgram, useCreateMonth, useCreateWeekWithDays,
} from "@/hooks/useAdmin";
import { Loader2, Plus, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Forms
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [showMonthForm, setShowMonthForm] = useState(false);
  const [showWeekForm, setShowWeekForm] = useState(false);

  const { data: programs = [], isLoading: progLoading } = usePrograms();
  const { data: months = [] } = useMonths(selectedProgram);
  const { data: weeks = [] } = useWeeks(selectedMonth);

  const createProgram = useCreateProgram();
  const createMonth = useCreateMonth();
  const createWeek = useCreateWeekWithDays();

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
      });
      toast.success("Reto creado con 7 días y 35 tareas");
      setShowWeekForm(false);
      setWName(""); setWObjective(""); setWStartDate("");
      setWCover(""); setWAudio(""); setWScheduleImg(""); setWSchedulePdf("");
    } catch (e: any) { toast.error(e.message); }
  };

  const inputClass = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión de programas, meses y retos</p>
      </header>

      <main className="px-5 space-y-6">
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
                <div key={w.id} className="glass-card rounded-xl p-3">
                  <span className="text-sm font-semibold text-foreground">{w.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">Semana {w.number}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Admin;
