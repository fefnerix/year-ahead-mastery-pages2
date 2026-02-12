import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWeekBlocks, useCreateBlock, useUpdateBlock, useDeleteBlock, useReorderBlocks, WeekBlock } from "@/hooks/useWeekBlocks";
import { ArrowLeft, Plus, Eye, EyeOff, Trash2, GripVertical, Pencil, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const BLOCK_TYPES = [
  { value: "hero", label: "Hero (Portada)", icon: "🖼️" },
  { value: "audio", label: "Audio", icon: "🎧" },
  { value: "video", label: "Video", icon: "🎬" },
  { value: "text", label: "Texto", icon: "📝" },
  { value: "cronograma", label: "Cronograma", icon: "📅" },
  { value: "playlists", label: "Playlists", icon: "🎵" },
  { value: "resources", label: "Recursos", icon: "📎" },
  { value: "days_map", label: "Mapa de Días", icon: "📆" },
];

const configFields: Record<string, Array<{ key: string; label: string; type: "text" | "textarea" | "url" | "number" | "checkbox" | "select"; options?: string[] }>> = {
  hero: [
    { key: "cover_image_url", label: "URL de imagen de portada", type: "url" },
    { key: "headline", label: "Título principal", type: "text" },
    { key: "subheadline", label: "Subtítulo", type: "text" },
    { key: "primary_cta_label", label: "Texto del botón CTA", type: "text" },
    { key: "overlay_opacity", label: "Opacidad overlay (0-1)", type: "number" },
  ],
  audio: [
    { key: "audio_url", label: "URL del audio", type: "url" },
    { key: "description", label: "Descripción", type: "text" },
    { key: "show_speed_controls", label: "Controles de velocidad", type: "checkbox" },
  ],
  video: [
    { key: "provider", label: "Proveedor", type: "select", options: ["youtube", "vimeo", "url"] },
    { key: "video_url", label: "URL del video", type: "url" },
    { key: "description", label: "Descripción", type: "text" },
    { key: "aspect", label: "Aspecto", type: "select", options: ["16:9", "4:3", "1:1"] },
  ],
  text: [
    { key: "content_richtext", label: "Contenido", type: "textarea" },
    { key: "collapsed_preview_lines", label: "Líneas visibles (colapsado)", type: "number" },
  ],
  cronograma: [
    { key: "schedule_image_url", label: "URL imagen cronograma", type: "url" },
    { key: "schedule_pdf_url", label: "URL PDF cronograma", type: "url" },
    { key: "allow_fullscreen", label: "Permitir pantalla completa", type: "checkbox" },
  ],
  playlists: [
    { key: "spiritual_playlist_url", label: "URL playlist espiritual", type: "url" },
    { key: "mental_playlist_url", label: "URL playlist mental", type: "url" },
    { key: "show_random_button", label: "Botón aleatorio", type: "checkbox" },
  ],
  resources: [],
  days_map: [
    { key: "show_days_cards", label: "Mostrar cards de días", type: "checkbox" },
    { key: "lock_future_days", label: "Bloquear días futuros", type: "checkbox" },
  ],
};

const RetoBuilder = () => {
  const { weekId } = useParams<{ weekId: string }>();
  const navigate = useNavigate();
  const { data: blocks = [], isLoading } = useWeekBlocks(weekId);
  const createBlock = useCreateBlock();
  const updateBlock = useUpdateBlock();
  const deleteBlock = useDeleteBlock();
  const reorderBlocks = useReorderBlocks();

  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [editingBlock, setEditingBlock] = useState<WeekBlock | null>(null);
  const [editConfig, setEditConfig] = useState<Record<string, any>>({});
  const [editTitle, setEditTitle] = useState("");

  const handleAddBlock = async (type: string) => {
    try {
      const maxOrder = blocks.length > 0 ? Math.max(...blocks.map(b => b.order_index)) + 1 : 0;
      await createBlock.mutateAsync({
        week_id: weekId!,
        type,
        order_index: maxOrder,
        config: {},
      });
      setShowTypeSelector(false);
      toast.success("Bloque agregado");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggleVisibility = async (block: WeekBlock) => {
    try {
      await updateBlock.mutateAsync({ id: block.id, is_visible: !block.is_visible });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBlock.mutateAsync(id);
      toast.success("Bloque eliminado");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newBlocks = [...blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    const updates = newBlocks.map((b, i) => ({ id: b.id, order_index: i }));
    await reorderBlocks.mutateAsync(updates);
  };

  const handleMoveDown = async (index: number) => {
    if (index >= blocks.length - 1) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    const updates = newBlocks.map((b, i) => ({ id: b.id, order_index: i }));
    await reorderBlocks.mutateAsync(updates);
  };

  const startEdit = (block: WeekBlock) => {
    setEditingBlock(block);
    setEditConfig({ ...block.config });
    setEditTitle(block.title ?? "");
  };

  const saveEdit = async () => {
    if (!editingBlock) return;
    try {
      await updateBlock.mutateAsync({
        id: editingBlock.id,
        title: editTitle || undefined,
        config: editConfig,
      });
      setEditingBlock(null);
      toast.success("Bloque actualizado");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const inputClass = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

  const blockTypeLabel = (type: string) => BLOCK_TYPES.find(t => t.value === type);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <button onClick={() => navigate("/admin")} className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a Admin
        </button>
        <h1 className="text-2xl font-display font-bold text-foreground">Constructor de Reto</h1>
        <p className="text-sm text-muted-foreground mt-1">Configura los bloques de este reto</p>
      </header>

      <main className="px-5 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Block list */}
            {blocks.map((block, index) => {
              const typeInfo = blockTypeLabel(block.type);
              return (
                <div key={block.id} className={`glass-card rounded-xl p-4 ${!block.is_visible ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleMoveUp(index)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleMoveDown(index)} disabled={index >= blocks.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeInfo?.icon}</span>
                        <span className="text-sm font-semibold text-foreground">{typeInfo?.label}</span>
                      </div>
                      {block.title && <p className="text-xs text-muted-foreground truncate mt-0.5">{block.title}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggleVisibility(block)} className="p-2 text-muted-foreground hover:text-foreground">
                        {block.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => startEdit(block)} className="p-2 text-muted-foreground hover:text-primary">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(block.id)} className="p-2 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add block button */}
            <button
              onClick={() => setShowTypeSelector(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Agregar bloque
            </button>

            {blocks.length === 0 && (
              <div className="glass-card rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground">Este reto no tiene bloques. Agrega bloques para construir la experiencia.</p>
              </div>
            )}
          </>
        )}

        {/* Type selector modal */}
        {showTypeSelector && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowTypeSelector(false)} />
            <div className="relative w-full max-w-md glass-card rounded-t-2xl sm:rounded-2xl p-6 safe-area-bottom">
              <h3 className="text-lg font-display font-bold text-foreground mb-4">Seleccionar tipo de bloque</h3>
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleAddBlock(type.value)}
                    className="glass-card rounded-xl p-4 text-left hover:border-primary/30 transition-colors"
                  >
                    <span className="text-2xl block mb-1">{type.icon}</span>
                    <span className="text-sm font-semibold text-foreground">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Edit modal */}
        {editingBlock && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditingBlock(null)} />
            <div className="relative w-full max-w-md glass-card rounded-t-2xl sm:rounded-2xl p-6 safe-area-bottom max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-display font-bold text-foreground mb-4">
                Editar: {blockTypeLabel(editingBlock.type)?.label}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Título del bloque (opcional)</label>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Título" className={inputClass} />
                </div>

                {configFields[editingBlock.type]?.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        value={editConfig[field.key] ?? ""}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                        rows={4}
                        className={inputClass}
                      />
                    ) : field.type === "checkbox" ? (
                      <label className="flex items-center gap-2 mt-1">
                        <input
                          type="checkbox"
                          checked={editConfig[field.key] ?? false}
                          onChange={(e) => setEditConfig(prev => ({ ...prev, [field.key]: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm text-foreground">{field.label}</span>
                      </label>
                    ) : field.type === "select" ? (
                      <select
                        value={editConfig[field.key] ?? field.options?.[0] ?? ""}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className={inputClass}
                      >
                        {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : field.type === "number" ? (
                      <input
                        type="number"
                        value={editConfig[field.key] ?? ""}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                        className={inputClass}
                      />
                    ) : (
                      <input
                        type={field.type === "url" ? "url" : "text"}
                        value={editConfig[field.key] ?? ""}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className={inputClass}
                      />
                    )}
                  </div>
                ))}

                {editingBlock.type === "resources" && (
                  <div>
                    <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Recursos (JSON)</label>
                    <textarea
                      value={JSON.stringify(editConfig.items ?? [], null, 2)}
                      onChange={(e) => {
                        try {
                          setEditConfig(prev => ({ ...prev, items: JSON.parse(e.target.value) }));
                        } catch {}
                      }}
                      rows={4}
                      className={`${inputClass} font-mono text-xs`}
                      placeholder='[{"label":"Guía","url":"https://...","type":"link"}]'
                    />
                  </div>
                )}

                <button onClick={saveEdit} className="w-full py-3 rounded-xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider">
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default RetoBuilder;
