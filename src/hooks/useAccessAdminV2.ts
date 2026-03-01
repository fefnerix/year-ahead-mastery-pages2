import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export interface AdminUser {
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  access_status: string;
  access_source: string | null;
  entitlement_id: string | null;
}

export function useAdminUsers(search?: string) {
  return useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      params.set("program_id", "progress_2026");

      const { data, error } = await supabase.functions.invoke("admin-list-users", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: undefined,
      });

      // supabase.functions.invoke doesn't support query params well, use fetch directly
      const session = (await supabase.auth.getSession()).data.session;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-list-users?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Error loading users");
      }

      return (await res.json()) as AdminUser[];
    },
    staleTime: 30_000,
  });
}

export function useSetAccess() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const session = (await supabase.auth.getSession()).data.session;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-set-access`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, status, source: "manual" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Error updating access");
      }

      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-entitlements"] });
    },
  });
}
