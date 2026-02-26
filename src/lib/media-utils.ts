/**
 * Media URL detection and validation helpers.
 * Used by Admin editors for validation warnings and by app components
 * for choosing the right player (CustomVideoPlayer vs YouTube iframe).
 */

const SUPABASE_STORAGE_PATTERN = /supabase\.co\/storage\/v1/i;

export const isYouTubeUrl = (url: string): boolean =>
  /youtu\.?be/i.test(url);

export const getYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/
  );
  return match?.[1] || null;
};

export const isDirectVideoUrl = (url: string): boolean =>
  /\.(mp4|webm|m3u8)(\?.*)?$/i.test(url) || SUPABASE_STORAGE_PATTERN.test(url);

export const isDirectAudioUrl = (url: string): boolean =>
  /\.(mp3|m4a|wav|ogg)(\?.*)?$/i.test(url) || SUPABASE_STORAGE_PATTERN.test(url);

/**
 * Returns a warning string for the Admin, or null if URL looks fine.
 */
export const getMediaWarning = (
  url: string,
  type: "video" | "audio"
): string | null => {
  if (!url) return null;

  if (type === "video") {
    if (!isYouTubeUrl(url)) {
      return "Solo se aceptan URLs de YouTube para video.";
    }
    return null;
  }

  // Audio warnings no longer needed (always from Storage)
  return null;
};
