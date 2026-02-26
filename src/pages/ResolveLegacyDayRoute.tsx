import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ResolveLegacyDayRoute = () => {
  const navigate = useNavigate();
  const { weekId, dayNumber } = useParams();

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!weekId || !dayNumber) {
        navigate("/", { replace: true });
        return;
      }

      const dayNum = Number(dayNumber);
      if (!Number.isFinite(dayNum)) {
        navigate("/", { replace: true });
        return;
      }

      const { data, error } = await supabase.rpc("resolve_day_id", {
        p_week_id: weekId,
        p_day_number: dayNum,
      });

      if (cancelled) return;

      if (error || !data) {
        navigate("/", { replace: true });
        return;
      }

      navigate(`/day/${data}`, { replace: true });
    }

    resolve();
    return () => { cancelled = true; };
  }, [weekId, dayNumber, navigate]);

  return null;
};

export default ResolveLegacyDayRoute;
