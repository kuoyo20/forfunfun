import type { InterviewReport, Message } from "@/types/interview";
import { cn } from "@/lib/utils";
import { RotateCcw, Loader2 } from "lucide-react";

interface ReportViewProps {
  report: InterviewReport | null;
  isGenerating: boolean;
  onReset: () => void;
  messages: Message[];
  position: string;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-green-500"
      : score >= 60
        ? "bg-yellow-500"
        : "bg-red-500";
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className={cn("h-2 rounded-full transition-all", color)}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export default function ReportView({
  report,
  isGenerating,
  onReset,
  messages,
  position,
}: ReportViewProps) {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating your interview report...</p>
      </div>
    );
  }

  if (!report) return null;

  const totalMessages = messages.filter((m) => m.role === "user").length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Interview Report</h1>
        <p className="text-muted-foreground">
          {position} — {totalMessages} questions answered
        </p>
      </div>

      {/* Overall Score */}
      <div className="rounded-xl border bg-card p-6 text-center space-y-3">
        <div className="text-5xl font-bold">{report.overallScore}</div>
        <div className="text-sm text-muted-foreground">Overall Score</div>
        <ScoreBar score={report.overallScore} />
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-green-600">Strengths</h2>
          <ul className="space-y-1.5">
            {report.strengths.map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-red-500">Areas to Improve</h2>
          <ul className="space-y-1.5">
            {report.weaknesses.map((w, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-red-400 mt-0.5">-</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">Recommendations</h2>
        <ul className="space-y-1.5">
          {report.recommendations.map((r, i) => (
            <li key={i} className="text-sm text-muted-foreground">
              {i + 1}. {r}
            </li>
          ))}
        </ul>
      </div>

      {/* Question Breakdown */}
      {report.questionBreakdown.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Question Breakdown</h2>
          {report.questionBreakdown.map((qb, i) => (
            <div key={i} className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Q{i + 1}</span>
                <span className="text-sm font-mono">{qb.score}/100</span>
              </div>
              <ScoreBar score={qb.score} />
              <p className="text-xs text-muted-foreground">{qb.feedback}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
      >
        <RotateCcw className="h-4 w-4" />
        Start New Interview
      </button>
    </div>
  );
}
