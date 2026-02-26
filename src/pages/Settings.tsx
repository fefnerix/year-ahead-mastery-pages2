import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Bell, Eye, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfileSettings, useUpdateProfileSettings } from "@/hooks/useProfileSettings";
import { toast } from "sonner";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { data: settings, isLoading } = useProfileSettings();
  const updateSettings = useUpdateProfileSettings();

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

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <button onClick={() => navigate("/perfil")} className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 className="text-2xl font-display font-bold text-foreground">Configuración</h1>
      </header>

      <main className="px-5 space-y-5">
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

          <div className="space-y-2">
            <a
              href="#"
              className="block text-sm text-primary hover:underline"
            >
              Términos y condiciones
            </a>
            <a
              href="#"
              className="block text-sm text-primary hover:underline"
            >
              Política de privacidad
            </a>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
