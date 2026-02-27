import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useEntitlement(productCode = "progress_2026") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["entitlement", user?.id, productCode],
    queryFn: async () => {
      // Get product id
      const { data: product } = await supabase
        .from("access_products")
        .select("id")
        .eq("code", productCode)
        .single();

      if (!product) return { hasAccess: false, status: null };

      const { data: entitlement } = await supabase
        .from("access_entitlements")
        .select("status")
        .eq("user_id", user!.id)
        .eq("product_id", product.id)
        .single();

      if (!entitlement) return { hasAccess: false, status: null };

      return {
        hasAccess: entitlement.status === "active",
        status: entitlement.status,
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
