import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePrograms } from "@/hooks/useAdmin";
import {
  useManualAccess,
  useImportCsv,
} from "@/hooks/useAdminIntegrations";
import {
  Loader2,
  Copy,
  Check,
  Plus,
  Trash2,
  Upload,
  UserPlus,
  Link2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const inputClass =
  "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

/* ================================================================ */
/* MAIN COMPONENT                                                    */
/* ================================================================ */

const AdminIntegraciones = () => {
  const [subTab, setSubTab] = useState<"integrations" | "manual" | "csv">("integrations");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-display font-bold text-foreground">Accesos & Integraciones</h2>

      <div className="flex gap-1.5 flex-wrap">
        {([
          { key: "integrations", label: "Webhooks", icon: Link2 },
          { key: "manual", label: "Manual", icon: UserPlus },
          { key: "csv", label: "Importar CSV", icon: FileSpreadsheet },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
              subTab === key ? "gold-gradient text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {subTab === "integrations" && <WebhookSection />}
      {subTab === "manual" && <ManualSection />}
      {subTab === "csv" && <CsvSection />}
    </section>
  );
};

/* ================================================================ */
/* WEBHOOKS SECTION                                                  */
/* ================================================================ */

const EXTERNAL_TYPES: Record<string, { label: string; value: string }[]> = {
  hotmart: [
    { label: "Product ID", value: "product_id" },
    { label: "Offer Code", value: "offer_code" },
  ],
  stripe: [
    { label: "Price ID (recomendado)", value: "price_id" },
    { label: "Payment Link", value: "payment_link" },
  ],
};

function useProductMappings() {
  return useQuery({
    queryKey: ["product-mappings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_mappings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

function useUpsertMappingsBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      rows: {
        provider: string;
        external_product_id: string;
        external_type: string;
        program_id: string;
        is_active: boolean;
        metadata: Record<string, any>;
      }[]
    ) => {
      let saved = 0;
      let dupes = 0;
      for (const row of rows) {
        const { error } = await supabase.from("product_mappings").upsert(
          {
            provider: row.provider,
            external_product_id: row.external_product_id,
            external_type: row.external_type,
            program_id: row.program_id,
            is_active: row.is_active,
            metadata: row.metadata,
          },
          { onConflict: "provider,external_product_id" }
        );
        if (error) {
          if (error.code === "23505") { dupes++; continue; }
          throw error;
        }
        saved++;
      }
      return { saved, dupes };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product-mappings"] }),
  });
}

function useDeleteMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_mappings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product-mappings"] }),
  });
}

function useToggleMappingActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("product_mappings").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product-mappings"] }),
  });
}

