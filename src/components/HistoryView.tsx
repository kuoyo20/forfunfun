import { useState, useEffect } from "react";
import type { InterviewRecord } from "@/types/interview";
import { loadHistory, deleteRecord, clearHistory } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { ArrowLeft, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface HistoryViewProps { onBack: () => void; }

const DIFFICULTY_LABELS: Record<string, string> = { junior: "初階", mid: "中階", senior: "資深" };

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("zh-TW", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} 分 ${s} 秒`;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500";
  return <div className="h-1.5 w-full rounded-full bg-muted"><div className={cn("h-1.5 rounded-full", color)} style={{ width: `${score}%` }} /></div>;
}

function HistoryCard({ record, onDelete }: { record: InterviewRecord; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const questionsAnswered = record.messages.filter((m) => m.role === "user").length;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold">{record.config.position}</h3>
            <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-lg font-bold", record.report.overallScore >= 80 ? "text-green-600" : record.report.overallScore >= 60 ? "text-yellow-600" : "text-red-600")}>{record.report.overallScore}</span>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
        <ScoreBar score={record.report.overallScore} />
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{DIFFICULTY_LABELS[record.config.difficulty] ?? record.config.difficulty}</span>
          <span>&middot;</span>
          <span>{questionsAnswered} 題</span>
          <span>&middot;</span>
          <span>{formatDuration(record.durationSeconds)}</span>
        </div>
      </button>
      {expanded && (
        <div className="border-t px-4 py-3 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {record.config.topics.map((t) => (<span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t}</span>))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium text-green-600 mb-1">優勢</div>
              <ul className="space-y-0.5">{record.report.strengths.map((s, i) => (<li key={i} className="text-xs text-muted-foreground">+ {s}</li>))}</ul>
            </div>
            <div>
              <div className="text-xs font-medium text-red-500 mb-1">待改進</div>
              <ul className="space-y-0.5">{record.report.weaknesses.map((w, i) => (<li key={i} className="text-xs text-muted-foreground">&minus; {w}</li>))}</ul>
            </div>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(record.id); }} className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors">
            <Trash2 className="h-3 w-3" />刪除紀錄
          </button>
        </div>
      )}
    </div>
  );
}

export default function HistoryView({ onBack }: HistoryViewProps) {
  const [history, setHistory] = useState<InterviewRecord[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const handleDelete = (id: string) => { deleteRecord(id); setHistory((prev) => prev.filter((r) => r.id !== id)); };
  const handleClearAll = () => { clearHistory(); setHistory([]); setShowClearConfirm(false); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" />返回</button>
        {history.length > 0 && (<button onClick={() => setShowClearConfirm(true)} className="text-xs text-destructive hover:text-destructive/80 transition-colors">清除全部</button>)}
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">面試歷史</h1>
        <p className="text-muted-foreground">{history.length === 0 ? "還沒有面試紀錄，開始你的第一次練習吧！" : `共 ${history.length} 筆面試紀錄`}</p>
      </div>

      {history.length > 0 && (<div className="space-y-3">{history.map((record) => (<HistoryCard key={record.id} record={record} onDelete={handleDelete} />))}</div>)}

      {history.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">完成一次面試後，結果會顯示在這裡。</p>
          <button onClick={onBack} className="mt-4 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm hover:bg-primary/90 transition-colors">開始面試</button>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl border bg-card p-6 shadow-lg max-w-sm mx-4 space-y-4">
            <h3 className="text-lg font-semibold">清除所有歷史紀錄？</h3>
            <p className="text-sm text-muted-foreground">這將永久刪除所有 {history.length} 筆面試紀錄，此操作無法復原。</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowClearConfirm(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">取消</button>
              <button onClick={handleClearAll} className="rounded-lg bg-destructive text-primary-foreground px-4 py-2 text-sm hover:bg-destructive/90 transition-colors">全部刪除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
