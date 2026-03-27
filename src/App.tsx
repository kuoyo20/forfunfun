import { useInterview } from "@/hooks/useInterview";
import SetupForm from "@/components/SetupForm";
import InterviewChat from "@/components/InterviewChat";
import ReportView from "@/components/ReportView";
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
    generateReport,
    reset,
    questionCount,
    startTime,
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
        {phase === "setup" && <SetupForm onStart={startInterview} />}
        {phase === "interview" && (
          <InterviewChat
            messages={messages}
            isAiThinking={isAiThinking}
            onSend={sendMessage}
            onEndInterview={generateReport}
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
      </div>
    </div>
  );
}
