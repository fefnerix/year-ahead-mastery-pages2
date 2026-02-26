import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Bell, Eye, Info, User, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfileSettings, useUpdateProfileSettings } from "@/hooks/useProfileSettings";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: settings, isLoading } = useProfileSettings();
  const updateSettings = useUpdateProfileSettings();
  const qc = useQueryClient();

  const currentName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";
  const [displayName, setDisplayName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDisplayName(currentName); }, [currentName]);

  const nameValid = displayName.trim().length >= 2 && displayName.trim().length <= 32;
  const nameChanged = displayName.trim() !== currentName;

  const saveProfile = async () => {
    if (!nameValid || !user) return;
    setSaving(true);
    const cleanName = displayName.trim().replace(/\s{2,}/g, " ");
    try {
      await supabase.from("profiles").update({ display_name: cleanName }).eq("user_id", user.id);
      await supabase.auth.updateUser({ data: { display_name: cleanName } });
      qc.invalidateQueries({ queryKey: ["ranking-summary"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("Perfil actualizado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: "daily_reminder" | "show_in_ranking", value: boolean) => {
    updateSettings.mutate({ [key]: value }, {
      onSuccess: () => toast.success("Configuración guardada"),
    });
  };

  const updateTime = (time: string) => {
    updateSettings.mutate({ reminder_time: time });
  };

  const toggleClass = (on: boolean) =>
    `relative w-11 h-6 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"} cursor-pointer`;
  const dotClass = (on: boolean) =>
    `absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${on ? "translate-x-5" : ""}`;

  const inputClass =
    "w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <button onClick={() => navigate("/perfil")} className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 className="text-2xl font-display font-bold text-foreground">Configuración</h1>
      </header>

      <main className="px-5 space-y-5">
        {/* Perfil */}
        <div className="glass-card rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Perfil</h2>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">
              Nombre visible
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 32))}
              placeholder="Tu nombre"
              className={inputClass}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              {displayName.trim().length}/32 caracteres (mín. 2)
            </p>
          </div>

          {nameChanged && (
            <button
              onClick={saveProfile}
              disabled={!nameValid || saving}
              className="w-full py-3 rounded-xl gold-gradient font-bold text-primary-foreground text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : "Guardar cambios"}
            </button>
          )}
        </div>

        {/* Notificaciones */}
        <div className="glass-card rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notificaciones</h2>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Recordatorio diario</span>
            <button
              onClick={() => settings && toggle("daily_reminder", !settings.daily_reminder)}
              className={toggleClass(settings?.daily_reminder ?? false)}
              disabled={isLoading}
            >
              <span className={dotClass(settings?.daily_reminder ?? false)} />
            </button>
          </div>

          {settings?.daily_reminder && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Hora del recordatorio</span>
              <input
                type="time"
                value={settings?.reminder_time?.slice(0, 5) ?? "08:00"}
                onChange={(e) => updateTime(e.target.value)}
                className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>

        {/* Privacidad */}
        <div className="glass-card rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Privacidad</h2>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Mostrarme en el ranking</span>
              <button
                onClick={() => settings && toggle("show_in_ranking", !settings.show_in_ranking)}
                className={toggleClass(settings?.show_in_ranking ?? true)}
                disabled={isLoading}
              >
                <span className={dotClass(settings?.show_in_ranking ?? true)} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Si lo desactivas, no aparecerás en el ranking.
            </p>
          </div>
        </div>

        {/* Información */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Información</h2>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Versión</span>
            <span className="text-sm text-muted-foreground">1.0.0</span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
