import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Plus, Eye, Send, Trash2, Copy, Check, Loader2 } from "lucide-react";

import { API } from "@/lib/config";

interface Interview {
  id: string;
  position: string;
  difficulty: string;
  candidateName: string | null;
  candidateEmail: string | null;
  token: string;
  status: string;
  emailSent: boolean;
  topics: string[];
  report: { overallScore: number } | null;
  createdAt: string;
  completedAt: string | null;
}

const DIFFICULTY_LABELS: Record<string, string> = { junior: "初階", mid: "中階", senior: "資深" };
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "等待中", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "進行中", color: "bg-blue-100 text-blue-700" },
  completed: { label: "已完成", color: "bg-green-100 text-green-700" },
};

export default function HRDashboard() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/interviews`)
      .then((r) => r.json())
      .then(setInterviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteInterview = async (id: string) => {
    await fetch(`${API}/api/interviews/${id}`, { method: "DELETE" });
    setInterviews((prev) => prev.filter((i) => i.id !== id));
  };

  const copyLink = (token: string, id: string) => {
    const link = `${window.location.origin}/interview/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendEmail = async (id: string) => {
    setSendingId(id);
    try {
      const res = await fetch(`${API}/api/email/send-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: id }),
      });
      const data = await res.json();
      if (data.link) {
        setInterviews((prev) =>
          prev.map((i) => (i.id === id ? { ...i, emailSent: true } : i))
        );
        if (!data.ok) {
          navigator.clipboard.writeText(data.link);
          alert("SMTP 未設定，已將面試連結複製到剪貼簿！");
        }
      }
    } catch {
      alert("發送失敗");
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HR 面試管理</h1>
          <p className="text-sm text-muted-foreground">管理所有面試，查看結果</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/practice"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            自主練習
          </Link>
          <Link
            to="/create"
            className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            建立面試
          </Link>
        </div>
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-muted-foreground">還沒有面試紀錄</p>
          <Link
            to="/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            建立第一場面試
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => {
            const st = STATUS_LABELS[interview.status] ?? STATUS_LABELS.pending;
            return (
              <div key={interview.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{interview.position}</h3>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", st.color)}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {interview.candidateName ?? "未填姓名"}
                      {interview.candidateEmail && ` · ${interview.candidateEmail}`}
                    </p>
                  </div>
                  {interview.report && (
                    <span
                      className={cn(
                        "text-lg font-bold",
                        interview.report.overallScore >= 80 ? "text-green-600" :
                        interview.report.overallScore >= 60 ? "text-yellow-600" : "text-red-600"
                      )}
                    >
                      {interview.report.overallScore}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {DIFFICULTY_LABELS[interview.difficulty] ?? interview.difficulty}
                  </span>
                  {interview.topics.map((t) => (
                    <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t}</span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {interview.status === "completed" && (
                    <Link
                      to={`/report/${interview.id}`}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Eye className="h-3 w-3" />
                      查看報告
                    </Link>
                  )}
                  <button
                    onClick={() => copyLink(interview.token, interview.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {copiedId === interview.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    {copiedId === interview.id ? "已複製" : "複製連結"}
                  </button>
                  {interview.candidateEmail && !interview.emailSent && (
                    <button
                      onClick={() => sendEmail(interview.id)}
                      disabled={sendingId === interview.id}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {sendingId === interview.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      寄送邀請
                    </button>
                  )}
                  {interview.emailSent && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Check className="h-3 w-3" />
                      已寄送
                    </span>
                  )}
                  <button
                    onClick={() => deleteInterview(interview.id)}
                    className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                    刪除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
