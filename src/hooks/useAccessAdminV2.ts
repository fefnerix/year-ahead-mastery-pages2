import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminUser {
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  access_status: string;
  access_source: string | null;
  entitlement_id: string | null;
  current_streak: number;
  max_streak: number;
  last_completed_date: string | null;
  month_completed: number;
  month_total: number;
}

interface ListUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  per_page: number;
}

async function fetchWithAuth(path: string, options?: RequestInit) {
  const session = (await supabase.auth.getSession()).data.session;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

export function useAdminUsers(search?: string, status?: string, page = 1) {
  return useQuery<ListUsersResponse>({
    queryKey: ["admin-users", search, status, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("per_page", "50");
      params.set("program_id", "progress_2026");
      return fetchWithAuth(`admin-list-users?${params.toString()}`);
    },
    staleTime: 30_000,
  });
}

export function useStudentDetail(userId: string | null) {
  return useQuery({
    queryKey: ["admin-student-detail", userId],
    queryFn: async () => {
      if (!userId) return null;
      return fetchWithAuth(`admin-student-detail?user_id=${userId}`);
    },
    enabled: !!userId,
    staleTime: 15_000,
  });
}

export function useSetAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      return fetchWithAuth("admin-set-access", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, status, source: "manual" }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-student-detail"] });
    },
  });
}
