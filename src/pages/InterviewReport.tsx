import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Send, Mail, StickyNote, Printer } from "lucide-react";
import ReportView from "@/components/ReportView";
import type { InterviewReport as Report, Message } from "@/types/interview";
import { cn } from "@/lib/utils";
import { API } from "@/lib/config";
import { toast } from "sonner";

interface InterviewData {
  id: string;
  position: string;
  difficulty: string;
  candidateName: string | null;
  candidateEmail: string | null;
  status: string;
  decision: string | null;
  candidateNotifiedAt: string | null;
  candidateNotifiedDecision: string | null;
  hrNote: string | null;
  messages: Message[];
  report: Report | null;
  durationSec: number | null;
  createdAt: string;
  completedAt: string | null;
}

const DECISIONS = [
  { value: "pass", label: "通過，安排下一輪", icon: CheckCircle, color: "bg-green-600 hover:bg-green-700 text-white" },
  { value: "pending", label: "待定，需再評估", icon: Clock, color: "bg-yellow-500 hover:bg-yellow-600 text-white" },
  { value: "fail", label: "不通過", icon: XCircle, color: "bg-red-600 hover:bg-red-700 text-white" },
] as const;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function InterviewReportPage() {
  const { id } = useParams();
  const [data, setData] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/interviews/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setNote(d.hrNote ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const applyDecision = async (decision: string, sendEmail: boolean) => {
    if (!data) return;
    setSaving(true);
    setPendingDecision(null);
    try {
      const res = await fetch(`${API}/api/interviews/${data.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, sendEmail }),
      });
      const result = await res.json();
      setData({
        ...data,
        decision,
        candidateNotifiedAt: result.emailSent ? new Date().toISOString() : data.candidateNotifiedAt,
        candidateNotifiedDecision: result.emailSent ? decision : data.candidateNotifiedDecision,
      });
      if (result.emailSent) {
        toast.success(`已儲存決策並寄送通知信給候選人`);
      } else if (decision === "pending") {
        toast.success("已儲存為待定狀態");
      } else {
        toast.success("已儲存決策");
      }
    } catch {
      toast.error("儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const setDecision = (decision: string) => {
    if (!data) return;
    // 已通知過不再彈確認
    if (data.candidateNotifiedAt || decision === "pending" || !data.candidateEmail) {
      applyDecision(decision, false);
      return;
    }
    setPendingDecision(decision);
  };

  const resendNotification = async () => {
    if (!data) return;
    setResending(true);
    try {
      const res = await fetch(`${API}/api/interviews/${data.id}/resend-notification`, {
        method: "POST",
      });
      if (res.ok) {
        setData({
          ...data,
          candidateNotifiedAt: new Date().toISOString(),
          candidateNotifiedDecision: data.decision,
        });
        toast.success("通知信已重新寄送");
      } else {
        const err = await res.json();
        toast.error(err.error ?? "寄送失敗");
      }
    } finally {
      setResending(false);
    }
  };

  const saveNote = async () => {
    if (!data) return;
    setNoteSaving(true);
    try {
      await fetch(`${API}/api/interviews/${data.id}/note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hrNote: note.trim() || null }),
      });
      setData({ ...data, hrNote: note.trim() || null });
      toast.success("備註已儲存");
    } catch {
      toast.error("儲存失敗");
    } finally {
      setNoteSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!data || !data.report) return (
    <div className="text-center py-24 text-muted-foreground">找不到面試報告</div>
  );

  const position = data.candidateName ? `${data.candidateName} · ${data.position}` : data.position;
  const notifiedDecisionLabel = data.candidateNotifiedDecision === "pass" ? "通過通知" : "不通過通知";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          回到管理頁
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
        >
          <Printer className="h-4 w-4" />
          列印 / 匯出 PDF
        </button>
      </div>

      <ReportView
        report={data.report}
        isGenerating={false}
        onReset={() => {}}
        messages={data.messages}
        position={position}
      />

      {/* HR 備註 */}
      <div className="rounded-xl border bg-card p-5 space-y-3 print:hidden">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          HR 內部備註
          <span className="text-xs font-normal text-muted-foreground">（候選人看不到）</span>
        </h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="記下你對這位候選人的想法..."
          className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex justify-end">
          <button
            onClick={saveNote}
            disabled={noteSaving || note === (data.hrNote ?? "")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              note === (data.hrNote ?? "") ? "text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {noteSaving ? "儲存中..." : "儲存備註"}
          </button>
        </div>
      </div>

      {/* HR 決策區 */}
      <div className="rounded-xl border-2 bg-card p-6 space-y-4 print:hidden">
        <h2 className="text-lg font-semibold">HR 決策</h2>

        {data.decision && (
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-muted-foreground">目前決策：</span>
            <span className={cn("rounded-full px-3 py-1 text-sm font-medium",
              data.decision === "pass" ? "bg-green-100 text-green-700" :
              data.decision === "fail" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            )}>
              {data.decision === "pass" ? "✓ 通過" : data.decision === "fail" ? "✗ 不通過" : "⏳ 待定"}
            </span>
            {data.candidateNotifiedAt && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs">
                <Mail className="h-3 w-3" />
                已寄送{notifiedDecisionLabel}（{formatDateTime(data.candidateNotifiedAt)}）
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {DECISIONS.map((d) => {
            const Icon = d.icon;
            const isActive = data.decision === d.value;
            return (
              <button
                key={d.value}
                onClick={() => setDecision(d.value)}
                disabled={saving}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                  isActive ? d.color + " ring-2 ring-offset-2 ring-current" : "border hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                {d.label}
              </button>
            );
          })}
        </div>

        {/* 重寄通知按鈕 */}
        {data.decision && data.decision !== "pending" && data.candidateEmail && data.candidateNotifiedAt && (
          <button
            onClick={resendNotification}
            disabled={resending}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {resending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            重新寄送通知信
          </button>
        )}

        {!data.candidateEmail && (
          <p className="text-xs text-muted-foreground">
            ⚠️ 候選人沒有 Email，無法自動寄送通知
          </p>
        )}
      </div>

      {/* 寄信確認對話框 */}
      {pendingDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl border bg-card p-6 shadow-lg max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-semibold">
              {pendingDecision === "pass" ? "確認通過並通知候選人" : "確認不通過並通知候選人"}
            </h3>
            <p className="text-sm text-muted-foreground">
              系統會自動寄一封{pendingDecision === "pass" ? "通過" : "婉拒"}通知信給 <strong>{data.candidateEmail}</strong>，確定要寄送嗎？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPendingDecision(null)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => applyDecision(pendingDecision, false)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                只存決策，暫不寄信
              </button>
              <button
                onClick={() => applyDecision(pendingDecision, true)}
                className={cn("rounded-lg px-4 py-2 text-sm font-medium text-white",
                  pendingDecision === "pass" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                )}
              >
                <Send className="h-4 w-4 inline mr-1" />
                儲存並寄送通知
              </button>
            </div>
          </div>
        </div>
      )}

      <Link to="/" className="w-full flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium hover:bg-accent transition-colors print:hidden">
        回到管理頁
      </Link>
    </div>
  );
}
