import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import ReportView from "@/components/ReportView";
import type { InterviewReport as Report, Message } from "@/types/interview";
import { API } from "@/lib/config";

interface InterviewData {
  id: string;
  position: string;
  difficulty: string;
  candidateName: string | null;
  candidateEmail: string | null;
  status: string;
  messages: Message[];
  report: Report | null;
  durationSec: number | null;
  createdAt: string;
  completedAt: string | null;
}

export default function InterviewReportPage() {
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
    </div>
  );
}
