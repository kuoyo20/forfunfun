import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import ReportView from "@/components/ReportView";
import type { InterviewReport as Report, Message } from "@/types/interview";
import { cn } from "@/lib/utils";
import { API } from "@/lib/config";

interface InterviewData {
  id: string;
  position: string;
  difficulty: string;
  candidateName: string | null;
  candidateEmail: string | null;
  status: string;
  decision: string | null;
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

export default function InterviewReportPage() {
  const { id } = useParams();
  const [data, setData] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/interviews/${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const setDecision = async (decision: string) => {
    if (!data) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/interviews/${data.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      setData({ ...data, decision });
    } catch {
      alert("儲存失敗");
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        回到管理頁
      </Link>

      <ReportView
        report={data.report}
        isGenerating={false}
        onReset={() => {}}
        messages={data.messages}
        position={position}
      />

      {/* HR 決策區 */}
      <div className="rounded-xl border-2 bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">HR 決策</h2>

        {data.decision && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">目前決策：</span>
            <span className={cn("rounded-full px-3 py-1 text-sm font-medium",
              data.decision === "pass" ? "bg-green-100 text-green-700" :
              data.decision === "fail" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            )}>
              {data.decision === "pass" ? "✓ 通過" : data.decision === "fail" ? "✗ 不通過" : "⏳ 待定"}
            </span>
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
      </div>

      <Link to="/" className="w-full flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium hover:bg-accent transition-colors">
        回到管理頁
      </Link>
    </div>
  );
}
