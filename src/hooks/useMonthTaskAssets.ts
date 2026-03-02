import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/hooks/useAdmin";
import { deleteStorageFile } from "@/lib/storage-utils";

export interface MonthTaskAsset {
  id: string;
  month_task_id: string;
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

export function useMonthTaskAssets(monthTaskId: string | null | undefined) {
  return useQuery({
    queryKey: ["month-task-assets", monthTaskId],
    queryFn: async (): Promise<MonthTaskAsset[]> => {
      const { data, error } = await supabase
        .from("month_task_assets")
        .select("*")
        .eq("month_task_id", monthTaskId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MonthTaskAsset[];
    },
    enabled: !!monthTaskId,
  });
}

/** Fetch assets for multiple tasks at once (for user-side list) */
export function useMonthTasksAssetsBatch(taskIds: string[]) {
  return useQuery({
    queryKey: ["month-task-assets-batch", taskIds],
    queryFn: async (): Promise<MonthTaskAsset[]> => {
      if (taskIds.length === 0) return [];
      const { data, error } = await supabase
        .from("month_task_assets")
        .select("id, month_task_id, kind, title, url, sort_order")
        .in("month_task_id", taskIds)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MonthTaskAsset[];
    },
    enabled: taskIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 min — assets rarely change
  });
}

export function useCreateMonthTaskAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asset: Omit<MonthTaskAsset, "id" | "created_at">) => {
      const { error } = await supabase.from("month_task_assets").insert(asset as any);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["month-task-assets", vars.month_task_id] });
      qc.invalidateQueries({ queryKey: ["month-task-assets-batch"] });
    },
  });
}

export function useUpdateMonthTaskAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MonthTaskAsset> & { id: string }) => {
      const { error } = await supabase.from("month_task_assets").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["month-task-assets"] });
      qc.invalidateQueries({ queryKey: ["month-task-assets-batch"] });
    },
  });
}

export function useDeleteMonthTaskAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asset: Pick<MonthTaskAsset, "id" | "url" | "file_path" | "month_task_id">) => {
      // Delete from storage if it's a stored file
      if (asset.file_path) {
        await deleteStorageFile("task_media", asset.url);
      }
      const { error } = await supabase.from("month_task_assets").delete().eq("id", asset.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["month-task-assets", vars.month_task_id] });
      qc.invalidateQueries({ queryKey: ["month-task-assets-batch"] });
    },
  });
}

/** Upload a file and create an asset record */
export function useUploadMonthTaskAsset() {
  const create = useCreateMonthTaskAsset();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      monthTaskId,
      file,
      kind,
      title,
      existingAssets,
    }: {
      monthTaskId: string;
      file: File;
      kind: MonthTaskAsset["kind"];
      title?: string;
      existingAssets: MonthTaskAsset[];
    }) => {
      const url = await uploadFile("task_media", file);
      // extract file_path from URL
      const pattern = `/storage/v1/object/public/task_media/`;
      const idx = url.indexOf(pattern);
      const filePath = idx !== -1 ? decodeURIComponent(url.substring(idx + pattern.length)) : null;

      const nextOrder = existingAssets.length > 0
        ? Math.max(...existingAssets.map((a) => a.sort_order)) + 1
        : 0;

      await create.mutateAsync({
        month_task_id: monthTaskId,
        kind,
        title: title || file.name,
        description: null,
        url,
        file_path: filePath,
        mime_type: file.type || null,
        size_bytes: file.size || null,
        sort_order: nextOrder,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["month-task-assets"] });
      qc.invalidateQueries({ queryKey: ["month-task-assets-batch"] });
    },
  });
}
