import { useState } from "react";
import { Calendar, Download } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CronogramaBlockProps {
  config: Record<string, any>;
}

const CronogramaBlock = ({ config }: CronogramaBlockProps) => {
  const { schedule_image_url, schedule_pdf_url } = config;
  const [fullscreen, setFullscreen] = useState(false);

  if (!schedule_image_url && !schedule_pdf_url) return null;

  return (
    <>
      <div className="flex gap-2">
        {schedule_image_url && (
          <button
            onClick={() => setFullscreen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass-card text-sm text-foreground font-medium hover:border-primary/30 transition-colors"
          >
            <Calendar className="w-4 h-4 text-primary" /> Ver cronograma
          </button>
        )}
        {schedule_pdf_url && (
          <a
            href={schedule_pdf_url}
            download
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass-card text-sm text-foreground font-medium hover:border-primary/30 transition-colors"
          >
            <Download className="w-4 h-4 text-primary" /> Descargar PDF
          </a>
        )}
      </div>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-background">
          <img src={schedule_image_url} alt="Cronograma" className="w-full h-full object-contain" />
          {schedule_pdf_url && (
            <div className="flex justify-center pt-2">
              <a
                href={schedule_pdf_url}
                download
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-sm text-foreground font-medium"
              >
                <Download className="w-3.5 h-3.5" /> Descargar PDF
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CronogramaBlock;
