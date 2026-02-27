import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const DayDetail = () => {
  const { dayId } = useParams<{ dayId: string }>();
  const navigate = useNavigate();

  // Fetch the day to find its month, then redirect
  const { data, isLoading } = useQuery({
    queryKey: ["day-redirect", dayId],
    queryFn: async () => {
      const { data: day } = await supabase
        .from("days")
        .select("week_id")
        .eq("id", dayId!)
        .single();
      if (!day) return null;
      const { data: week } = await supabase
        .from("weeks")
        .select("month_id")
        .eq("id", day.week_id)
        .single();
      return week?.month_id ?? null;
    },
    enabled: !!dayId,
  });

  useEffect(() => {
    if (!isLoading) {
      toast.info("El flujo diario fue actualizado. Ahora usamos el checklist del mes.");
      if (data) {
        navigate(`/mes/${data}`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [isLoading, data, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
};

export default DayDetail;
