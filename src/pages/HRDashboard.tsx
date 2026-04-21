import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Plus, Eye, Send, Trash2, Copy, Check, Loader2, Search, BarChart3, Scale, Users } from "lucide-react";
import { toast } from "sonner";
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
  decision: string | null;
  createdAt: string;
  completedAt: string | null;
}

const DIFFICULTY_LABELS: Record<string, string> = { junior: "初階", mid: "中階", senior: "資深" };
const DECISION_LABELS: Record<string, { label: string; color: string }> = {
  pass: { label: "✓ 通過", color: "bg-green-100 text-green-700" },
  fail: { label: "✗ 不通過", color: "bg-red-100 text-red-700" },
  pending: { label: "⏳ 待定", color: "bg-yellow-100 text-yellow-700" },
};
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "等待中", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "進行中", color: "bg-blue-100 text-blue-700" },
  completed: { label: "已完成", color: "bg-green-100 text-green-700" },
  expired: { label: "已過期", color: "bg-gray-100 text-gray-600" },
};

type StatusFilter = "all" | "pending" | "in_progress" | "completed" | "expired";
type DecisionFilter = "all" | "none" | "pass" | "fail" | "pending";

export default function HRDashboard() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("all");

  useEffect(() => {
    fetch(`${API}/api/interviews`)
      .then((r) => r.json())
      .then(setInterviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteInterview = async (id: string) => {
    if (!confirm("確定刪除這場面試？此操作無法復原。")) return;
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
          toast.info("SMTP 未設定，連結已複製到剪貼簿");
        } else {
          toast.success("邀請信已寄出");
        }
      }
    } catch {
      toast.error("發送失敗");
    } finally {
      setSendingId(null);
    }
  };

  // 統計數字
  const stats = useMemo(() => {
    const total = interviews.length;
    const completed = interviews.filter((i) => i.status === "completed").length;
    const avgScore = completed > 0
      ? Math.round(
          interviews
            .filter((i) => i.report)
            .reduce((sum, i) => sum + (i.report?.overallScore ?? 0), 0) / completed
        )
      : 0;
    const pending = interviews.filter((i) => i.status === "pending" || i.status === "in_progress").length;
    const passed = interviews.filter((i) => i.decision === "pass").length;
    return { total, completed, avgScore, pending, passed };
  }, [interviews]);

  // 篩選
  const filtered = useMemo(() => {
    return interviews.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (decisionFilter === "none" && i.decision) return false;
      if (decisionFilter !== "all" && decisionFilter !== "none" && i.decision !== decisionFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [i.position, i.candidateName ?? "", i.candidateEmail ?? "", ...i.topics].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [interviews, statusFilter, decisionFilter, search]);

  // 未開始超過 3 天且未寄過提醒的（提示 HR 可手動寄提醒）
  const needsReminder = interviews.filter((i) => {
    if (i.status !== "pending") return false;
    if (!i.candidateEmail) return false;
    const daysSince = (Date.now() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 3;
  });

  const sendReminder = async (id: string) => {
    setSendingId(id);
    try {
      const res = await fetch(`${API}/api/email/send-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: id }),
      });
      const data = await res.json();
      if (data.ok) toast.success("提醒信已寄出");
      else toast.info("SMTP 未設定，已複製連結");
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HR 面試管理</h1>
          <p className="text-sm text-muted-foreground">管理所有面試，查看結果</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/compare" className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors">
            <Scale className="h-4 w-4" />
            比較排名
          </Link>
          <Link to="/practice" className="rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors">
            自主練習
          </Link>
          <Link to="/bulk" className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors">
            <Users className="h-4 w-4" />
            批量建立
          </Link>
          <Link to="/create" className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            建立面試
          </Link>
        </div>
      </div>

      {/* 統計卡片 */}
      {interviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              總面試數
            </div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="text-xs text-muted-foreground">已完成</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{stats.completed}</div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="text-xs text-muted-foreground">進行中 / 待面試</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">{stats.pending}</div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="text-xs text-muted-foreground">平均分數</div>
            <div className={cn("text-2xl font-bold mt-1",
              stats.avgScore >= 80 ? "text-green-600" : stats.avgScore >= 60 ? "text-yellow-600" : "text-muted-foreground"
            )}>{stats.avgScore || "—"}</div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="text-xs text-muted-foreground">已通過</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{stats.passed}</div>
          </div>
        </div>
      )}

      {/* 提醒區 */}
      {needsReminder.length > 0 && (
        <div className="rounded-xl border border-orange-300 bg-orange-50/50 p-4 space-y-2">
          <div className="text-sm font-medium text-orange-700">
            ⚠️ {needsReminder.length} 位候選人超過 3 天尚未開始面試
          </div>
          <div className="flex flex-wrap gap-2">
            {needsReminder.slice(0, 5).map((r) => (
              <button
                key={r.id}
                onClick={() => sendReminder(r.id)}
                disabled={sendingId === r.id}
                className="flex items-center gap-1 text-xs rounded-full border border-orange-300 bg-white px-3 py-1 hover:bg-orange-100 transition-colors"
              >
                {sendingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                寄提醒：{r.candidateName ?? r.candidateEmail}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 搜尋與篩選 */}
      {interviews.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜尋職位、候選人姓名、Email 或主題..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-muted-foreground py-1">狀態：</span>
            {(["all", "pending", "in_progress", "completed", "expired"] as StatusFilter[]).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn("rounded-full border px-3 py-1 transition-colors",
                  statusFilter === s ? "border-primary bg-primary/5" : "hover:border-primary/50"
                )}>
                {s === "all" ? "全部" : STATUS_LABELS[s]?.label ?? s}
              </button>
            ))}
            <span className="text-muted-foreground py-1 ml-4">決策：</span>
            {(["all", "none", "pass", "pending", "fail"] as DecisionFilter[]).map((d) => (
              <button key={d} onClick={() => setDecisionFilter(d)}
                className={cn("rounded-full border px-3 py-1 transition-colors",
                  decisionFilter === d ? "border-primary bg-primary/5" : "hover:border-primary/50"
                )}>
                {d === "all" ? "全部" : d === "none" ? "未決策" : DECISION_LABELS[d]?.label ?? d}
              </button>
            ))}
          </div>
        </div>
      )}

      {interviews.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-muted-foreground">還沒有面試紀錄</p>
          <Link to="/create" className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            建立第一場面試
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          沒有符合條件的面試
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((interview) => {
            const st = STATUS_LABELS[interview.status] ?? STATUS_LABELS.pending;
            return (
              <div key={interview.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold">{interview.position}</h3>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", st.color)}>
                        {st.label}
                      </span>
                      {interview.decision && DECISION_LABELS[interview.decision] && (
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", DECISION_LABELS[interview.decision].color)}>
                          {DECISION_LABELS[interview.decision].label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {interview.candidateName ?? "未填姓名"}
                      {interview.candidateEmail && ` · ${interview.candidateEmail}`}
                    </p>
                  </div>
                  {interview.report && (
                    <span className={cn("text-lg font-bold",
                      interview.report.overallScore >= 80 ? "text-green-600" :
                      interview.report.overallScore >= 60 ? "text-yellow-600" : "text-red-600"
                    )}>
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

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {interview.status === "completed" && (
                    <Link to={`/report/${interview.id}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <Eye className="h-3 w-3" />
                      查看報告
                    </Link>
                  )}
                  <button onClick={() => copyLink(interview.token, interview.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    {copiedId === interview.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    {copiedId === interview.id ? "已複製" : "複製連結"}
                  </button>
                  {interview.candidateEmail && !interview.emailSent && (
                    <button onClick={() => sendEmail(interview.id)} disabled={sendingId === interview.id} className="flex items-center gap-1 text-xs text-primary hover:underline">
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
                  <button onClick={() => deleteInterview(interview.id)} className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 ml-auto">
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
