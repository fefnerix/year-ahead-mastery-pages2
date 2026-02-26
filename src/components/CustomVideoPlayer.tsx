import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

interface CustomVideoPlayerProps {
  src: string;
}

const speeds = [0.5, 1, 1.25, 1.5, 2];

const CustomVideoPlayer = ({ src }: CustomVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(false);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 2000);
    }
  }, [playing]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    const onEnd = () => setPlaying(false);
    const onErr = () => setError(true);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("ended", onEnd);
    v.addEventListener("error", onErr);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("error", onErr);
    };
  }, []);

  useEffect(() => {
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 2000);
    } else {
      setShowControls(true);
      clearTimeout(hideTimer.current);
    }
    return () => clearTimeout(hideTimer.current);
  }, [playing]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.pause();
    else v.play();
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * duration;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  };

  const cycleSpeed = () => {
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const goFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="aspect-video rounded-2xl bg-muted/20 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Video no disponible</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video rounded-2xl overflow-hidden bg-black cursor-pointer group"
      onClick={togglePlay}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      <video ref={videoRef} src={src} preload="metadata" className="w-full h-full object-contain" />

      {/* Center play overlay when paused */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-14 h-14 rounded-full bg-primary/80 flex items-center justify-center">
            <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
          </div>
        </div>
      )}

      {/* Bottom controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Seekbar */}
        <div className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-2" onClick={seek}>
          <div
            className="h-full gold-gradient rounded-full"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="text-white">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <span className="text-[10px] text-white/70 tabular-nums">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          <div className="flex-1" />

          <button onClick={toggleMute} className="text-white">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={cycleSpeed}
            className="text-[10px] font-bold text-white bg-white/20 px-1.5 py-0.5 rounded"
          >
            {speed}x
          </button>

          <button onClick={goFullscreen} className="text-white">
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
