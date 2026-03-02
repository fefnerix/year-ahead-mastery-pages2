import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminMonthTasks, useUpsertMonthTask, useSeedMonthTasks } from "@/hooks/useMonthTasks";
import type { MonthTask } from "@/hooks/useMonthTasks";
import {
  useMonthTaskSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  type MonthTaskSubtask,
} from "@/hooks/useMonthTaskSubtasks";
import {
  useMonthTaskAssets,
  useUploadMonthTaskAsset,
  useDeleteMonthTaskAsset,
  useCreateMonthTaskAsset,
  useUpdateMonthTaskAsset,
  type MonthTaskAsset,
} from "@/hooks/useMonthTaskAssets";
import FileUpload from "@/components/FileUpload";
import AudioRecorder from "@/components/AudioRecorder";
import MarkdownEditor from "@/components/MarkdownEditor";
import { isYouTubeUrl } from "@/lib/media-utils";
import BottomNav from "@/components/BottomNav";
import {
  ArrowLeft, Loader2, Save, Plus, ChevronDown, ChevronUp,
  Trash2, X, Check, AlertTriangle, Eye, EyeOff, ListChecks, RefreshCw,
  Image, Headphones, FileText, Play, Link as LinkIcon, ArrowUp, ArrowDown, ExternalLink,
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

  useEffect(() => {
    if (!isLoading && tasks.length === 0 && monthId && !seedTasks.isPending) {
      seedTasks.mutate(monthId);
    }
  }, [isLoading, tasks.length, monthId]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleSeed = () => {
    if (!monthId) return;
    if (!window.confirm("Restaurar las 17 tareas por defecto? Las tareas existentes no se eliminaran.")) return;
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
          <button onClick={() => setShowCreate(!showCreate)} className="text-primary text-sm font-semibold flex items-center gap-1">
            <Plus className="w-4 h-4" /> Nueva tarea
          </button>
          <button onClick={handleSeed} disabled={seedTasks.isPending} className="text-muted-foreground text-sm font-semibold flex items-center gap-1 ml-auto">
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
            <p className="text-sm text-muted-foreground">Sin tareas. Se crearan automaticamente.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="glass-card rounded-xl border border-border/30 overflow-hidden">
              <button
                onClick={() => setEditingId(editingId === task.id ? null : task.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs font-mono text-muted-foreground w-6 shrink-0 text-right">{task.sort_order}</span>
                  {task.category && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      task.category === "cuerpo" ? "bg-emerald-500/15 text-emerald-400" :
                      task.category === "mente" ? "bg-blue-500/15 text-blue-400" :
                      task.category === "alma" ? "bg-purple-500/15 text-purple-400" :
                      "bg-amber-500/15 text-amber-400"
                    }`}>{task.category.slice(0, 3)}</span>
                  )}
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
                  <MonthTaskEditor monthId={monthId} task={task} onSaved={() => setEditingId(null)} onCancel={() => setEditingId(null)} />
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
  const [category, setCategory] = useState<string>(task?.category ?? "");

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("El titulo es obligatorio");
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
        category: (category || null) as any,
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
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">Titulo</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titulo de la tarea" className={inputClass} />
      </div>
      <div>
        <MarkdownEditor
          label="Descripcion"
          value={description}
          onChange={setDescription}
          placeholder="Descripcion (opcional) — usa Markdown para formato"
          rows={3}
        />
      </div>
      <div className="flex gap-3">
        <div className="w-20">
          <label className="text-[10px] text-muted-foreground font-semibold uppercase">Orden</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={inputClass} />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground font-semibold uppercase">Categoría</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option value="">Sin categoría</option>
            <option value="cuerpo">🏋️ Cuerpo</option>
            <option value="mente">🧠 Mente</option>
            <option value="alma">💜 Alma</option>
            <option value="finanzas">💰 Finanzas</option>
          </select>
        </div>
        <div className="flex items-end pb-1">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${isActive ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
          >
            {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {isActive ? "Activa" : "Inactiva"}
          </button>
        </div>
      </div>

      {/* Assets section - only for existing tasks */}
      {task?.id && <AssetManager monthTaskId={task.id} />}

      {/* Subtasks section - only for existing tasks */}
      {task?.id && <SubtaskManager monthTaskId={task.id} />}

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

/* ── Asset Manager ── */

const ASSET_KIND_ICON: Record<string, React.ReactNode> = {
  image: <Image className="w-3.5 h-3.5" />,
  video: <Play className="w-3.5 h-3.5" />,
  audio: <Headphones className="w-3.5 h-3.5" />,
  file: <FileText className="w-3.5 h-3.5" />,
  link: <LinkIcon className="w-3.5 h-3.5" />,
};

const ASSET_KIND_LABEL: Record<string, string> = {
  image: "Imagen",
  video: "Video",
  audio: "Audio",
  file: "Archivo",
  link: "Enlace",
};

const AssetManager = ({ monthTaskId }: { monthTaskId: string }) => {
  const { data: assets = [], isLoading } = useMonthTaskAssets(monthTaskId);
  const uploadAsset = useUploadMonthTaskAsset();
  const deleteAsset = useDeleteMonthTaskAsset();
  const createAsset = useCreateMonthTaskAsset();
  const updateAsset = useUpdateMonthTaskAsset();
  const qc = useQueryClient();

  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const handleFileUpload = (kind: MonthTaskAsset["kind"], accept: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        await uploadAsset.mutateAsync({ monthTaskId, file, kind, existingAssets: assets });
        toast.success("Recurso subido");
      } catch (err: any) {
        toast.error(err.message || "Error al subir");
      }
    };
    input.click();
  };

  const handleAddLink = async () => {
    const url = linkUrl.trim();
    if (!url) return;

    const kind = isYouTubeUrl(url) ? "video" : "link";
    const nextOrder = assets.length > 0 ? Math.max(...assets.map((a) => a.sort_order)) + 1 : 0;

    try {
      await createAsset.mutateAsync({
        month_task_id: monthTaskId,
        kind,
        title: isYouTubeUrl(url) ? "Video de YouTube" : "Enlace",
        description: null,
        url,
        file_path: null,
        mime_type: null,
        size_bytes: null,
        sort_order: nextOrder,
      });
      setLinkUrl("");
      setShowLinkInput(false);
      toast.success("Enlace agregado");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (asset: MonthTaskAsset) => {
    if (!window.confirm("Eliminar este recurso?")) return;
    try {
      await deleteAsset.mutateAsync(asset);
      toast.success("Recurso eliminado");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleMove = async (asset: MonthTaskAsset, direction: "up" | "down") => {
    const idx = assets.findIndex((a) => a.id === asset.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= assets.length) return;

    const other = assets[swapIdx];
    try {
      await Promise.all([
        updateAsset.mutateAsync({ id: asset.id, sort_order: other.sort_order }),
        updateAsset.mutateAsync({ id: other.id, sort_order: asset.sort_order }),
      ]);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-muted-foreground font-semibold uppercase">
        Recursos ({assets.length})
      </label>

      {/* Upload buttons */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => handleFileUpload("image", "image/*")}
          disabled={uploadAsset.isPending}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <Image className="w-3 h-3" /> Imagen
        </button>
        <button
          onClick={() => handleFileUpload("audio", "audio/*")}
          disabled={uploadAsset.isPending}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <Headphones className="w-3 h-3" /> Audio
        </button>
        <button
          onClick={() => handleFileUpload("file", ".pdf,application/pdf,.doc,.docx,.xls,.xlsx")}
          disabled={uploadAsset.isPending}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <FileText className="w-3 h-3" /> Archivo
        </button>
        <button
          onClick={() => setShowLinkInput(!showLinkInput)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <LinkIcon className="w-3 h-3" /> Enlace / Video
        </button>
      </div>

      {uploadAsset.isPending && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo...
        </div>
      )}

      {/* Link input */}
      {showLinkInput && (
        <div className="flex gap-1.5">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="URL (YouTube, enlace externo...)"
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={handleAddLink}
            disabled={!linkUrl.trim() || createAsset.isPending}
            className="px-3 py-2 rounded-lg gold-gradient text-primary-foreground text-xs font-bold disabled:opacity-40"
          >
            {createAsset.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => { setShowLinkInput(false); setLinkUrl(""); }} className="px-2 py-2 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Asset list */}
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
      ) : assets.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/60 text-center py-2">Sin recursos adjuntos</p>
      ) : (
        <div className="space-y-1.5">
          {assets.map((asset, idx) => (
            <div key={asset.id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
              <span className="text-muted-foreground shrink-0">{ASSET_KIND_ICON[asset.kind]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {asset.title || ASSET_KIND_LABEL[asset.kind]}
                </p>
                <p className="text-[10px] text-muted-foreground">{ASSET_KIND_LABEL[asset.kind]}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => handleMove(asset, "up")}
                  disabled={idx === 0}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleMove(asset, "down")}
                  disabled={idx === assets.length - 1}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <a href={asset.url} target="_blank" rel="noopener noreferrer" className="p-1 text-primary hover:text-primary/80">
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button onClick={() => handleDelete(asset)} className="p-1 text-destructive hover:text-destructive/80">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Subtask Manager ── */

const SubtaskManager = ({ monthTaskId }: { monthTaskId: string }) => {
  const { data: subtasks = [], isLoading } = useMonthTaskSubtasks(monthTaskId);
  const createSub = useCreateSubtask();
  const updateSub = useUpdateSubtask();
  const deleteSub = useDeleteSubtask();

  const [newTitle, setNewTitle] = useState("");

  const handleAdd = async () => {
    const t = newTitle.trim();
    if (!t) return;
    const nextOrder = subtasks.length > 0 ? Math.max(...subtasks.map((s) => s.sort_order)) + 1 : 1;
    try {
      await createSub.mutateAsync({ month_task_id: monthTaskId, title: t, sort_order: nextOrder });
      setNewTitle("");
      toast.success("Subtarea creada");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggleActive = async (sub: MonthTaskSubtask) => {
    await updateSub.mutateAsync({ id: sub.id, monthTaskId, is_active: !sub.is_active });
  };

  const handleMove = async (sub: MonthTaskSubtask, direction: "up" | "down") => {
    const idx = subtasks.findIndex((s) => s.id === sub.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= subtasks.length) return;
    const other = subtasks[swapIdx];
    await Promise.all([
      updateSub.mutateAsync({ id: sub.id, monthTaskId, sort_order: other.sort_order }),
      updateSub.mutateAsync({ id: other.id, monthTaskId, sort_order: sub.sort_order }),
    ]);
  };

  const handleDelete = async (sub: MonthTaskSubtask) => {
    if (!window.confirm("Eliminar esta subtarea?")) return;
    await deleteSub.mutateAsync({ id: sub.id, monthTaskId });
    toast.success("Subtarea eliminada");
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-muted-foreground font-semibold uppercase">
        Subtareas ({subtasks.filter((s) => s.is_active).length})
      </label>

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
      ) : subtasks.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/60 text-center py-2">Sin subtareas</p>
      ) : (
        <div className="space-y-1">
          {subtasks.map((sub, idx) => (
            <div key={sub.id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
              <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0 text-right">{sub.sort_order}</span>
              <span className={`text-xs flex-1 min-w-0 truncate ${!sub.is_active ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>
                {sub.title}
              </span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => handleToggleActive(sub)} className={`p-1 ${sub.is_active ? "text-success" : "text-muted-foreground"}`}>
                  {sub.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <button onClick={() => handleMove(sub, "up")} disabled={idx === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20">
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button onClick={() => handleMove(sub, "down")} disabled={idx === subtasks.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20">
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button onClick={() => handleDelete(sub)} className="p-1 text-destructive hover:text-destructive/80">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new subtask */}
      <div className="flex gap-1.5">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nueva subtarea..."
          className={`${inputClass} flex-1`}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={!newTitle.trim() || createSub.isPending}
          className="px-3 py-2 rounded-lg gold-gradient text-primary-foreground text-xs font-bold disabled:opacity-40"
        >
          {createSub.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

export default AdminMonthChecklist;
