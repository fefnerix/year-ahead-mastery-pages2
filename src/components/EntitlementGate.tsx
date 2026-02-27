import { useEntitlement } from "@/hooks/useEntitlement";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Loader2, ShieldX, MessageCircle } from "lucide-react";
import Logo from "@/components/Logo";

const EntitlementGate = ({ children }: { children: React.ReactNode }) => {
  const { data: entitlement, isLoading: entLoading } = useEntitlement();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  if (entLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Admins always have access
  if (isAdmin) return <>{children}</>;

  // User has active entitlement
  if (entitlement?.hasAccess) return <>{children}</>;

  // Blocked
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <Logo variant="compact" className="mx-auto mb-4" />
        <div className="glass-card rounded-2xl p-8 space-y-4">
          <ShieldX className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-xl font-display font-bold text-foreground">
            Acceso restringido
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {entitlement?.status === "past_due"
              ? "Tu pago esta pendiente. Regulariza tu situacion para continuar accediendo al programa."
              : entitlement?.status === "canceled" || entitlement?.status === "revoked"
              ? "Tu acceso ha sido cancelado o revocado. Contacta soporte para mas informacion."
              : "Tu acceso esta pendiente o no ha sido activado aun. Contacta soporte si ya realizaste tu compra."}
          </p>
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient font-bold text-primary-foreground text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Contactar soporte
          </a>
        </div>
      </div>
    </div>
  );
};

export default EntitlementGate;
