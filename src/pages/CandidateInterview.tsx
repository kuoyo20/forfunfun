import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import InterviewChat from "@/components/InterviewChat";
import ReportView from "@/components/ReportView";
import { buildGreeting, fetchNextQuestion, fetchReport, resetSession } from "@/lib/api";
import type { InterviewConfig, InterviewReport, Message } from "@/types/interview";
import { useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function makeMessage(role: Message["role"], content: string): Message {
  return { id: generateId(), role, content, timestamp: Date.now() };
}

export default function CandidateInterview() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<{
    id: string;
    position: string;
    difficulty: string;
    maxQuestions: number;
    timeLimitMin: number;
    topics: string[];
    status: string;
    candidateName: string | null;
  } | null>(null);

  const [phase, setPhase] = useState<"loading" | "interview" | "report">("loading");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const questionCountRef = useRef(0);
  const messagesRef = useRef<Message[]>([]);
  const configRef = useRef<InterviewConfig | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isEndedRef = useRef(false);

  // Fetch interview data
  useEffect(() => {
    fetch(`${API_URL}/api/interview/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (data.status === "completed") {
          setError("此面試已經完成。");
          return;
        }
        setInterviewData(data);
        // Start the interview
        resetSession();
        const config: InterviewConfig = {
          position: data.position,
          difficulty: data.difficulty as InterviewConfig["difficulty"],
          maxQuestions: data.maxQuestions,
          timeLimitMinutes: data.timeLimitMin,
          topics: data.topics,
        };
        configRef.current = config;
        isEndedRef.current = false;

        const now = Date.now();
        setStartTime(now);
        startTimeRef.current = now;
        setQuestionCount(1);
        questionCountRef.current = 1;

        const greeting = makeMessage("assistant", buildGreeting(config));
        setMessages([greeting]);
        messagesRef.current = [greeting];
        setPhase("interview");

        // Mark as in_progress
        fetch(`${API_URL}/api/interviews/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in_progress" }),
        });
      })
      .catch(() => setError("無效的面試連結"))
      .finally(() => setLoading(false));
  }, [token]);

  const endInterview = useCallback(async () => {
    if (isEndedRef.current || !interviewData) return;
    isEndedRef.current = true;
    setPhase("report");
    setIsGeneratingReport(true);

    const cfg = configRef.current!;
    const msgs = messagesRef.current;
    const start = startTimeRef.current;
    const durationSec = start ? Math.floor((Date.now() - start) / 1000) : 0;

    const result = await fetchReport(cfg, msgs, durationSec);
    setReport(result);
    setIsGeneratingReport(false);

    // Save to backend
    await fetch(`${API_URL}/api/interviews/${interviewData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        messages: msgs,
        report: result,
        durationSec,
      }),
    });
  }, [interviewData]);

  const sendMessage = useCallback(async (content: string) => {
    if (isEndedRef.current) return;

    const userMsg = makeMessage("user", content);
    setMessages((prev) => { const next = [...prev, userMsg]; messagesRef.current = next; return next; });
    setIsAiThinking(true);

    const cfg = configRef.current!;
    const currentQ = questionCountRef.current;
    const nextQ = currentQ + 1;
    setQuestionCount(nextQ);
    questionCountRef.current = nextQ;

    if (nextQ > cfg.maxQuestions) {
      setIsAiThinking(false);
      await endInterview();
      return;
    }

    const response = await fetchNextQuestion(cfg, messagesRef.current, nextQ);
    if (isEndedRef.current) return;

    const assistantMsg = makeMessage("assistant", response);
    setMessages((prev) => { const next = [...prev, assistantMsg]; messagesRef.current = next; return next; });
    setIsAiThinking(false);
  }, [endInterview]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">載入面試中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-lg font-medium">{error}</p>
      </div>
    );
  }

  if (!interviewData) return null;

  if (phase === "report") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <ReportView
          report={report}
          isGenerating={isGeneratingReport}
          onReset={() => {}} // No reset for candidate
          messages={messages}
          position={interviewData.position}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      {interviewData.candidateName && (
        <p className="text-sm text-muted-foreground mb-2">
          {interviewData.candidateName} 的面試 — {interviewData.position}
        </p>
      )}
      <InterviewChat
        messages={messages}
        isAiThinking={isAiThinking}
        onSend={sendMessage}
        onEndInterview={endInterview}
        maxQuestions={interviewData.maxQuestions}
        timeLimitMinutes={interviewData.timeLimitMin}
        questionCount={questionCount}
        startTime={startTime}
      />
    </div>
  );
}
