import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowLeft, Copy, Check, Send, Loader2 } from "lucide-react";
import FileUpload from "@/components/FileUpload";

import { API } from "@/lib/config";

const TOPIC_OPTIONS = [
  "JavaScript", "TypeScript", "React", "Node.js",
  "系統設計", "資料結構", "演算法", "CSS", "測試", "DevOps",
];

const DIFFICULTY_OPTIONS = [
  { value: "junior" as const, label: "初階", description: "0-2 年經驗" },
  { value: "mid" as const, label: "中階", description: "2-5 年經驗" },
  { value: "senior" as const, label: "資深", description: "5 年以上經驗" },
];

export default function CreateInterview() {
  const [position, setPosition] = useState("");
  const [difficulty, setDifficulty] = useState("mid");
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [timeLimitMin, setTimeLimitMin] = useState(15);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [resumeData, setResumeData] = useState<{ fileName: string; text: string } | null>(null);
  const [jdData, setJdData] = useState<{ fileName: string; text: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string; token: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position.trim()) return;
    setCreating(true);

    try {
      const res = await fetch(`${API}/api/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: position.trim(),
          difficulty,
          maxQuestions,
          timeLimitMin,
          topics: selectedTopics,
          candidateName: candidateName.trim() || null,
          candidateEmail: candidateEmail.trim() || null,
          resumeText: resumeData?.text || null,
          resumeFileName: resumeData?.fileName || null,
          jdText: jdData?.text || null,
          jdFileName: jdData?.fileName || null,
        }),
      });
      const data = await res.json();
      const link = `${window.location.origin}/interview/${data.token}`;
      setCreated({ id: data.id, token: data.token, link });
    } catch {
      alert("建立失敗，請確認後端是否運行中");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    if (!created) return;
    navigator.clipboard.writeText(created.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = async () => {
    if (!created) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`${API}/api/email/send-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: created.id }),
      });
      const data = await res.json();
      setEmailSent(true);
      if (!data.ok && data.link) {
        navigator.clipboard.writeText(data.link);
        alert("SMTP 未設定，已將面試連結複製到剪貼簿");
      }
    } catch {
      alert("發送失敗");
    } finally {
      setSendingEmail(false);
    }
  };

  // Success screen
  if (created) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="text-center space-y-2">
          <div className="text-4xl">✅</div>
          <h1 className="text-2xl font-bold">面試已建立</h1>
          <p className="text-sm text-muted-foreground">複製連結或寄送 Email 給候選人</p>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">面試連結</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={created.link}
                className="flex-1 rounded-lg border bg-muted px-3 py-2 text-sm"
              />
              <button
                onClick={copyLink}
                className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "已複製" : "複製"}
              </button>
            </div>
          </div>

          {candidateEmail && (
            <button
              onClick={sendEmail}
              disabled={sendingEmail || emailSent}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                emailSent
                  ? "bg-green-100 text-green-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : emailSent ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {emailSent ? "已寄送" : "寄送面試邀請"}
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setCreated(null); setEmailSent(false); }}
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm hover:bg-accent transition-colors"
          >
            建立另一場面試
          </button>
          <Link
            to="/"
            className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm text-center hover:bg-primary/90 transition-colors"
          >
            回到管理頁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">建立面試</h1>
          <p className="text-sm text-muted-foreground">上傳履歷與職缺說明，建立面試連結</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* 候選人資訊 */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">候選人資訊</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">姓名</label>
              <input
                type="text" placeholder="王小明"
                value={candidateName} onChange={(e) => setCandidateName(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email" placeholder="candidate@email.com"
                value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* 檔案上傳 */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">上傳文件</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUpload
              label="履歷"
              onUploaded={(data) => setResumeData(data.fileName ? data : null)}
            />
            <FileUpload
              label="職位說明書 (JD)"
              onUploaded={(data) => setJdData(data.fileName ? data : null)}
            />
          </div>
        </div>

        {/* 面試設定 */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">面試設定</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium">應徵職位</label>
            <input
              type="text" placeholder="例如：資深前端工程師" required
              value={position} onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">難度等級</label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setDifficulty(opt.value)}
                  className={cn("rounded-lg border p-3 text-left transition-colors", difficulty === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">面試主題</label>
            <div className="flex flex-wrap gap-2">
              {TOPIC_OPTIONS.map((topic) => (
                <button key={topic} type="button" onClick={() => toggleTopic(topic)}
                  className={cn("rounded-full px-3 py-1 text-sm border transition-colors", selectedTopics.includes(topic) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50")}>
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">最大題數</label>
              <select value={maxQuestions} onChange={(e) => setMaxQuestions(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {[5, 10, 15, 20].map((n) => (<option key={n} value={n}>{n} 題</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">時間限制</label>
              <select value={timeLimitMin} onChange={(e) => setTimeLimitMin(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {[10, 15, 20, 30, 45, 60].map((n) => (<option key={n} value={n}>{n} 分鐘</option>))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={creating || !position.trim()}
          className={cn(
            "w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors",
            position.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "建立面試連結"}
        </button>
      </form>
    </div>
  );
}
