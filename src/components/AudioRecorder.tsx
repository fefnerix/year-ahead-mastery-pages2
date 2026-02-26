import { useState, useRef, useEffect } from "react";
import { Mic, Square, Upload, Loader2, Check } from "lucide-react";
import { uploadFile } from "@/hooks/useAdmin";
import FileUpload from "@/components/FileUpload";

interface AudioRecorderProps {
  bucket: string;
  pathPrefix: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
}

const AudioRecorder = ({ bucket, pathPrefix, currentUrl, onUploaded }: AudioRecorderProps) => {
  const [tab, setTab] = useState<"record" | "upload">("record");
  const [recording, setRecording] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const getMimeType = () => {
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
    if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
    return "audio/webm";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = getMimeType();
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mime });
        setBlob(b);
        setBlobUrl(URL.createObjectURL(b));
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setElapsed(0);
      setBlobUrl(null);
      setBlob(null);
      timerRef.current = window.setInterval(() => setElapsed((p) => p + 1), 1000);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const saveRecording = async () => {
    if (!blob) return;
    setUploading(true);
    try {
      const ext = blob.type.includes("mp4") ? "m4a" : "webm";
      const id = crypto.randomUUID();
      const path = `${pathPrefix}/${id}.${ext}`;
      const file = new File([blob], `${id}.${ext}`, { type: blob.type });
      const url = await uploadFile(bucket, file, path);
      onUploaded(url);
      setBlobUrl(null);
      setBlob(null);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const tabClass = (active: boolean) =>
    `flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-colors ${active ? "gold-gradient text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <div className="space-y-2">
      {/* Current audio preview */}
      {currentUrl && !blobUrl && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">Audio actual:</p>
          <audio src={currentUrl} controls className="w-full h-8" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        <button onClick={() => setTab("record")} className={tabClass(tab === "record")}>
          <Mic className="w-3 h-3 inline mr-1" /> Grabar
        </button>
        <button onClick={() => setTab("upload")} className={tabClass(tab === "upload")}>
          <Upload className="w-3 h-3 inline mr-1" /> Subir archivo
        </button>
      </div>

      {tab === "record" && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {!recording ? (
              <button
                onClick={startRecording}
                className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center shrink-0"
              >
                <Mic className="w-4 h-4 text-primary-foreground" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center shrink-0"
              >
                <Square className="w-4 h-4 text-destructive-foreground" />
              </button>
            )}
            {recording && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm text-foreground tabular-nums">{fmtTime(elapsed)}</span>
              </div>
            )}
          </div>

          {blobUrl && (
            <div className="space-y-2">
              <audio src={blobUrl} controls className="w-full h-8" />
              <button
                onClick={saveRecording}
                disabled={uploading}
                className="w-full py-2 rounded-lg gold-gradient font-bold text-primary-foreground text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar audio
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "upload" && (
        <FileUpload bucket={bucket} accept="audio/*" label="Subir archivo de audio" onUploaded={onUploaded} />
      )}
    </div>
  );
};

export default AudioRecorder;
