import { useInterview } from "@/hooks/useInterview";
import SetupForm from "@/components/SetupForm";
import InterviewChat from "@/components/InterviewChat";
import ReportView from "@/components/ReportView";
import HistoryView from "@/components/HistoryView";
import { toast } from "sonner";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Practice() {
  const {
    phase, config, messages, isAiThinking, report, isGeneratingReport,
    error, setError, startInterview, sendMessage, endInterview, reset,
    questionCount, startTime, goToHistory, goToSetup,
  } = useInterview();

  useEffect(() => {
    if (error) { toast.error(error); setError(null); }
  }, [error, setError]);

  return (
    <div>
      {phase === "setup" && (
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            回到管理頁
          </Link>
          <SetupForm onStart={startInterview} onViewHistory={goToHistory} />
        </div>
      )}
      {phase === "interview" && (
        <InterviewChat messages={messages} isAiThinking={isAiThinking} onSend={sendMessage}
          onEndInterview={endInterview} maxQuestions={config?.maxQuestions ?? 10}
          timeLimitMinutes={config?.timeLimitMinutes ?? 15}
          perQuestionSec={config?.perQuestionSec ?? 180}
          questionCount={questionCount} startTime={startTime} />
      )}
      {phase === "report" && (
        <ReportView report={report} isGenerating={isGeneratingReport} onReset={reset}
          messages={messages} position={config?.position ?? ""} />
      )}
      {phase === "history" && <HistoryView onBack={goToSetup} />}
    </div>
  );
}