const WebhookSection = () => {
  const { data: programs = [] } = usePrograms();
  const { data: mappings = [], isLoading } = useProductMappings();
  const upsertBatch = useUpsertMappingsBatch();
  const deleteMapping = useDeleteMapping();
  const toggleActive = useToggleMappingActive();

  const [showForm, setShowForm] = useState(false);
  const [formProvider, setFormProvider] = useState("hotmart");
  const [formExternalType, setFormExternalType] = useState("product_id");
  const [formIds, setFormIds] = useState("");
  const [formProgramId, setFormProgramId] = useState("");
  const [formNote, setFormNote] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const hotmartUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hotmart-webhook`;
  const stripeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-stripe`;

  const copyUrl = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(label);
    toast.success("URL copiada");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleProviderChange = (p: string) => {
    setFormProvider(p);
    setFormExternalType(EXTERNAL_TYPES[p][0].value);
  };

  const handleSaveBatch = async () => {
    if (!formProgramId) { toast.error("Selecciona un programa"); return; }
    const ids = formIds.split(/\n/).map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) { toast.error("Ingresa al menos un ID"); return; }

    try {
      const rows = ids.map((id) => ({
        provider: formProvider,
        external_product_id: id,
        external_type: formExternalType,
        program_id: formProgramId,
        is_active: true,
        metadata: formNote ? { note: formNote } : {},
      }));
      const res = await upsertBatch.mutateAsync(rows);
      toast.success(`${res.saved} mapeos guardados${res.dupes > 0 ? ` / ${res.dupes} duplicados` : ""}`);
      setShowForm(false);
      setFormIds("");
      setFormNote("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMapping.mutateAsync(id);
      toast.success("Mapeo eliminado");
      setConfirmDeleteId(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Hotmart */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-display font-bold text-foreground">Hotmart</h3>
        <div>
          <label className="text-[10px] text-muted-foreground font-semibold uppercase">URL del Webhook</label>
          <div className="flex gap-1.5 mt-1">
            <input value={hotmartUrl} readOnly className={`${inputClass} flex-1 text-[11px]`} />
            <button onClick={() => copyUrl(hotmartUrl, "hotmart")} className="px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
              {copiedUrl === "hotmart" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Header <code className="bg-muted px-1 rounded">x-hotmart-hottok</code> · Secret: HOTMART_WEBHOOK_SECRET
        </p>
      </div>

      {/* Stripe */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-display font-bold text-foreground">Stripe</h3>
        <div>
          <label className="text-[10px] text-muted-foreground font-semibold uppercase">URL del Webhook</label>
          <div className="flex gap-1.5 mt-1">
            <input value={stripeUrl} readOnly className={`${inputClass} flex-1 text-[11px]`} />
            <button onClick={() => copyUrl(stripeUrl, "stripe")} className="px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
              {copiedUrl === "stripe" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Usa <code className="bg-muted px-1 rounded">price_id</code> como ID externo · Secret: STRIPE_WEBHOOK_SECRET
        </p>
      </div>

      {/* Product Mappings */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-bold text-foreground">Mapeo de Productos</h3>
          <button onClick={() => setShowForm(!showForm)} className="text-primary text-[11px] font-semibold flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>

        {showForm && (
          <div className="space-y-2 bg-muted/30 rounded-lg p-3">
            <div className="flex gap-2">
              <select value={formProvider} onChange={(e) => handleProviderChange(e.target.value)} className={`${inputClass} w-28`}>
                <option value="hotmart">Hotmart</option>
                <option value="stripe">Stripe</option>
              </select>
              <select value={formExternalType} onChange={(e) => setFormExternalType(e.target.value)} className={`${inputClass} w-40`}>
                {EXTERNAL_TYPES[formProvider]?.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <select value={formProgramId} onChange={(e) => setFormProgramId(e.target.value)} className={inputClass}>
              <option value="">Seleccionar programa...</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.year})</option>
              ))}
            </select>
            <textarea
              placeholder={"IDs externos (uno por línea)\nEj: " + (formProvider === "stripe" ? "price_1T2YhCBCvu8gin2dcJnNPjTR" : "1234567")}
              value={formIds}
              onChange={(e) => setFormIds(e.target.value)}
              rows={4}
              className={inputClass}
            />
            <input
              placeholder="Nota (opcional)"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              className={inputClass}
            />
            <button
              onClick={handleSaveBatch}
              disabled={upsertBatch.isPending || !formIds.trim() || !formProgramId}
              className="w-full py-2 rounded-lg gold-gradient font-bold text-primary-foreground text-sm disabled:opacity-40"
            >
              {upsertBatch.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Guardar mapeos"}
            </button>
          </div>
        )}

        {isLoading ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
        ) : mappings.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-3">No hay mapeos configurados.</p>
        ) : (
          <div className="space-y-1.5">
            {mappings.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-foreground truncate">
                    <span className={`uppercase text-[9px] px-1.5 py-0.5 rounded font-bold mr-1.5 ${m.provider === "stripe" ? "bg-primary/20 text-primary" : "bg-accent/60 text-accent-foreground"}`}>
                      {m.provider}
                    </span>
                    <span className="text-muted-foreground text-[9px] mr-1">{m.external_type || "id"}:</span>
                    {m.external_product_id}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    → {programs.find((p) => p.id === m.program_id)?.name || m.program_id?.substring(0, 8)}
                    {m.metadata?.note && <span className="ml-2 italic">"{m.metadata.note}"</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleActive.mutate({ id: m.id, is_active: !m.is_active })}
                    className={`text-[9px] px-2 py-1 rounded-md font-semibold transition-colors ${m.is_active ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}
                  >
                    {m.is_active ? "Activo" : "Inactivo"}
                  </button>
                  {confirmDeleteId === m.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(m.id)} className="text-[9px] px-2 py-1 rounded-md bg-destructive text-destructive-foreground font-semibold">Sí</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-[9px] px-2 py-1 rounded-md bg-muted text-muted-foreground font-semibold">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(m.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ================================================================ */
/* MANUAL ACCESS SECTION                                             */
/* ================================================================ */

const ManualSection = () => {
  const { data: programs = [] } = usePrograms();
  const manualAccess = useManualAccess();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [programId, setProgramId] = useState("");
  const [status, setStatus] = useState("active");
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!email || !programId) {
      toast.error("Email y programa son obligatorios");
      return;
    }
    try {
      const res = await manualAccess.mutateAsync({ email, full_name: fullName || undefined, program_id: programId, status, reason: reason || undefined });
      toast.success(`Acceso ${status} para ${res.email}`);
      setEmail("");
      setFullName("");
      setReason("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-1.5">
        <UserPlus className="w-4 h-4 text-primary" /> Acceso Manual
      </h3>
      <p className="text-[10px] text-muted-foreground">
        Si el usuario no existe, se creará automáticamente con una contraseña temporal.
      </p>

      <div className="space-y-2">
        <input placeholder="Email del alumno *" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        <input placeholder="Nombre completo (opcional)" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        <select value={programId} onChange={(e) => setProgramId(e.target.value)} className={inputClass}>
          <option value="">Seleccionar programa *</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.year})</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          <option value="active">Activo</option>
          <option value="pending">Pendiente</option>
          <option value="blocked">Bloqueado</option>
        </select>
        <input placeholder="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} />
        <button
          onClick={handleSubmit}
          disabled={manualAccess.isPending || !email || !programId}
          className="w-full py-2.5 rounded-lg gold-gradient font-bold text-primary-foreground text-sm flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {manualAccess.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Guardar Acceso
        </button>
      </div>
    </div>
  );
};

/* ================================================================ */
/* CSV IMPORT SECTION                                                */
/* ================================================================ */

interface CsvRow {
  email: string;
  full_name?: string;
  status?: string;
  reason?: string;
}

const CsvSection = () => {
  const { data: programs = [] } = usePrograms();
  const importCsv = useImportCsv();
  const fileRef = useRef<HTMLInputElement>(null);

  const [programId, setProgramId] = useState("");
  const [defaultStatus, setDefaultStatus] = useState("active");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [report, setReport] = useState<any>(null);

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      setErrors(["El CSV debe tener al menos un encabezado y una fila"]);
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    const emailIdx = headers.indexOf("email");
    if (emailIdx === -1) {
      setErrors(["El CSV debe tener una columna 'email'"]);
      return;
    }
    const nameIdx = headers.indexOf("full_name");
    const statusIdx = headers.indexOf("status");
    const reasonIdx = headers.indexOf("reason");

    const parsed: CsvRow[] = [];
    const errs: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seen = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^['"]|['"]$/g, ""));
      const email = (cols[emailIdx] || "").toLowerCase().trim();

      if (!email) continue;
      if (!emailRegex.test(email)) {
        errs.push(`Fila ${i + 1}: email inválido "${email}"`);
        continue;
      }
      if (seen.has(email)) {
        errs.push(`Fila ${i + 1}: email duplicado "${email}"`);
        continue;
      }
      seen.add(email);

      parsed.push({
        email,
        full_name: nameIdx >= 0 ? cols[nameIdx] || undefined : undefined,
        status: statusIdx >= 0 ? cols[statusIdx] || undefined : undefined,
        reason: reasonIdx >= 0 ? cols[reasonIdx] || undefined : undefined,
      });
    }

    setRows(parsed);
    setErrors(errs);
    setReport(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseCsv(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!programId || rows.length === 0) return;
    try {
      const res = await importCsv.mutateAsync({ program_id: programId, default_status: defaultStatus, rows });
      setReport(res);
      toast.success(`Importación completada: ${res.upserts} procesados`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-primary" /> Importar CSV
        </h3>
        <p className="text-[10px] text-muted-foreground">
          Formato: <code className="bg-muted px-1 rounded">email,full_name,status,reason</code>.
          Columna <code className="bg-muted px-1 rounded">email</code> es obligatoria.
        </p>

        <select value={programId} onChange={(e) => setProgramId(e.target.value)} className={inputClass}>
          <option value="">Seleccionar programa *</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.year})</option>
          ))}
        </select>

        <select value={defaultStatus} onChange={(e) => setDefaultStatus(e.target.value)} className={inputClass}>
          <option value="active">Status por defecto: Activo</option>
          <option value="pending">Status por defecto: Pendiente</option>
          <option value="blocked">Status por defecto: Bloqueado</option>
        </select>

        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2.5 rounded-lg bg-muted text-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
          >
            <Upload className="w-4 h-4" />
            {rows.length > 0 ? `${rows.length} filas cargadas` : "Seleccionar archivo CSV"}
          </button>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="glass-card rounded-xl p-3 space-y-1">
          <p className="text-[10px] font-semibold text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {errors.length} advertencias
          </p>
          <div className="max-h-24 overflow-y-auto space-y-0.5">
            {errors.map((e, i) => (
              <p key={i} className="text-[10px] text-destructive/80">{e}</p>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && !report && (
        <div className="glass-card rounded-xl p-3 space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">
            Preview ({Math.min(rows.length, 20)} de {rows.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1 text-muted-foreground font-semibold">Email</th>
                  <th className="text-left py-1 text-muted-foreground font-semibold">Nombre</th>
                  <th className="text-left py-1 text-muted-foreground font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1 text-foreground">{r.email}</td>
                    <td className="py-1 text-foreground">{r.full_name || "—"}</td>
                    <td className="py-1 text-foreground">{r.status || defaultStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={importCsv.isPending || !programId}
            className="w-full py-2.5 rounded-lg gold-gradient font-bold text-primary-foreground text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {importCsv.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Importar {rows.length} alumnos
          </button>
        </div>
      )}

      {/* Report */}
      {report && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-display font-bold text-foreground">Resultado de la importación</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-success/10 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-success">{report.created_users}</p>
              <p className="text-[10px] text-muted-foreground">Usuarios creados</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-primary">{report.existing_users}</p>
              <p className="text-[10px] text-muted-foreground">Ya existían</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-primary">{report.upserts}</p>
              <p className="text-[10px] text-muted-foreground">Accesos procesados</p>
            </div>
            <div className={`rounded-lg p-3 text-center ${report.errors?.length > 0 ? "bg-destructive/10" : "bg-muted"}`}>
              <p className={`text-lg font-bold ${report.errors?.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {report.errors?.length || 0}
              </p>
              <p className="text-[10px] text-muted-foreground">Errores</p>
            </div>
          </div>

          {report.errors?.length > 0 && (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {report.errors.map((e: any, i: number) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px] text-destructive">
                  <XCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>{e.email}: {e.reason}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => { setRows([]); setErrors([]); setReport(null); if (fileRef.current) fileRef.current.value = ""; }}
            className="w-full py-2 rounded-lg bg-muted text-foreground font-semibold text-sm"
          >
            Nueva importación
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminIntegraciones;
