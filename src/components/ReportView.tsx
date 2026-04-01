import type { InterviewReport, Message } from "@/types/interview";
import { cn } from "@/lib/utils";
import { RotateCcw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ReportViewProps {
  report: InterviewReport | null;
  isGenerating: boolean;
  onReset: () => void;
  messages: Message[];
  position: string;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div className={cn("h-2 rounded-full transition-all duration-500", color)} style={{ width: `${score}%` }} />
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-600 bg-green-50" : score >= 60 ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", color)}>{score}/100</span>;
}

function QuestionDetail({ qb, index }: { qb: InterviewReport["questionBreakdown"][0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-t pt-3 first:border-t-0 first:pt-0">
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full text-left space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            第 {index + 1} 題
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </span>
          <ScoreBadge score={qb.score} />
        </div>
        <ScoreBar score={qb.score} />
      </button>
      {expanded && (
        <div className="mt-3 space-y-2 text-sm">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-xs font-medium text-muted-foreground mb-1">面試題目</div>
            <p className="text-foreground whitespace-pre-wrap">{qb.question}</p>
          </div>
          <div className="rounded-lg bg-primary/5 p-3">
            <div className="text-xs font-medium text-muted-foreground mb-1">你的回答</div>
            <p className="text-foreground whitespace-pre-wrap">{qb.answer}</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs font-medium text-muted-foreground mb-1">評語</div>
            <p className="text-foreground">{qb.feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportView({ report, isGenerating, onReset, messages, position }: ReportViewProps) {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center space-y-1">
          <p className="font-medium">正在產生面試報告...</p>
          <p className="text-sm text-muted-foreground">分析你的回答中</p>
        </div>
      </div>
    );
  }
  if (!report) return null;

  const totalAnswered = messages.filter((m) => m.role === "user").length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">面試報告</h1>
        <p className="text-muted-foreground">{position} &mdash; 共回答 {totalAnswered} 題</p>
      </div>

      <div className="rounded-xl border bg-card p-6 text-center space-y-3">
        <div className={cn("text-5xl font-bold", report.overallScore >= 80 ? "text-green-600" : report.overallScore >= 60 ? "text-yellow-600" : "text-red-600")}>{report.overallScore}</div>
        <div className="text-sm text-muted-foreground">總分</div>
        <ScoreBar score={report.overallScore} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-green-600">優勢</h2>
          <ul className="space-y-1.5">
            {report.strengths.map((s, i) => (<li key={i} className="text-sm flex items-start gap-2"><span className="text-green-500 mt-0.5 shrink-0">+</span>{s}</li>))}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-red-500">待改進</h2>
          <ul className="space-y-1.5">
            {report.weaknesses.map((w, i) => (<li key={i} className="text-sm flex items-start gap-2"><span className="text-red-400 mt-0.5 shrink-0">&minus;</span>{w}</li>))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">改進建議</h2>
        <ul className="space-y-1.5">
          {report.recommendations.map((r, i) => (<li key={i} className="text-sm text-muted-foreground">{i + 1}. {r}</li>))}
        </ul>
      </div>

      {report.questionBreakdown.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">逐題分析（共 {report.questionBreakdown.length} 題）</h2>
          {report.questionBreakdown.map((qb, i) => (<QuestionDetail key={i} qb={qb} index={i} />))}
        </div>
      )}

      <button onClick={onReset} className="w-full flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium hover:bg-accent transition-colors">
        <RotateCcw className="h-4 w-4" />
        開始新面試
      </button>
    </div>
  );
}
