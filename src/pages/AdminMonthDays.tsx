import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import FileUpload from "@/components/FileUpload";
import AudioRecorder from "@/components/AudioRecorder";
import { ArrowLeft, Loader2, BookOpen, Target, Save, Trash2, Check, Minus, Circle, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { isYouTubeUrl, getMediaWarning } from "@/lib/media-utils";
import { deleteStorageFile } from "@/lib/storage-utils";

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
  const queryClient = useQueryClient();
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [creatingDay, setCreatingDay] = useState(false);

  // Fetch month info + program year
  const { data: monthInfo } = useQuery({
    queryKey: ["admin-month-info", monthId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("months")
        .select("name, theme, number, program_id, programs(year, start_date)")
        .eq("id", monthId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!monthId,
  });

  // Fetch weeks for this month (needed to create days)
  const { data: weeks = [] } = useQuery({
    queryKey: ["admin-month-weeks", monthId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weeks")
        .select("id, number")
        .eq("month_id", monthId!)
        .order("number");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!monthId,
  });

  // Fetch days for this month (via weeks join)
  const { data: days = [], isLoading: daysLoading } = useQuery({
    queryKey: ["admin-month-days", monthId],
    queryFn: async () => {
      if (weeks.length === 0) return [];
      const weekIds = weeks.map((w) => w.id);
      const { data, error } = await supabase
        .from("days")
        .select("id, number, date")
        .in("week_id", weekIds)
        .order("date");
      if (error) throw error;
      return data as DayRow[];
    },
    enabled: weeks.length > 0,
  });

  // Fetch task counts per day (bulk)
  const { data: taskCounts = {} } = useQuery({
    queryKey: ["admin-day-task-counts", monthId, days.map((d) => d.id).join(",")],
    queryFn: async () => {
      if (days.length === 0) return {};
      const dayIds = days.map((d) => d.id);
      const { data, error } = await supabase
        .from("tasks")
        .select("day_id")
        .in("day_id", dayIds)
        .eq("is_active", true);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((t) => {
        counts[t.day_id] = (counts[t.day_id] || 0) + 1;
      });
      return counts;
    },
    enabled: days.length > 0,
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

  // Build calendar grid — shows ALL days of the calendar month, not just DB days
  const calendarGrid = useMemo(() => {
    if (!monthInfo) return null;

    const monthNumber = monthInfo.number; // 1-based month number
    const programYear = monthInfo.programs?.year || new Date().getFullYear();

    // Determine the actual calendar month/year
    // Program cycle: month 3..12 = Mar..Dec of programYear, month 1..2 = Jan..Feb of programYear+1
    let calendarMonth: number; // 0-based for Date constructor
    let calendarYear: number;

    if (days.length > 0) {
      // Use the first day's date to determine the calendar month
      const parts = days[0].date.split("-");
      calendarYear = parseInt(parts[0]);
      calendarMonth = parseInt(parts[1]) - 1; // 0-based
    } else {
      // Fallback: derive from month number
      calendarMonth = monthNumber - 1; // 0-based
      calendarYear = monthNumber >= 3 ? programYear : programYear + 1;
    }

    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0=Sun
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon=0 based

    // Map day-of-month to DayRow
    const dayByDate = new Map<number, DayRow>();
    days.forEach((d) => {
      const parts = d.date.split("-");
      const dom = parseInt(parts[2]);
      dayByDate.set(dom, d);
    });

    const cells: Array<{ dayOfMonth: number | null; dayRow: DayRow | null }> = [];

    // Leading blanks
    for (let i = 0; i < startOffset; i++) {
      cells.push({ dayOfMonth: null, dayRow: null });
    }

    // ALL days of the month — admin can click any of them
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ dayOfMonth: d, dayRow: dayByDate.get(d) || null });
    }

    return { cells, calendarYear, calendarMonth, daysInMonth };
  }, [monthInfo, days]);

  const getDayStatus = (dayRow: DayRow | null): "complete" | "partial" | "empty" | "none" => {
    if (!dayRow) return "none";
    const count = taskCounts[dayRow.id] || 0;
    if (count >= 2) return "complete";
    if (count === 1) return "partial";
    return "empty";
  };

  // Upsert a day + 2 empty tasks when admin clicks a day that doesn't exist yet
  const ensureDayExists = async (dayOfMonth: number): Promise<string> => {
    if (!calendarGrid || !monthInfo) throw new Error("No month info");

    const { calendarYear, calendarMonth } = calendarGrid;
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`;

    // Need a week to attach the day to — use first week, or create one
    let weekId = weeks[0]?.id;
    if (!weekId) {
      const { data: newWeek, error: wErr } = await supabase
        .from("weeks")
        .insert({ month_id: monthId!, number: 1, name: `Semana 1`, status: "published" })
        .select("id")
        .single();
      if (wErr) throw wErr;
      weekId = newWeek.id;
      queryClient.invalidateQueries({ queryKey: ["admin-month-weeks", monthId] });
    }

    // Insert the day
    const { data: newDay, error: dErr } = await supabase
      .from("days")
      .insert({ week_id: weekId, number: dayOfMonth, date: dateStr, unlock_date: dateStr })
      .select("id")
      .single();
    if (dErr) throw dErr;

    // Create 2 empty draft tasks
    await supabase.from("tasks").insert([
      { day_id: newDay.id, title: "Oración del día", task_kind: "prayer", category: "alma" as const, order: 0, is_active: true },
      { day_id: newDay.id, title: "Actividad del día", task_kind: "activity", category: "cuerpo" as const, order: 1, is_active: true },
    ]);

    queryClient.invalidateQueries({ queryKey: ["admin-month-days", monthId] });
    queryClient.invalidateQueries({ queryKey: ["admin-day-task-counts"] });

    return newDay.id;
  };

  const handleDayClick = async (cell: { dayOfMonth: number | null; dayRow: DayRow | null }) => {
    if (cell.dayOfMonth === null) return;

    if (cell.dayRow) {
      setSelectedDayId(cell.dayRow.id);
      return;
    }

    // Day doesn't exist in DB — create it
    setCreatingDay(true);
    try {
      const dayId = await ensureDayExists(cell.dayOfMonth);
      setSelectedDayId(dayId);
      toast.success(`Día ${cell.dayOfMonth} creado`);
    } catch (err: any) {
      toast.error(`Error creando día: ${err.message}`);
    } finally {
      setCreatingDay(false);
    }
  };

  const weekdayHeaders = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

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
        {/* Calendar grid */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Seleccionar día</p>
          {daysLoading && weeks.length > 0 ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : !calendarGrid ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <div className="glass-card rounded-xl p-3 border border-primary/10">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekdayHeaders.map((d) => (
                  <div key={d} className="text-center text-[9px] font-bold text-muted-foreground uppercase tracking-wider py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells — ALL days clickable for admin */}
              <div className="grid grid-cols-7 gap-1">
                {calendarGrid.cells.map((cell, i) => {
                  if (cell.dayOfMonth === null) {
                    return <div key={`blank-${i}`} className="aspect-square" />;
                  }

                  const status = getDayStatus(cell.dayRow);
                  const isSelected = cell.dayRow?.id === selectedDayId;
                  const hasRecord = !!cell.dayRow;

                  return (
                    <button
                      key={cell.dayOfMonth}
                      onClick={() => handleDayClick(cell)}
                      disabled={creatingDay}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-sm font-semibold transition-all ${
                        isSelected
                          ? "gold-gradient text-primary-foreground ring-2 ring-primary/30"
                          : hasRecord
                          ? "hover:bg-primary/10 text-foreground"
                          : "hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <span className="text-xs">{cell.dayOfMonth}</span>
                      {hasRecord && (
                        <span className="text-[8px]">
                          {status === "complete" && <Check className="w-2.5 h-2.5 text-emerald-400 inline" />}
                          {status === "partial" && <Circle className="w-2 h-2 text-primary inline fill-primary" />}
                          {status === "empty" && <Minus className="w-2.5 h-2.5 text-muted-foreground/40 inline" />}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {creatingDay && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Creando día...
                </div>
              )}
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
      if (mediaVideo && !isYouTubeUrl(mediaVideo)) throw new Error("Solo se aceptan URLs de YouTube para video.");

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
      queryClient.invalidateQueries({ queryKey: ["admin-day-task-counts"] });
      queryClient.invalidateQueries({ queryKey: ["day-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["month_calendar"] });
      queryClient.invalidateQueries({ queryKey: ["year_calendar"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const videoWarning = mediaVideo && !isYouTubeUrl(mediaVideo) ? "Solo se aceptan URLs de YouTube" : null;

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

      {/* 1. Título */}
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

      {/* Media: Imagen → Video → Audio */}
      <div className="space-y-3 pt-2 border-t border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Media (opcional)</p>

        {/* 2. Imagen — upload only */}
        <div>
          <label className="text-[10px] text-muted-foreground font-semibold uppercase">Imagen</label>
          <div className="space-y-1.5">
            {mediaImage ? (
              <>
                <img src={mediaImage} alt="Preview" className="w-full max-h-24 object-cover rounded-lg" />
                <div className="flex gap-2">
                  <FileUpload bucket="task_media" accept="image/*" label="Cambiar imagen" onUploaded={setMediaImage} />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm("¿Eliminar imagen? Esta acción no se puede deshacer.")) return;
                      await deleteStorageFile("task_media", mediaImage);
                      setMediaImage("");
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
                </div>
              </>
            ) : (
              <FileUpload bucket="task_media" accept="image/*" label="Subir foto" onUploaded={setMediaImage} />
            )}
          </div>
        </div>

        {/* 3. Video — YouTube URL only */}
        <div>
          <label className="text-[10px] text-muted-foreground font-semibold uppercase">Video (YouTube)</label>
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <input value={mediaVideo} onChange={(e) => setMediaVideo(e.target.value)} placeholder="URL del video (YouTube)" className={`${inputClass} flex-1`} />
              {mediaVideo && (
                <button type="button" onClick={() => setMediaVideo("")} className="shrink-0 p-2 text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {videoWarning && (
              <div className="flex items-start gap-1.5 text-[10px] text-destructive bg-destructive/10 rounded-lg px-2.5 py-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{videoWarning}</span>
              </div>
            )}
            {mediaVideo && isYouTubeUrl(mediaVideo) && (
              <p className="text-[10px] text-muted-foreground">✓ YouTube URL válida</p>
            )}
          </div>
        </div>

        {/* 4. Audio — record or upload */}
        <div>
          <label className="text-[10px] text-muted-foreground font-semibold uppercase">Audio</label>
          <AudioRecorder
            bucket="task_media"
            pathPrefix={`days/${dayId}/${kind}/audio`}
            currentUrl={mediaAudio || undefined}
            onUploaded={setMediaAudio}
            onRemoved={async () => {
              await deleteStorageFile("task_media", mediaAudio);
              setMediaAudio("");
            }}
          />
        </div>
      </div>

      {/* 5. Explicación (texto) — after media */}
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
      const ids = tasks.map((t) => t.id);
      const { error } = await supabase
        .from("tasks")
        .update({ is_active: false })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tareas antiguas desactivadas");
      queryClient.invalidateQueries({ queryKey: ["admin-day-tasks", dayId] });
      queryClient.invalidateQueries({ queryKey: ["admin-day-task-counts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <button
      onClick={() => {
        if (window.confirm("¿Desactivar todas las tareas antiguas?")) {
          deactivate.mutate();
        }
      }}
      disabled={deactivate.isPending}
      className="text-[10px] font-semibold text-destructive hover:text-destructive/80 flex items-center gap-1"
    >
      {deactivate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
      Desactivar
    </button>
  );
};

export default AdminMonthDays;
