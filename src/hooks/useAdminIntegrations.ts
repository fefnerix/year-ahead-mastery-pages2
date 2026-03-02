import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function useManualAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      email: string;
      full_name?: string;
      program_id: string;
      status: string;
      reason?: string;
    }) => {
      return fetchWithAuth("admin-manual-access", {
        method: "POST",
        body: JSON.stringify({ ...data, source: "manual" }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useImportCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      program_id: string;
      default_status: string;
      rows: Array<{ email: string; full_name?: string; status?: string; reason?: string }>;
    }) => {
      return fetchWithAuth("admin-import-csv", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useProductMappingUpsert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      provider: string;
      external_product_id: string;
      program_id: string;
    }) => {
      return fetchWithAuth("admin-product-mapping", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-mappings"] });
    },
  });
}

export function useDeleteProductMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return fetchWithAuth("admin-product-mapping", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-mappings"] });
    },
  });
}
