import { useState } from "react";
import { useAnnouncements, useAnnouncementReads, useMarkRead } from "@/hooks/useAnnouncements";
import { Bell, ChevronDown, ChevronUp, X } from "lucide-react";

const AnnouncementBanner = () => {
  const { data: announcements = [] } = useAnnouncements();
  const { data: readIds = new Set() } = useAnnouncementReads();
  const markRead = useMarkRead();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const pinnedAnnouncements = announcements.filter(
    (a) => a.pinned && !dismissed.has(a.id)
  );
  const unreadCount = announcements.filter((a) => !readIds.has(a.id)).length;

  if (pinnedAnnouncements.length === 0 && unreadCount === 0) return null;

  return (
    <div className="space-y-2">
      {pinnedAnnouncements.map((a) => {
        const isExpanded = expandedId === a.id;
        const isUnread = !readIds.has(a.id);

        return (
          <div
            key={a.id}
            className="glass-card gold-border rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="relative mt-0.5">
                <Bell className="w-4 h-4 text-primary" />
                {isUnread && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : a.id);
                    if (isUnread) markRead.mutate(a.id);
                  }}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <p className="text-sm text-secondary-foreground mt-2 whitespace-pre-wrap">{a.body}</p>
                )}
              </div>
              <button
                onClick={() => setDismissed((prev) => new Set(prev).add(a.id))}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {unreadCount > 0 && pinnedAnnouncements.length === 0 && (
        <div className="glass-card rounded-xl p-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            Tienes {unreadCount} comunicado{unreadCount > 1 ? "s" : ""} sin leer
          </span>
        </div>
      )}
    </div>
  );
};

export default AnnouncementBanner;
