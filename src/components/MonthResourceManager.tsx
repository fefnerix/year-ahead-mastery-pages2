import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useMonthResources,
  useUploadMonthResource,
  useDeleteMonthResource,
  useCreateMonthResource,
  useUpdateMonthResource,
  type MonthResource,
} from "@/hooks/useMonthResources";
import { isYouTubeUrl } from "@/lib/media-utils";
import {
  Loader2, Plus, Trash2, X,
  Image, Headphones, FileText, Play, Link as LinkIcon,
  ArrowUp, ArrowDown, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const KIND_ICON: Record<string, React.ReactNode> = {
  image: <Image className="w-3.5 h-3.5" />,
  video: <Play className="w-3.5 h-3.5" />,
  audio: <Headphones className="w-3.5 h-3.5" />,
  file: <FileText className="w-3.5 h-3.5" />,
  link: <LinkIcon className="w-3.5 h-3.5" />,
};

const KIND_LABEL: Record<string, string> = {
  image: "Imagen",
  video: "Video",
  audio: "Audio",
  file: "Archivo",
  link: "Enlace",
};

const inputClass = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

const MonthResourceManager = ({ monthId }: { monthId: string }) => {
  const { data: resources = [], isLoading } = useMonthResources(monthId);
  const uploadResource = useUploadMonthResource();
  const deleteResource = useDeleteMonthResource();
  const createResource = useCreateMonthResource();
  const updateResource = useUpdateMonthResource();

  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const handleFileUpload = (kind: MonthResource["kind"], accept: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      for (const file of Array.from(files)) {
        try {
          await uploadResource.mutateAsync({ monthId, file, kind, existingResources: resources });
          toast.success(`${file.name} subido`);
        } catch (err: any) {
          toast.error(err.message || "Error al subir");
        }
      }
    };
    input.click();
  };

  const handleAddLink = async () => {
    const url = linkUrl.trim();
    if (!url) return;
    const kind = isYouTubeUrl(url) ? "video" : "link";
    const nextOrder = resources.length > 0 ? Math.max(...resources.map((r) => r.sort_order)) + 1 : 0;
    try {
      await createResource.mutateAsync({
        month_id: monthId,
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

  const handleDelete = async (resource: MonthResource) => {
    if (!window.confirm("¿Eliminar este recurso?")) return;
    try {
      await deleteResource.mutateAsync(resource);
      toast.success("Recurso eliminado");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleMove = async (resource: MonthResource, direction: "up" | "down") => {
    const idx = resources.findIndex((r) => r.id === resource.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= resources.length) return;
    const other = resources[swapIdx];
    try {
      await Promise.all([
        updateResource.mutateAsync({ id: resource.id, sort_order: other.sort_order }),
        updateResource.mutateAsync({ id: other.id, sort_order: resource.sort_order }),
      ]);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-muted-foreground font-semibold uppercase">
        Recursos del Mes ({resources.length})
      </label>

      {/* Upload buttons */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => handleFileUpload("file", ".pdf,application/pdf,.doc,.docx,.xls,.xlsx")}
          disabled={uploadResource.isPending}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <FileText className="w-3 h-3" /> PDF/Archivo
        </button>
        <button
          onClick={() => handleFileUpload("image", "image/*")}
          disabled={uploadResource.isPending}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <Image className="w-3 h-3" /> Imagen
        </button>
        <button
          onClick={() => handleFileUpload("audio", "audio/*")}
          disabled={uploadResource.isPending}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <Headphones className="w-3 h-3" /> Audio
        </button>
        <button
          onClick={() => setShowLinkInput(!showLinkInput)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <LinkIcon className="w-3 h-3" /> Enlace / Video
        </button>
      </div>

      {uploadResource.isPending && (
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
            disabled={!linkUrl.trim() || createResource.isPending}
            className="px-3 py-2 rounded-lg gold-gradient text-primary-foreground text-xs font-bold disabled:opacity-40"
          >
            {createResource.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => { setShowLinkInput(false); setLinkUrl(""); }} className="px-2 py-2 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Resource list */}
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
      ) : resources.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/60 text-center py-2">Sin recursos adjuntos</p>
      ) : (
        <div className="space-y-1.5">
          {resources.map((resource, idx) => (
            <div key={resource.id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
              <span className="text-muted-foreground shrink-0">{KIND_ICON[resource.kind]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {resource.title || KIND_LABEL[resource.kind]}
                </p>
                <p className="text-[10px] text-muted-foreground">{KIND_LABEL[resource.kind]}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => handleMove(resource, "up")}
                  disabled={idx === 0}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleMove(resource, "down")}
                  disabled={idx === resources.length - 1}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="p-1 text-primary hover:text-primary/80">
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button onClick={() => handleDelete(resource)} className="p-1 text-destructive hover:text-destructive/80">
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

export default MonthResourceManager;
