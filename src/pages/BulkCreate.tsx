import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, Copy, Check, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadTemplates, type InterviewTemplate } from "@/lib/templates";
import { toast } from "sonner";
import { API } from "@/lib/config";

interface CandidateRow {
  file: File;
  name: string;
  email: string;
  status: "pending" | "uploading" | "done" | "error";
  token?: string;
  link?: string;
  error?: string;
}

const TOPIC_OPTIONS = [
  "JavaScript", "TypeScript", "React", "Node.js",
  "系統設計", "資料結構", "演算法", "CSS", "測試", "DevOps",
];

export default function BulkCreate() {
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [selectedTplId, setSelectedTplId] = useState<string>("");
  const [position, setPosition] = useState("");
  const [difficulty, setDifficulty] = useState("mid");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [timeLimitMin, setTimeLimitMin] = useState(15);
  const [perQuestionSec, setPerQuestionSec] = useState(180);
  const [linkValidDays, setLinkValidDays] = useState(7);
  const [jdText, setJdText] = useState("");
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => { setTemplates(loadTemplates()); }, []);

  const applyTemplate = (id: string) => {
    setSelectedTplId(id);
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setPosition(t.position);
    setDifficulty(t.difficulty);
    setSelectedTopics(t.topics);
    setMaxQuestions(t.maxQuestions);
    setTimeLimitMin(t.timeLimitMin);
    setPerQuestionSec(t.perQuestionSec);
    setLinkValidDays(t.linkValidDays);
    if (t.jdText) setJdText(t.jdText);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const rows: CandidateRow[] = Array.from(files).map((file) => ({
      file,
      name: file.name.replace(/\.(pdf|docx?|txt)$/i, ""),
      email: "",
      status: "pending",
    }));
    setCandidates((prev) => [...prev, ...rows]);
  };

  const updateCandidate = (idx: number, patch: Partial<CandidateRow>) => {
    setCandidates((prev) => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  };

  const removeCandidate = (idx: number) => {
    setCandidates((prev) => prev.filter((_, i) => i !== idx));
  };

  const processAll = async () => {
    if (!position.trim() || selectedTopics.length === 0 || candidates.length === 0) {
      toast.error("請先填寫職位、選擇主題、並至少上傳一份履歷");
      return;
    }
    setProcessing(true);

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (c.status === "done") continue;

      updateCandidate(i, { status: "uploading" });

      try {
        // 先上傳履歷取得解析文字
        const fd = new FormData();
        fd.append("file", c.file);
        const uploadRes = await fetch(`${API}/api/upload`, { method: "POST", body: fd });
        const uploadData = await uploadRes.json();

        // 建立面試
        const createRes = await fetch(`${API}/api/interviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            position: position.trim(),
            difficulty,
            maxQuestions,
            timeLimitMin,
            perQuestionSec,
            linkValidDays,
            topics: selectedTopics,
            candidateName: c.name.trim() || null,
            candidateEmail: c.email.trim() || null,
            resumeText: uploadData.text,
            resumeFileName: uploadData.fileName,
            jdText: jdText || null,
            jdFileName: jdText ? "批量建立的 JD" : null,
          }),
        });
        const data = await createRes.json();
        const link = `${window.location.origin}/interview/${data.token}`;
        updateCandidate(i, { status: "done", token: data.token, link });
      } catch {
        updateCandidate(i, { status: "error", error: "建立失敗" });
      }
    }

    setProcessing(false);
    toast.success("批量建立完成");
  };

  const sendAllEmails = async () => {
    const ready = candidates.filter((c) => c.status === "done" && c.email);
    if (ready.length === 0) {
      toast.error("沒有含 email 且已建立成功的候選人");
      return;
    }
    setProcessing(true);
    let sent = 0;
    for (const c of candidates) {
      if (c.status !== "done" || !c.email || !c.token) continue;
      try {
        // 透過 token 找 id，實際 API 是用 id 寄信，所以要從 response 拿 id
        // 簡化作法：直接呼叫 email 端點用 interview id。不過目前 rows 只存 token。
        // 這裡我們透過 token 先取得 id：
        const statusRes = await fetch(`${API}/api/interview/${c.token}`);
        if (!statusRes.ok) continue;
        const statusData = await statusRes.json();
        await fetch(`${API}/api/email/send-invite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId: statusData.id }),
        });
        sent += 1;
      } catch { /* ignore */ }
    }
    setProcessing(false);
    toast.success(`已寄送 ${sent} 封邀請信`);
  };

  const copyLink = (idx: number, link?: string) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">批量建立面試</h1>
          <p className="text-sm text-muted-foreground">一次上傳多份履歷，套用同一組設定產生面試連結</p>
        </div>
      </div>

      {/* 範本選擇 */}
      {templates.length > 0 && (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">套用範本（選填）</label>
          <select
            value={selectedTplId}
            onChange={(e) => applyTemplate(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— 自行設定 —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* 共用設定 */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">所有候選人共用的設定</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium">應徵職位</label>
          <input
            type="text" required placeholder="例如：資深前端工程師"
            value={position} onChange={(e) => setPosition(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">難度</label>
          <div className="flex gap-2">
            {["junior", "mid", "senior"].map((d) => (
              <button key={d} type="button" onClick={() => setDifficulty(d)}
                className={cn("flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                  difficulty === d ? "border-primary bg-primary/5" : "hover:border-primary/50"
                )}>
                {d === "junior" ? "初階" : d === "mid" ? "中階" : "資深"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">主題</label>
          <div className="flex flex-wrap gap-2">
            {TOPIC_OPTIONS.map((topic) => (
              <button key={topic} type="button" onClick={() => toggleTopic(topic)}
                className={cn("rounded-full px-3 py-1 text-sm border transition-colors",
                  selectedTopics.includes(topic) ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50"
                )}>
                {topic}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium">題數</label>
            <select value={maxQuestions} onChange={(e) => setMaxQuestions(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
              {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} 題</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">整場時間</label>
            <select value={timeLimitMin} onChange={(e) => setTimeLimitMin(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
              {[10, 15, 20, 30, 45, 60].map((n) => <option key={n} value={n}>{n} 分</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">每題</label>
            <select value={perQuestionSec} onChange={(e) => setPerQuestionSec(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
              {[60, 120, 180, 240, 300].map((n) => <option key={n} value={n}>{n / 60} 分</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">連結有效</label>
            <select value={linkValidDays} onChange={(e) => setLinkValidDays(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
              {[1, 3, 7, 14, 30].map((n) => <option key={n} value={n}>{n} 天</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">職缺說明（選填，套用到所有候選人）</label>
          <textarea
            value={jdText} onChange={(e) => setJdText(e.target.value)}
            placeholder="貼上或輸入職位說明..."
            className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y"
          />
        </div>
      </div>

      {/* 履歷上傳 + 候選人列表 */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">候選人名單</h2>

        <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary/50 transition-colors">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">批量上傳履歷（可多選）</span>
          <input
            type="file" multiple accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </label>

        {candidates.length > 0 && (
          <div className="space-y-2">
            {candidates.map((c, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{c.file.name}</span>
                  </div>
                  <button
                    onClick={() => removeCandidate(i)}
                    disabled={processing}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text" placeholder="候選人姓名"
                    value={c.name} onChange={(e) => updateCandidate(i, { name: e.target.value })}
                    disabled={processing}
                    className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                  />
                  <input
                    type="email" placeholder="Email（選填）"
                    value={c.email} onChange={(e) => updateCandidate(i, { email: e.target.value })}
                    disabled={processing}
                    className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                  />
                </div>
                {c.status === "uploading" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    建立中...
                  </div>
                )}
                {c.status === "done" && c.link && (
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-3 w-3 text-green-500" />
                    <input readOnly value={c.link} className="flex-1 rounded border bg-muted px-2 py-1 text-xs" />
                    <button
                      onClick={() => copyLink(i, c.link)}
                      className="rounded border px-2 py-1 hover:bg-accent transition-colors"
                    >
                      {copiedIdx === i ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                )}
                {c.status === "error" && (
                  <div className="text-xs text-destructive">❌ {c.error}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {candidates.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={processAll}
              disabled={processing}
              className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `建立 ${candidates.filter(c => c.status !== "done").length} 筆面試`}
            </button>
            {candidates.some((c) => c.status === "done" && c.email) && (
              <button
                onClick={sendAllEmails}
                disabled={processing}
                className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                寄送邀請信給有 Email 的候選人
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
