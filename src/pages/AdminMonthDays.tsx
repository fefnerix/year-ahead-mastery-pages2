import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import FileUpload from "@/components/FileUpload";
import { ArrowLeft, Loader2, BookOpen, Target, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["cuerpo", "mente", "alma", "finanzas"] as const;

interface DayRow {
  id: string;
  number: number;
  date: string;
}

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  task_kind: string;
  is_active: boolean;
  order: number;
  media_image_url: string | null;
  media_video_url: string | null;
  media_audio_url: string | null;
}

const AdminMonthDays = () => {
  const { monthId } = useParams<{ monthId: string }>();
  const navigate = useNavigate();
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  // Fetch month info
  const { data: monthInfo } = useQuery({
    queryKey: ["admin-month-info", monthId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("months")
        .select("name, theme")
        .eq("id", monthId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!monthId,
  });

  // Fetch days for this month (via weeks join)
  const { data: days = [], isLoading: daysLoading } = useQuery({
    queryKey: ["admin-month-days", monthId],
    queryFn: async () => {
      const { data: weeks, error: wErr } = await supabase
        .from("weeks")
        .select("id")
        .eq("month_id", monthId!);
      if (wErr) throw wErr;
      if (!weeks || weeks.length === 0) return [];

      const weekIds = weeks.map((w) => w.id);
      const { data, error } = await supabase
        .from("days")
        .select("id, number, date")
        .in("week_id", weekIds)
        .order("date");
      if (error) throw error;
      return data as DayRow[];
    },
    enabled: !!monthId,
  });

  // Fetch tasks for selected day
  const { data: dayTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["admin-day-tasks", selectedDayId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, category, task_kind, is_active, order, media_image_url, media_video_url, media_audio_url")
        .eq("day_id", selectedDayId!)
        .order("order");
      if (error) throw error;
      return data as TaskRow[];
    },
    enabled: !!selectedDayId,
  });

  const activePrayer = dayTasks.find((t) => t.task_kind === "prayer" && t.is_active);
  const activeActivity = dayTasks.find((t) => t.task_kind === "activity" && t.is_active);
  const legacyActiveTasks = dayTasks.filter((t) => t.is_active && t.task_kind !== "prayer" && t.task_kind !== "activity");

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <button onClick={() => navigate("/admin")} className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a Admin
        </button>
        <h1 className="text-2xl font-display font-bold text-foreground">Tareas del Día</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {monthInfo ? `Mes: ${monthInfo.theme || monthInfo.name}` : "Cargando..."}
        </p>
      </header>

      <main className="px-5 space-y-6">
        {/* Day selector */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Seleccionar día</p>
          {daysLoading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : days.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay días creados para este mes.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => {
                const dayOfMonth = new Date(d.date + "T12:00:00").getDate();
                const weekday = new Date(d.date + "T12:00:00").toLocaleDateString("es", { weekday: "short" });
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDayId(d.id)}
                    className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      selectedDayId === d.id
                        ? "gold-gradient text-primary-foreground"
                        : "glass-card text-foreground hover:border-primary/30"
                    }`}
                  >
                    <span className="text-[10px] uppercase">{weekday}</span>
                    <span className="text-lg">{dayOfMonth}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Task editors */}
        {selectedDayId && (
          <>
            {tasksLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-5">
                <TaskEditor kind="prayer" task={activePrayer ?? null} dayId={selectedDayId} />
                <TaskEditor kind="activity" task={activeActivity ?? null} dayId={selectedDayId} />

                {legacyActiveTasks.length > 0 && (
                  <section className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Tareas antiguas activas ({legacyActiveTasks.length})
                      </p>
                      <DeactivateLegacyButton dayId={selectedDayId} tasks={legacyActiveTasks} />
                    </div>
                    <div className="space-y-1">
                      {legacyActiveTasks.map((t) => (
                        <div key={t.id} className="glass-card rounded-lg p-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground flex-1 truncate">{t.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t.task_kind}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

/* ── Task Editor ─────────────────────────────── */

interface TaskEditorProps {
  kind: "prayer" | "activity";
  task: TaskRow | null;
  dayId: string;
}

const TaskEditor = ({ kind, task, dayId }: TaskEditorProps) => {
  const queryClient = useQueryClient();
  const isPrayer = kind === "prayer";
  const emoji = isPrayer ? "🙏🏼" : "🔥";
  const label = isPrayer ? "Oración del día" : "Tarea del día";
  const icon = isPrayer ? <BookOpen className="w-4 h-4 text-primary" /> : <Target className="w-4 h-4 text-primary" />;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("alma");
  const [mediaImage, setMediaImage] = useState("");
  const [mediaVideo, setMediaVideo] = useState("");
  const [mediaAudio, setMediaAudio] = useState("");

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setCategory(task?.category ?? "alma");
    setMediaImage(task?.media_image_url ?? "");
    setMediaVideo(task?.media_video_url ?? "");
    setMediaAudio(task?.media_audio_url ?? "");
  }, [task?.id, task?.title, task?.description, task?.category, task?.media_image_url, task?.media_video_url, task?.media_audio_url]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (title.trim().length < 5) throw new Error("El texto debe tener al menos 5 caracteres.");

      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        media_image_url: mediaImage || null,
        media_video_url: mediaVideo || null,
        media_audio_url: mediaAudio || null,
      };
      if (!isPrayer) payload.category = category;

      if (task) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").insert({
          ...payload,
          day_id: dayId,
          task_kind: kind,
          is_active: true,
          category: isPrayer ? "alma" : category,
          order: isPrayer ? 0 : 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`${label} guardada`);
      queryClient.invalidateQueries({ queryKey: ["admin-day-tasks", dayId] });
      queryClient.invalidateQueries({ queryKey: ["day-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["month_calendar"] });
      queryClient.invalidateQueries({ queryKey: ["year_calendar"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inputClass = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold text-foreground">{emoji} {label}</p>
        <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${task ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {task ? "Existente" : "Nueva"}
        </span>
      </div>

      <div>
        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Texto (título corto)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isPrayer ? "Ej: Oración de gratitud y abundancia" : "Ej: Camina 30 minutos al aire libre"}
          className={inputClass}
          maxLength={200}
        />
        {title.length > 0 && title.trim().length < 5 && (
          <p className="text-[10px] text-destructive mt-1">Mínimo 5 caracteres</p>
        )}
      </div>

      <div>
        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Explicación</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explicación detallada..."
          rows={3}
          className={inputClass}
          maxLength={1000}
        />
      </div>

      {!isPrayer && (
        <div>
          <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pilar</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
      )}

      {/* Media uploads */}
      <div className="space-y-2 pt-2 border-t border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Media (opcional)</p>
        <div className="grid grid-cols-1 gap-2">
          <FileUpload bucket="task_media" accept="image/*" label={mediaImage ? "Foto ✓" : "Subir foto"} onUploaded={setMediaImage} />
          <div>
            <input
              value={mediaVideo}
              onChange={(e) => setMediaVideo(e.target.value)}
              placeholder="URL del video (YouTube, etc.)"
              className={inputClass}
            />
          </div>
          <FileUpload bucket="task_media" accept="audio/*" label={mediaAudio ? "Audio ✓" : "Subir audio"} onUploaded={setMediaAudio} />
        </div>
        {(mediaImage || mediaVideo || mediaAudio) && (
          <div className="text-[10px] text-muted-foreground/60">
            Foto: {mediaImage ? "✅" : "❌"} | Video: {mediaVideo ? "✅" : "❌"} | Audio: {mediaAudio ? "✅" : "❌"}
          </div>
        )}
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending || title.trim().length < 5}
        className="w-full py-2.5 rounded-xl gold-gradient font-bold text-primary-foreground text-sm flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar cambios
      </button>
    </div>
  );
};

/* ── Deactivate Legacy Button ─────────────────── */

const DeactivateLegacyButton = ({ dayId, tasks }: { dayId: string; tasks: TaskRow[] }) => {
  const queryClient = useQueryClient();

  const deactivate = useMutation({
    mutationFn: async () => {
      for (const t of tasks) {
        const { error } = await supabase.from("tasks").update({ is_active: false } as any).eq("id", t.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Tareas antiguas desactivadas");
      queryClient.invalidateQueries({ queryKey: ["admin-day-tasks", dayId] });
      queryClient.invalidateQueries({ queryKey: ["day-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <button
      onClick={() => deactivate.mutate()}
      disabled={deactivate.isPending}
      className="text-[10px] font-semibold text-destructive flex items-center gap-1 hover:underline"
    >
      {deactivate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
      Desactivar todas
    </button>
  );
};

export default AdminMonthDays;
