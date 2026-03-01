import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/hooks/useAdmin";
import { deleteStorageFile } from "@/lib/storage-utils";

export interface MonthResource {
  id: string;
  month_id: string;
  kind: "image" | "video" | "audio" | "file" | "link";
  title: string | null;
  description: string | null;
  url: string;
  file_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
  created_at: string;
}

const QK = "month-resources";

export function useMonthResources(monthId: string | null | undefined) {
  return useQuery({
    queryKey: [QK, monthId],
    queryFn: async (): Promise<MonthResource[]> => {
      const { data, error } = await supabase
        .from("month_resources")
        .select("*")
        .eq("month_id", monthId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MonthResource[];
    },
    enabled: !!monthId,
  });
}

export function useCreateMonthResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (resource: Omit<MonthResource, "id" | "created_at">) => {
      const { error } = await supabase.from("month_resources").insert(resource as any);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: [QK, vars.month_id] });
    },
  });
}

export function useUpdateMonthResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MonthResource> & { id: string }) => {
      const { error } = await supabase.from("month_resources").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
    },
  });
}

export function useDeleteMonthResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (resource: Pick<MonthResource, "id" | "url" | "file_path" | "month_id">) => {
      if (resource.file_path) {
        await deleteStorageFile("task_media", resource.url);
      }
      const { error } = await supabase.from("month_resources").delete().eq("id", resource.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: [QK, vars.month_id] });
    },
  });
}

export function useUploadMonthResource() {
  const create = useCreateMonthResource();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      monthId,
      file,
      kind,
      existingResources,
    }: {
      monthId: string;
      file: File;
      kind: MonthResource["kind"];
      existingResources: MonthResource[];
    }) => {
      const url = await uploadFile("task_media", file);
      const pattern = `/storage/v1/object/public/task_media/`;
      const idx = url.indexOf(pattern);
      const filePath = idx !== -1 ? decodeURIComponent(url.substring(idx + pattern.length)) : null;

      const nextOrder = existingResources.length > 0
        ? Math.max(...existingResources.map((r) => r.sort_order)) + 1
        : 0;

      await create.mutateAsync({
        month_id: monthId,
        kind,
        title: file.name,
        description: null,
        url,
        file_path: filePath,
        mime_type: file.type || null,
        size_bytes: file.size || null,
        sort_order: nextOrder,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
    },
  });
}
