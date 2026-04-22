import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Users, TrendingUp, Clock, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { API } from "@/lib/config";

interface Interview {
  id: string;
  position: string;
  status: string;
  decision: string | null;
  report: { overallScore: number } | null;
  createdAt: string;
}

interface JobGroup {
  position: string;
  total: number;
  completed: number;
  pending: number;
  avgScore: number;
  passed: number;
  failed: number;
  latestDate: number;
}

export default function Jobs() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/interviews`)
      .then((r) => r.json())
      .then(setInterviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const jobs: JobGroup[] = useMemo(() => {
    const grouped = new Map<string, Interview[]>();
    interviews.forEach((i) => {
      const list = grouped.get(i.position) ?? [];
      list.push(i);
      grouped.set(i.position, list);
    });

    return Array.from(grouped.entries())
      .map(([position, items]) => {
        const completed = items.filter((i) => i.status === "completed");
        const avgScore = completed.length > 0
          ? Math.round(completed.reduce((sum, i) => sum + (i.report?.overallScore ?? 0), 0) / completed.length)
          : 0;
        return {
          position,
          total: items.length,
          completed: completed.length,
          pending: items.filter((i) => i.status === "pending" || i.status === "in_progress").length,
          avgScore,
          passed: items.filter((i) => i.decision === "pass").length,
          failed: items.filter((i) => i.decision === "fail").length,
          latestDate: Math.max(...items.map((i) => new Date(i.createdAt).getTime())),
        };
      })
      .sort((a, b) => b.latestDate - a.latestDate);
  }, [interviews]);

  if (loading) return (
    <div className="flex justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">職缺管理</h1>
        <p className="text-sm text-muted-foreground mt-1">按職位彙整的候選人資料</p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">還沒有任何職缺</p>
          <Link to="/create" className="inline-flex rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm hover:bg-primary/90">
            建立第一場面試
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link
              key={job.position}
              to={`/compare?job=${encodeURIComponent(job.position)}`}
              className="group block rounded-xl border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                    {job.position}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    共 {job.total} 位候選人
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <Stat icon={Users} label="總數" value={job.total} />
                <Stat icon={Clock} label="進行中" value={job.pending} color="text-blue-600" />
                <Stat icon={TrendingUp} label="已完成" value={job.completed} color="text-green-600" />
                <Stat
                  icon={TrendingUp}
                  label="平均分"
                  value={job.avgScore || "—"}
                  color={job.avgScore >= 80 ? "text-green-600" : job.avgScore >= 60 ? "text-yellow-600" : "text-muted-foreground"}
                />
              </div>

              {(job.passed > 0 || job.failed > 0) && (
                <div className="flex gap-2 mt-3 text-xs">
                  {job.passed > 0 && (
                    <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5">
                      ✓ 通過 {job.passed}
                    </span>
                  )}
                  {job.failed > 0 && (
                    <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5">
                      ✗ 不通過 {job.failed}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon, label, value, color = "text-foreground"
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={cn("text-xl font-bold", color)}>{value}</div>
    </div>
  );
}
