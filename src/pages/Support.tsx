import BottomNav from "@/components/BottomNav";
import { ArrowLeft, MessageCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const SupportPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const email = user?.email ?? "";

  const whatsappUrl = `https://wa.me/5524981537082?text=${encodeURIComponent(
    `Hola, necesito ayuda con PROGRESS. Mi correo es ${email}. Mi problema es:`
  )}`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <button onClick={() => navigate("/perfil")} className="text-muted-foreground mb-3 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 className="text-2xl font-display font-bold text-foreground">Soporte y Ayuda</h1>
        <p className="text-sm text-muted-foreground mt-1">¿Necesitas ayuda? Estamos para ti.</p>
      </header>

      <main className="px-5 space-y-5">
        {/* WhatsApp */}
        <div className="glass-card gold-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[hsl(142_71%_45%)] flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Hablar por WhatsApp</h2>
              <p className="text-xs text-muted-foreground">Respuesta rápida y directa</p>
            </div>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-xl bg-[hsl(142_71%_45%)] text-center font-bold text-white text-sm uppercase tracking-wider"
          >
            Abrir WhatsApp
          </a>
        </div>

        {/* Horario */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Horario de atención</h2>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-foreground">Lunes a viernes: 9:00 – 18:00 (hora de Brasilia)</p>
            <p className="text-sm text-foreground">Sábados: 9:00 – 13:00</p>
            <p className="text-xs text-muted-foreground mt-2">Fuera de horario, deja tu mensaje y te responderemos lo antes posible.</p>
          </div>
        </div>

        {/* FAQ hint */}
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">
            Si tienes dudas sobre el programa, revisa la sección <span className="text-primary font-semibold">Reto del Mes</span> en la pantalla principal.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default SupportPage;
