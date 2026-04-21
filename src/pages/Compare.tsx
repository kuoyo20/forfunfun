import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { API } from "@/lib/config";

interface InterviewItem {
  id: string;
  position: string;
  candidateName: string | null;
  status: string;
  decision: string | null;
  report: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
  } | null;
  createdAt: string;
  completedAt: string | null;
}

const DIFFICULTY_LABELS: Record<string, string> = { junior: "初階", mid: "中階", senior: "資深" };

export default function Compare() {
  const [all, setAll] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [positionFilter, setPositionFilter] = useState<string>("");

  useEffect(() => {
    fetch(`${API}/api/interviews`)
      .then((r) => r.json())
      .then(setAll)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = all.filter((i) => i.status === "completed" && i.report);
  const positions = Array.from(new Set(completed.map((c) => c.position))).sort();

  const filtered = positionFilter
    ? completed.filter((c) => c.position === positionFilter)
    : completed;

  const ranked = [...filtered].sort((a, b) => (b.report?.overallScore ?? 0) - (a.report?.overallScore ?? 0));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const compareList = ranked.filter((c) => selected.has(c.id));

  if (loading) return (
    <div className="flex justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">候選人比較</h1>
          <p className="text-sm text-muted-foreground">依分數排名，可勾選多位候選人並排比較</p>
        </div>
      </div>

      {/* 職位篩選 */}
      {positions.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">篩選職位：</span>
          <button
            onClick={() => setPositionFilter("")}
            className={cn("rounded-full border px-3 py-1 text-xs transition-colors",
              positionFilter === "" ? "border-primary bg-primary/5" : "hover:border-primary/50"
            )}
          >
            全部（{completed.length}）
          </button>
          {positions.map((p) => (
            <button
              key={p}
              onClick={() => setPositionFilter(p)}
              className={cn("rounded-full border px-3 py-1 text-xs transition-colors",
                positionFilter === p ? "border-primary bg-primary/5" : "hover:border-primary/50"
              )}
            >
              {p}（{completed.filter((c) => c.position === p).length}）
            </button>
          ))}
        </div>
      )}

      {/* 排名清單 */}
      {ranked.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">尚無已完成的面試</div>
      ) : (
        <div className="space-y-2">
          {ranked.map((item, idx) => {
            const score = item.report?.overallScore ?? 0;
            const isSelected = selected.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                  isSelected ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                )}
              >
                <input type="checkbox" checked={isSelected} onChange={() => {}} className="shrink-0" />
                <div className="w-8 text-center">
                  <span className={cn("text-sm font-bold",
                    idx === 0 ? "text-yellow-600" : idx === 1 ? "text-gray-500" : idx === 2 ? "text-orange-600" : "text-muted-foreground"
                  )}>
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.candidateName ?? "未命名"}</div>
                  <div className="text-xs text-muted-foreground truncate">{item.position}</div>
                </div>
                <div className={cn("text-xl font-bold shrink-0",
                  score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"
                )}>
                  {score}
                </div>
                {item.decision && (
                  <span className={cn("rounded-full px-2 py-0.5 text-xs shrink-0",
                    item.decision === "pass" ? "bg-green-100 text-green-700" :
                    item.decision === "fail" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  )}>
                    {item.decision === "pass" ? "通過" : item.decision === "fail" ? "不通過" : "待定"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 並排比較 */}
      {compareList.length >= 2 && (
        <div className="rounded-xl border-2 border-primary/50 bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">並排比較（{compareList.length} 位）</h2>
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {compareList.map((item) => (
                <div key={item.id} className="w-64 shrink-0 space-y-3 border-r pr-4 last:border-r-0">
                  <div>
                    <div className="text-sm font-semibold">{item.candidateName ?? "未命名"}</div>
                    <div className="text-xs text-muted-foreground">{item.position}</div>
                  </div>
                  <div className={cn("text-3xl font-bold",
                    (item.report?.overallScore ?? 0) >= 80 ? "text-green-600" :
                    (item.report?.overallScore ?? 0) >= 60 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {item.report?.overallScore}
                  </div>
                  {item.report && (
                    <>
                      <div>
                        <div className="text-xs font-medium text-green-600 mb-1">優勢</div>
                        <ul className="space-y-0.5">
                          {item.report.strengths.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-xs text-muted-foreground">+ {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-red-500 mb-1">待改進</div>
                        <ul className="space-y-0.5">
                          {item.report.weaknesses.slice(0, 3).map((w, i) => (
                            <li key={i} className="text-xs text-muted-foreground">&minus; {w}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                  <Link to={`/report/${item.id}`} className="block text-center text-xs text-primary hover:underline">
                    完整報告 &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <span className="hidden">{DIFFICULTY_LABELS.junior}</span>
    </div>
  );
}
