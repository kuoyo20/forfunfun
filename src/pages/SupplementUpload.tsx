import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Upload, CheckCircle, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { API } from "@/lib/config";

interface SupplementStatus {
  position: string;
  candidateName: string | null;
  status: string;
  canSupplement: boolean;
  deadline: string | null;
}

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function SupplementUpload() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SupplementStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/interview/${token}/supplement-status`)
      .then((r) => {
        if (!r.ok) throw new Error("not_found");
        return r.json();
      })
      .then(setStatus)
      .catch(() => setError("無效的連結"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleUpload = async (file: File) => {
    if (!token) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/api/interview/${token}/supplement`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "上傳失敗");
        return;
      }
      setUploaded(true);
      setFileName(data.fileName);
    } catch {
      setError("上傳失敗，請重試");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (error && !status) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <p className="text-lg font-medium">{error}</p>
    </div>
  );

  if (!status) return null;

  if (!status.canSupplement) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-4">
      <X className="h-12 w-12 text-muted-foreground" />
      <p className="text-lg font-medium">補件期限已過</p>
      <p className="text-sm text-muted-foreground text-center">
        {status.status === "completed"
          ? "面試完成後 12 小時內可補傳資料，目前已超過期限。"
          : "面試尚未完成，請先完成面試。"}
      </p>
    </div>
  );

  if (uploaded) return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
      <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
      <h1 className="text-2xl font-bold">補充資料已上傳</h1>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        {fileName}
      </div>
      <p className="text-sm text-muted-foreground">HR 將會在報告中看到你的補充資料。</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">補充資料上傳</h1>
        <p className="text-muted-foreground">
          {status.candidateName ? `${status.candidateName} — ` : ""}{status.position}
        </p>
        {status.deadline && (
          <p className="text-sm text-orange-600">
            截止時間：{formatDeadline(status.deadline)}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors",
          uploading ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50"
        )}
        onClick={() => document.getElementById("supplement-input")?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">上傳中...</span>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">點擊或拖曳檔案至此處</span>
            <span className="text-xs text-muted-foreground">支援 PDF、Word、TXT（上限 10MB）</span>
          </>
        )}
        <input
          id="supplement-input"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        你可以上傳作品集、補充說明、專案連結等任何想補充給 HR 的資料。
      </p>
    </div>
  );
}
