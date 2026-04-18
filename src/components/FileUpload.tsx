import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, FileText, X, Loader2 } from "lucide-react";

interface FileUploadProps {
  label: string;
  accept?: string;
  onUploaded: (data: { fileName: string; text: string }) => void;
}

import { API } from "@/lib/config";

export default function FileUpload({ label, accept = ".pdf,.doc,.docx,.txt", onUploaded }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/api/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("上傳失敗");
      const data = await res.json();
      setFileName(data.fileName);
      onUploaded({ fileName: data.fileName, text: data.text });
    } catch {
      setError("檔案上傳失敗，請重試");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onUploaded({ fileName: "", text: "" });
  };

  if (fileName) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium">{fileName}</span>
        </div>
        <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
          uploading ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">上傳中...</span>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">點擊或拖曳檔案至此處</span>
            <span className="text-xs text-muted-foreground">支援 PDF、Word、TXT</span>
          </>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
