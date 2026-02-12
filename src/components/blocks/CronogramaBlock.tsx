import { useState } from "react";
import { Maximize2, Download } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CronogramaBlockProps {
  config: Record<string, any>;
}

const CronogramaBlock = ({ config }: CronogramaBlockProps) => {
  const { schedule_image_url, schedule_pdf_url, allow_fullscreen = true } = config;
  const [fullscreen, setFullscreen] = useState(false);

  if (!schedule_image_url) return null;

  return (
    <>
      <div className="glass-card rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cronograma Semanal</p>
        <img
          src={schedule_image_url}
          alt="Cronograma"
          className="w-full rounded-lg cursor-pointer"
          onClick={() => allow_fullscreen && setFullscreen(true)}
        />
        <div className="flex gap-2">
          {allow_fullscreen && (
            <button
              onClick={() => setFullscreen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-muted text-sm text-foreground font-medium"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Pantalla completa
            </button>
          )}
          {schedule_pdf_url && (
            <a
              href={schedule_pdf_url}
              download
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-muted text-sm text-foreground font-medium"
            >
              <Download className="w-3.5 h-3.5" /> Descargar PDF
            </a>
          )}
        </div>
      </div>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-background">
          <img src={schedule_image_url} alt="Cronograma" className="w-full h-full object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CronogramaBlock;
