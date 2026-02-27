import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useEntitlements(search?: string) {
  return useQuery({
    queryKey: ["admin-entitlements", search],
    queryFn: async () => {
      // Get all entitlements with product info
      let query = supabase
        .from("access_entitlements")
        .select("*, access_products(code, name)")
        .order("updated_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // We need to get user emails - fetch profiles
      const userIds = (data || []).map((e) => e.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p.display_name])
      );

      const results = (data || []).map((e) => ({
        ...e,
        display_name: profileMap.get(e.user_id) || "Sin nombre",
        product_name: (e.access_products as any)?.name || "—",
        product_code: (e.access_products as any)?.code || "—",
      }));

      if (search) {
        const s = search.toLowerCase();
        return results.filter(
          (r) =>
            r.display_name?.toLowerCase().includes(s) ||
            r.external_customer_id?.toLowerCase().includes(s) ||
            r.user_id?.toLowerCase().includes(s)
        );
      }

      return results;
    },
  });
}

export function useUpdateEntitlementStatus() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      entitlementId,
      userId,
      productId,
      newStatus,
    }: {
      entitlementId: string;
      userId: string;
      productId: string;
      newStatus: string;
    }) => {
      const actionMap: Record<string, string> = {
        active: "grant",
        past_due: "suspend",
        revoked: "revoke",
      };

      const { error } = await supabase
        .from("access_entitlements")
        .update({
          status: newStatus,
          source: "manual",
          updated_at: new Date().toISOString(),
        })
        .eq("id", entitlementId);

      if (error) throw error;

      // Log action
      await supabase.from("access_actions").insert({
        action: actionMap[newStatus] || "sync",
        user_id: userId,
        product_id: productId,
        actor_user_id: user?.id || null,
        reason: `Manual: status -> ${newStatus}`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-entitlements"] });
    },
  });
}

export function useAccessActions(userId?: string) {
  return useQuery({
    queryKey: ["admin-access-actions", userId],
    queryFn: async () => {
      let query = supabase
        .from("access_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useGrantAccess() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      userId,
      productCode = "progress_2026",
    }: {
      userId: string;
      productCode?: string;
    }) => {
      const { data: product } = await supabase
        .from("access_products")
        .select("id")
        .eq("code", productCode)
        .single();

      if (!product) throw new Error("Producto no encontrado");

      await supabase.from("access_entitlements").upsert(
        {
          user_id: userId,
          product_id: product.id,
          status: "active",
          source: "manual",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,product_id" }
      );

      await supabase.from("access_actions").insert({
        action: "grant",
        user_id: userId,
        product_id: product.id,
        actor_user_id: user?.id || null,
        reason: "Manual grant from admin",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-entitlements"] });
    },
  });
}
