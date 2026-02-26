import { useState } from "react";
import { BookOpen, Target, Check } from "lucide-react";
import { TaskWithCheck } from "@/hooks/useDayTasks";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import AudioPlayer from "@/components/AudioPlayer";
import { isYouTubeUrl, getYouTubeId } from "@/lib/media-utils";

interface DailyItemCardProps {
  task: TaskWithCheck | null;
  type: "prayer" | "activity";
  onToggle: (id: string) => void;
}

const DailyItemCard = ({ task, type, onToggle }: DailyItemCardProps) => {
  const [open, setOpen] = useState(false);

  const isPrayer = type === "prayer";
  const icon = isPrayer ? <BookOpen className="w-4 h-4" /> : <Target className="w-4 h-4" />;
  const label = isPrayer ? "Oración del día" : "Tarea del día";
  const emoji = isPrayer ? "🙏🏼" : "🔥";

  // Type-specific accent colors
  const accentColor = isPrayer
    ? "bg-violet-400/50"
    : "bg-amber-400/50";
  const iconColor = isPrayer ? "text-violet-400" : "text-amber-400";
  const labelColor = isPrayer ? "text-violet-300" : "text-amber-300";

  if (!task) {
    return (
      <div className="glass-card rounded-2xl p-4 border border-muted/30">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-muted/30`}>
            <span className="text-base">{emoji}</span>
          </div>
          <p className="text-xs text-muted-foreground">{label} — No disponible</p>
        </div>
      </div>
    );
  }

  const isCompleted = task.completed;

  return (
    <>
      <div
        className={`relative glass-card rounded-2xl border overflow-hidden transition-all duration-200 press-scale ${
          isCompleted
            ? "border-success/30 bg-success/5"
            : "border-primary/10 hover:border-primary/25"
        }`}
      >
        {/* Left accent bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-[3px] ${
            isCompleted ? "bg-success/70" : accentColor
          }`}
        />

        {/* Main tap area → opens drawer */}
        <button
          onClick={() => setOpen(true)}
          className="w-full pl-5 pr-14 py-4 text-left"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`${isCompleted ? "text-success" : iconColor}`}>{icon}</span>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isCompleted ? "text-success" : labelColor}`}>
              {emoji} {label}
            </p>
            {!isPrayer && task.category && (
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground capitalize">
                {task.category}
              </span>
            )}
          </div>
          <p
            className={`text-sm font-semibold leading-snug ${
              isCompleted ? "text-foreground/60 line-through" : "text-foreground"
            }`}
          >
            {task.title}
          </p>
        </button>

        {/* Inline toggle button */}
        <div
          role="button"
          aria-label={isCompleted ? "Desmarcar tarea" : "Marcar como completada"}
          aria-pressed={isCompleted}
          onClick={() => onToggle(task.id)}
          className={`absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 press-scale ${
            isCompleted
              ? "bg-success/20 border-success/60"
              : "bg-white/5 border-white/15 hover:border-primary/40"
          }`}
        >
          <Check
            className={`w-4 h-4 transition-all duration-200 ${
              isCompleted ? "text-success scale-100" : "text-muted-foreground/40 scale-75"
            }`}
          />
        </div>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center gap-2 justify-center">
              <span className={isCompleted ? "text-success" : iconColor}>{icon}</span>
              <DrawerTitle>{label}</DrawerTitle>
            </div>
            {!isPrayer && task.category && (
              <span className="mx-auto mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                {task.category}
              </span>
            )}
          </DrawerHeader>
          <div className="px-6 pb-2 space-y-3">
            {/* 1. Title */}
            <p className="text-base font-semibold text-foreground">{task.title}</p>

            {/* 2. Image */}
            {task.media_image_url && (
              <img src={task.media_image_url} alt="" className="w-full rounded-xl" loading="lazy" />
            )}

            {/* 3. Video */}
            {task.media_video_url && (() => {
              const ytId = getYouTubeId(task.media_video_url!);
              return ytId ? (
                <div className="space-y-1">
                  <div className="aspect-video rounded-xl overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?modestbranding=1&rel=0&showinfo=0`}
                      title="Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 text-center">
                    Video via YouTube
                  </p>
                </div>
              ) : (
                <CustomVideoPlayer src={task.media_video_url!} />
              );
            })()}

            {/* 4. Audio */}
            {task.media_audio_url && (
              <AudioPlayer src={task.media_audio_url} />
            )}

            {/* 5. Description (text) */}
            {task.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
            )}
          </div>
          <DrawerFooter>
            <button
              onClick={() => {
                onToggle(task.id);
                setOpen(false);
              }}
              className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 press-scale ${
                isCompleted
                  ? "bg-success/15 text-success border border-success/30"
                  : "gold-gradient text-primary-foreground gold-glow"
              }`}
            >
              <Check className="w-4 h-4" />
              {isCompleted ? "Completada — Desmarcar" : "Marcar como hecha"}
            </button>
            <DrawerClose asChild>
              <button className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cerrar
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default DailyItemCard;
