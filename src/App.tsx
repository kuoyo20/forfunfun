import { useInterview } from "@/hooks/useInterview";
import SetupForm from "@/components/SetupForm";
import InterviewChat from "@/components/InterviewChat";
import ReportView from "@/components/ReportView";
import HistoryView from "@/components/HistoryView";
import { Toaster, toast } from "sonner";
import { useEffect } from "react";

export default function App() {
  const {
    phase,
    config,
    messages,
    isAiThinking,
    report,
    isGeneratingReport,
    error,
    setError,
    startInterview,
    sendMessage,
    endInterview,
    reset,
    questionCount,
    startTime,
    goToHistory,
    goToSetup,
  } = useInterview();

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error, setError]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-2xl px-4 py-8">
        {phase === "setup" && (
          <SetupForm onStart={startInterview} onViewHistory={goToHistory} />
        )}
        {phase === "interview" && (
          <InterviewChat
            messages={messages}
            isAiThinking={isAiThinking}
            onSend={sendMessage}
            onEndInterview={endInterview}
            maxQuestions={config?.maxQuestions ?? 10}
            timeLimitMinutes={config?.timeLimitMinutes ?? 15}
            questionCount={questionCount}
            startTime={startTime}
          />
        )}
        {phase === "report" && (
          <ReportView
            report={report}
            isGenerating={isGeneratingReport}
            onReset={reset}
            messages={messages}
            position={config?.position ?? ""}
          />
        )}
        {phase === "history" && <HistoryView onBack={goToSetup} />}
      </div>
    </div>
  );
}
