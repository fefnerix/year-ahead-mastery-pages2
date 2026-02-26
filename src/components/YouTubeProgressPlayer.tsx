import { useState, useRef, useEffect, useCallback, useId } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface YouTubeProgressPlayerProps {
  videoId: string;
}

const speeds = [0.5, 1, 1.25, 1.5, 2];

// Load YouTube IFrame API once globally
let apiPromise: Promise<void> | null = null;
function loadYTApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return apiPromise;
}

const YouTubeProgressPlayer = ({ videoId }: YouTubeProgressPlayerProps) => {
  const uniqueId = useId().replace(/:/g, "");
  const elId = `yt-${uniqueId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(false);

  // Init player
  useEffect(() => {
    let destroyed = false;
    loadYTApi().then(() => {
      if (destroyed) return;
      playerRef.current = new YT.Player(elId, {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (!destroyed) setReady(true);
          },
          onStateChange: (e) => {
            if (destroyed) return;
            setPlaying(e.data === YT.PlayerState.PLAYING);
          },
          onError: () => {
            if (!destroyed) setError(true);
          },
        },
      });
    });
    return () => {
      destroyed = true;
      playerRef.current?.destroy();
    };
  }, [videoId, elId]);

  // Polling
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        setCurrentTime(p.getCurrentTime());
        setDuration(p.getDuration());
        setPlaying(p.getPlayerState() === YT.PlayerState.PLAYING);
      } catch {}
    }, 250);
    return () => clearInterval(id);
  }, [ready]);

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  }, [playing]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const p = playerRef.current;
    if (!p || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    p.seekTo(pct * duration, true);
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) { p.unMute(); setMuted(false); }
    else { p.mute(); setMuted(true); }
  };

  const cycleSpeed = () => {
    const p = playerRef.current;
    if (!p) return;
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    p.setPlaybackRate(next);
    setSpeed(next);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const keys = ["Space", "KeyK", "KeyJ", "KeyL", "KeyF", "KeyM", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (keys.includes(e.code)) {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === "Space" || e.code === "KeyK") togglePlay();
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="premium-card rounded-[20px] p-6 flex flex-col items-center justify-center gap-2">
        <Play className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Video no disponible</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="premium-card rounded-[20px] overflow-hidden outline-none"
    >
      {/* Video area */}
      <div className="relative aspect-video bg-black">
        {!ready && (
          <Skeleton className="absolute inset-0 rounded-none" />
        )}
        <div id={elId} className="w-full h-full" style={{ pointerEvents: "none" }} />
        {/* Overlay / pelicula */}
        <div
          className="absolute inset-0 z-10 cursor-pointer"
          style={{ pointerEvents: "auto", background: "transparent" }}
          onClick={togglePlay}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Center play icon when paused */}
          {!playing && ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center opacity-90">
                <Play className="w-7 h-7 text-primary-foreground ml-1" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls bar */}
      <div className="px-3 py-2.5 flex items-center gap-2.5">
        <button onClick={togglePlay} className="shrink-0 w-9 h-9 rounded-full gold-gradient flex items-center justify-center">
          {playing ? (
            <Pause className="w-4 h-4 text-primary-foreground" />
          ) : (
            <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
          )}
        </button>

        {/* Seekbar */}
        <div className="flex-1 space-y-0.5">
          <div className="w-full h-1 bg-muted rounded-full cursor-pointer group" onClick={seek}>
            <div
              className="h-full gold-gradient rounded-full transition-all relative"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        <button onClick={toggleMute} className="text-muted-foreground shrink-0">
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={cycleSpeed}
          className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg shrink-0"
        >
          {speed}x
        </button>

        <button onClick={toggleFullscreen} className="text-muted-foreground shrink-0">
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default YouTubeProgressPlayer;
