import { useState, useRef } from "react";
import { Upload, Loader2, Check } from "lucide-react";
import { uploadFile } from "@/hooks/useAdmin";

interface FileUploadProps {
  bucket: string;
  accept?: string;
  label: string;
  onUploaded: (url: string) => void;
}

const FileUpload = ({ bucket, accept, label, onUploaded }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(bucket, file);
      onUploaded(url);
      setDone(true);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-primary/50 transition-colors text-sm text-muted-foreground"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : done ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        <span>{label}</span>
      </button>
    </div>
  );
};

export default FileUpload;
