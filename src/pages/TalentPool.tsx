import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Archive, Loader2, Mail, Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { API } from "@/lib/config";

interface Interview {
  id: string;
  position: string;
  candidateName: string | null;
  candidateEmail: string | null;
  status: string;
  decision: string | null;
  report: { overallScore: number } | null;
  createdAt: string;
}

function daysAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 30) return `${days} 天前`;
  if (days < 365) return `${Math.floor(days / 30)} 個月前`;
  return `${Math.floor(days / 365)} 年前`;
}

export default function TalentPool() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(60);

  useEffect(() => {
    fetch(`${API}/api/interviews`)
      .then((r) => r.json())
      .then(setInterviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 「人才庫」= 已完成但未錄取、或被標為不通過但分數還不錯的候選人
  const pool = interviews
    .filter((i) => i.status === "completed" && i.report && i.decision !== "pass")
    .filter((i) => (i.report?.overallScore ?? 0) >= minScore)
    .sort((a, b) => (b.report?.overallScore ?? 0) - (a.report?.overallScore ?? 0));

  if (loading) return (
    <div className="flex justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">人才庫</h1>
        <p className="text-sm text-muted-foreground mt-1">
          未錄取但表現不錯的候選人，未來有新職缺可以優先聯繫
        </p>
      </div>

      {/* 篩選 */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">最低分數：</span>
        {[50, 60, 70, 80].map((n) => (
          <button
            key={n}
            onClick={() => setMinScore(n)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              minScore === n ? "border-primary bg-primary/5" : "hover:border-primary/50"
            )}
          >
            ≥ {n} 分
          </button>
        ))}
      </div>

      {pool.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <Archive className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">
            {interviews.length === 0 ? "還沒有面試紀錄" : `沒有分數 ≥ ${minScore} 的未錄取候選人`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pool.map((item) => {
            const score = item.report?.overallScore ?? 0;
            return (
              <Link
                key={item.id}
                to={`/report/${item.id}`}
                className="group rounded-xl border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {item.candidateName ?? "未命名"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.position}</p>
                  </div>
                  <div className={cn("text-2xl font-bold shrink-0",
                    score >= 80 ? "text-green-600" :
                    score >= 60 ? "text-yellow-600" : "text-muted-foreground"
                  )}>
                    {score}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  {item.candidateEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{item.candidateEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {daysAgo(item.createdAt)}
                  </div>
                </div>

                {item.decision === "fail" && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-xs">
                      ✗ 曾標記為不通過
                    </span>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-end text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  查看報告 <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
