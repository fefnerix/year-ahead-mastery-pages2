import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminMonthTasks, useUpsertMonthTask, useSeedMonthTasks } from "@/hooks/useMonthTasks";
import type { MonthTask } from "@/hooks/useMonthTasks";
import FileUpload from "@/components/FileUpload";
import AudioRecorder from "@/components/AudioRecorder";
import { deleteStorageFile } from "@/lib/storage-utils";
import { isYouTubeUrl } from "@/lib/media-utils";
import BottomNav from "@/components/BottomNav";
import {
  ArrowLeft, Loader2, Save, Plus, ChevronDown, ChevronUp,
  Trash2, X, Check, AlertTriangle, Eye, EyeOff, ListChecks, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const inputClass = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

const AdminMonthChecklist = () => {
  const { monthId } = useParams<{ monthId: string }>();
  const navigate = useNavigate();

  const { data: monthInfo } = useQuery({
    queryKey: ["admin-month-info", monthId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("months")
        .select("name, theme, number, year")
        .eq("id", monthId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!monthId,
  });

  const { data: tasks = [], isLoading } = useAdminMonthTasks(monthId);
  const seedTasks = useSeedMonthTasks();

  // Auto-seed on first load if empty
  useEffect(() => {
    if (!isLoading && tasks.length === 0 && monthId && !seedTasks.isPending) {
      seedTasks.mutate(monthId);
    }
  }, [isLoading, tasks.length, monthId]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleSeed = () => {
    if (!monthId) return;
    if (!window.confirm("¿Restaurar las 17 tareas por defecto? Las tareas existentes no se eliminarán.")) return;
    seedTasks.mutate(monthId, { onSuccess: () => toast.success("Plantilla restaurada") });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <button onClick={() => navigate("/admin")} className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a Admin
        </button>
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Checklist del Mes</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Mes: {monthInfo ? `${monthInfo.theme || monthInfo.name} ${monthInfo.year ?? ""}` : "Cargando..."}
        </p>
      </header>

      <main className="px-5 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-primary text-sm font-semibold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Nueva tarea
          </button>
          <button
            onClick={handleSeed}
            disabled={seedTasks.isPending}
            className="text-muted-foreground text-sm font-semibold flex items-center gap-1 ml-auto"
          >
            {seedTasks.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Restaurar plantilla
          </button>
        </div>

        {showCreate && monthId && (
          <MonthTaskEditor
            monthId={monthId}
            onSaved={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
            nextOrder={(tasks.length > 0 ? Math.max(...tasks.map((t) => t.sort_order)) : 0) + 1}
          />
        )}

        {isLoading ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto my-8" />
        ) : tasks.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground">Sin tareas. Se crearán automáticamente.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="glass-card rounded-xl border border-border/30 overflow-hidden">
              <button
                onClick={() => setEditingId(editingId === task.id ? null : task.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs font-mono text-muted-foreground w-6 shrink-0 text-right">
                    {task.sort_order}
                  </span>
                  <span className={`text-sm font-semibold truncate ${!task.is_active ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {task.title}
                  </span>
                  {!task.is_active && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">Inactiva</span>
                  )}
                </div>
                {editingId === task.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>

              {editingId === task.id && monthId && (
                <div className="px-4 pb-4 border-t border-border/30 pt-3">
                  <MonthTaskEditor
                    monthId={monthId}
                    task={task}
                    onSaved={() => setEditingId(null)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
};

/* ── Editor ── */

interface EditorProps {
  monthId: string;
  task?: MonthTask;
  onSaved: () => void;
  onCancel: () => void;
  nextOrder?: number;
}

const MonthTaskEditor = ({ monthId, task, onSaved, onCancel, nextOrder }: EditorProps) => {
  const upsert = useUpsertMonthTask();

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [sortOrder, setSortOrder] = useState(task?.sort_order ?? nextOrder ?? 1);
  const [isActive, setIsActive] = useState(task?.is_active ?? true);
  const [imageUrl, setImageUrl] = useState(task?.image_url ?? "");
  const [audioUrl, setAudioUrl] = useState(task?.audio_url ?? "");
  const [videoUrl, setVideoUrl] = useState(task?.video_url ?? "");
  const [fileUrl, setFileUrl] = useState(task?.file_url ?? "");

  const videoWarning = videoUrl && !isYouTubeUrl(videoUrl) ? "Solo se aceptan URLs de YouTube" : null;

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    try {
      await upsert.mutateAsync({
        ...(task?.id ? { id: task.id } : {}),
        month_id: monthId,
        title: title.trim(),
        description: description.trim() || null,
        sort_order: sortOrder,
        is_active: isActive,
        image_url: imageUrl || null,
        audio_url: audioUrl || null,
        video_url: videoUrl || null,
        file_url: fileUrl || null,
      });
      toast.success(task ? "Tarea actualizada" : "Tarea creada");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">Título</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la tarea" className={inputClass} />
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">Descripción</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)" rows={2} className={inputClass} />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground font-semibold uppercase">Orden</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={inputClass} />
        </div>
        <div className="flex items-end pb-1">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              isActive ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
            }`}
          >
            {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {isActive ? "Activa" : "Inactiva"}
          </button>
        </div>
      </div>

      {/* Image */}
      <div>
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">Imagen</label>
        {imageUrl ? (
          <div className="space-y-2">
            <img src={imageUrl} alt="" className="w-full max-h-28 object-cover rounded-lg" />
            <div className="flex gap-2">
              <FileUpload bucket="task_media" accept="image/*" label="Cambiar imagen" onUploaded={setImageUrl} />
              <button onClick={async () => { await deleteStorageFile("task_media", imageUrl); setImageUrl(""); }} className="flex items-center gap-1 text-[11px] font-semibold text-destructive hover:text-destructive/80">
                <Trash2 className="w-3 h-3" /> Eliminar
              </button>
            </div>
          </div>
        ) : (
          <FileUpload bucket="task_media" accept="image/*" label="Subir imagen" onUploaded={setImageUrl} />
        )}
      </div>

      {/* Video */}
      <div>
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">Video (YouTube)</label>
        <div className="flex gap-1.5">
          <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="URL de YouTube" className={`${inputClass} flex-1`} />
          {videoUrl && (
            <button onClick={() => setVideoUrl("")} className="shrink-0 p-2 text-muted-foreground hover:text-destructive">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {videoWarning && (
          <div className="flex items-start gap-1.5 text-[10px] text-destructive bg-destructive/10 rounded-lg px-2.5 py-1.5 mt-1">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /><span>{videoWarning}</span>
          </div>
        )}
        {videoUrl && isYouTubeUrl(videoUrl) && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1"><Check className="w-3 h-3 text-success" /> URL válida</p>
        )}
      </div>

      {/* Audio */}
      <div>
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">Audio</label>
        <AudioRecorder
          bucket="task_media"
          pathPrefix={`month-tasks/${monthId}/audio`}
          currentUrl={audioUrl || undefined}
          onUploaded={setAudioUrl}
          onRemoved={async () => { await deleteStorageFile("task_media", audioUrl); setAudioUrl(""); }}
        />
      </div>

      {/* File/PDF */}
      <div>
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">Archivo (PDF)</label>
        {fileUrl ? (
          <div className="flex items-center gap-2">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate flex-1">Ver archivo</a>
            <button onClick={async () => { await deleteStorageFile("task_media", fileUrl); setFileUrl(""); }} className="flex items-center gap-1 text-[11px] font-semibold text-destructive hover:text-destructive/80">
              <Trash2 className="w-3 h-3" /> Eliminar
            </button>
          </div>
        ) : (
          <FileUpload bucket="task_media" accept=".pdf,application/pdf" label="Subir archivo" onUploaded={setFileUrl} />
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={upsert.isPending}
          className="flex-1 py-2 rounded-lg gold-gradient font-bold text-primary-foreground text-sm flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {upsert.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-muted text-sm text-muted-foreground font-semibold">
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default AdminMonthChecklist;
