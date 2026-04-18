import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, ChevronDown, ChevronUp } from "lucide-react";

import { API } from "@/lib/config";

interface Report {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  questionBreakdown: { question: string; answer: string; score: number; feedback: string }[];
}

interface InterviewData {
  id: string;
  position: string;
  difficulty: string;
  candidateName: string | null;
  candidateEmail: string | null;
  status: string;
  messages: { role: string; content: string }[];
  report: Report | null;
  durationSec: number | null;
  createdAt: string;
  completedAt: string | null;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500";
  return <div className="h-2 w-full rounded-full bg-muted"><div className={cn("h-2 rounded-full transition-all", color)} style={{ width: `${score}%` }} /></div>;
}

function QDetail({ qb, i }: { qb: Report["questionBreakdown"][0]; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t pt-3 first:border-t-0 first:pt-0">
      <button type="button" onClick={() => setOpen(!open)} className="w-full text-left space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">第 {i + 1} 題 {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", qb.score >= 80 ? "text-green-600 bg-green-50" : qb.score >= 60 ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50")}>{qb.score}/100</span>
        </div>
        <ScoreBar score={qb.score} />
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-sm">
          <div className="rounded-lg bg-muted/50 p-3"><div className="text-xs font-medium text-muted-foreground mb-1">面試題目</div><p className="whitespace-pre-wrap">{qb.question}</p></div>
          <div className="rounded-lg bg-primary/5 p-3"><div className="text-xs font-medium text-muted-foreground mb-1">候選人回答</div><p className="whitespace-pre-wrap">{qb.answer}</p></div>
          <div className="rounded-lg border p-3"><div className="text-xs font-medium text-muted-foreground mb-1">評語</div><p>{qb.feedback}</p></div>
        </div>
      )}
    </div>
  );
}

export default function InterviewReport() {
  const { id } = useParams();
  const [data, setData] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/interviews/${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data || !data.report) return <div className="text-center py-24 text-muted-foreground">找不到面試報告</div>;

  const report = data.report;
  const totalAnswered = data.messages.filter((m) => m.role === "user").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold">面試報告</h1>
          <p className="text-sm text-muted-foreground">{data.candidateName ?? "候選人"} · {data.position} · 共回答 {totalAnswered} 題</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 text-center space-y-3">
        <div className={cn("text-5xl font-bold", report.overallScore >= 80 ? "text-green-600" : report.overallScore >= 60 ? "text-yellow-600" : "text-red-600")}>{report.overallScore}</div>
        <div className="text-sm text-muted-foreground">總分</div>
        <ScoreBar score={report.overallScore} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-green-600">優勢</h2>
          <ul className="space-y-1.5">{report.strengths.map((s, i) => (<li key={i} className="text-sm flex items-start gap-2"><span className="text-green-500 shrink-0">+</span>{s}</li>))}</ul>
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-red-500">待改進</h2>
          <ul className="space-y-1.5">{report.weaknesses.map((w, i) => (<li key={i} className="text-sm flex items-start gap-2"><span className="text-red-400 shrink-0">&minus;</span>{w}</li>))}</ul>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">改進建議</h2>
        <ul className="space-y-1.5">{report.recommendations.map((r, i) => (<li key={i} className="text-sm text-muted-foreground">{i + 1}. {r}</li>))}</ul>
      </div>

      {report.questionBreakdown.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">逐題分析</h2>
          {report.questionBreakdown.map((qb, i) => (<QDetail key={i} qb={qb} i={i} />))}
        </div>
      )}

      <Link to="/" className="w-full flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium hover:bg-accent transition-colors">
        回到管理頁
      </Link>
    </div>
  );
}
