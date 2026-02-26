import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, FileText, Loader2, ExternalLink } from "lucide-react";

const TYPE_ICONS: Record<string, string> = {
  pdf: "📄",
  audio: "🎧",
  video: "🎬",
  link: "🔗",
};

const Lecturas = () => {
  const [params] = useSearchParams();
  const weekId = params.get("weekId");
  const dayId = params.get("dayId");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["lecturas", weekId, dayId],
    queryFn: async () => {
      if (dayId) {
        const { data, error } = await supabase
          .from("content_items")
          .select("id, title, url, type, day_id")
          .eq("day_id", dayId)
          .order("order");
        if (error) throw error;
        return data ?? [];
      }
      if (weekId) {
        // Get all days for this week, then content_items
        const { data: days } = await supabase
          .from("days")
          .select("id")
          .eq("week_id", weekId);
        if (!days || days.length === 0) return [];
        const dayIds = days.map((d) => d.id);
        const { data, error } = await supabase
          .from("content_items")
          .select("id, title, url, type, day_id")
          .in("day_id", dayIds)
          .order("order");
        if (error) throw error;
        // Deduplicate by URL
        const seen = new Set<string>();
        return (data ?? []).filter((item) => {
          if (seen.has(item.url)) return false;
          seen.add(item.url);
          return true;
        });
      }
      return [];
    },
  });

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pt-12 pb-4">
        <Link
          to={weekId ? `/reto/${weekId}` : dayId ? "/" : "/"}
          className="text-muted-foreground mb-3 flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <h1 className="text-2xl font-display font-bold text-foreground">Lecturas</h1>
        <p className="text-sm text-muted-foreground mt-1">Materiales y recursos</p>
      </header>

      <main className="px-5 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center border border-muted/20">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No hay lecturas disponibles.</p>
          </div>
        ) : (
          items.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card rounded-xl p-4 flex items-center gap-3 border border-primary/10 hover:border-primary/30 transition-colors press-scale"
            >
              <span className="text-xl shrink-0">{TYPE_ICONS[item.type] ?? "📎"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{item.type}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-primary shrink-0" />
            </a>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Lecturas;
