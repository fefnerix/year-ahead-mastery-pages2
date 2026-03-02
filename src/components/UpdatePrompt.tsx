import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const CHECK_INTERVAL = 60_000; // check every 60s

const UpdatePrompt = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const checkForUpdate = useCallback(async () => {
    try {
      const res = await fetch(`/?_v=${Date.now()}`, { method: "HEAD", cache: "no-store" });
      const etag = res.headers.get("etag") || res.headers.get("last-modified");
      if (!etag) return;

      const prev = sessionStorage.getItem("app_version_tag");
      if (!prev) {
        sessionStorage.setItem("app_version_tag", etag);
        return;
      }
      if (prev !== etag) {
        setUpdateAvailable(true);
      }
    } catch {
      // network error, ignore
    }
  }, []);

  useEffect(() => {
    const id = setInterval(checkForUpdate, CHECK_INTERVAL);
    // also check on visibility change (user returns to tab)
    const onVisible = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [checkForUpdate]);

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] flex justify-center p-3 pointer-events-none">
      <button
        onClick={() => {
          sessionStorage.removeItem("app_version_tag");
          window.location.reload();
        }}
        className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 animate-in slide-in-from-top-4 duration-300"
      >
        <RefreshCw className="w-4 h-4" />
        Nueva versión disponible — Actualizar
      </button>
    </div>
  );
};

export default UpdatePrompt;
