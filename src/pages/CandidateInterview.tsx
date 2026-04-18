import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import InterviewChat from "@/components/InterviewChat";
import ReportView from "@/components/ReportView";
import type { InterviewReport, Message } from "@/types/interview";

import { API } from "@/lib/config";

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
  const startTimeRef = useRef<number | null>(null);
  const isEndedRef = useRef(false);
  const interviewIdRef = useRef<string | null>(null);

  // Fetch interview data & get first AI greeting
  useEffect(() => {
    fetch(`${API}/api/interview/${token}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(async (data) => {
        if (data.status === "completed") { setError("此面試已經完成。"); return; }

        setInterviewData(data);
        interviewIdRef.current = data.id;
        isEndedRef.current = false;

        const now = Date.now();
        setStartTime(now);
        startTimeRef.current = now;
        setQuestionCount(1);
        questionCountRef.current = 1;

        // Mark as in_progress
        fetch(`${API}/api/interviews/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in_progress" }),
        });

        // Get AI greeting
        setIsAiThinking(true);
        setPhase("interview");

        try {
          const res = await fetch(`${API}/api/ai/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              interviewId: data.id,
              messages: [{ role: "user", content: "請開始面試，先打招呼並問第一個問題。" }],
            }),
          });
          const { reply } = await res.json();
          const greeting = makeMessage("assistant", reply);
          setMessages([greeting]);
          messagesRef.current = [greeting];
        } catch {
          const fallback = makeMessage("assistant",
            `你好！我是今天的面試官，將針對 ${data.position} 職位進行面試。請先簡單自我介紹，並說說你對這個職位感興趣的原因？`
          );
          setMessages([fallback]);
          messagesRef.current = [fallback];
        } finally {
          setIsAiThinking(false);
        }
      })
      .catch(() => setError("無效的面試連結"))
      .finally(() => setLoading(false));
  }, [token]);

  const endInterview = useCallback(async () => {
    if (isEndedRef.current || !interviewIdRef.current) return;
    isEndedRef.current = true;
    setPhase("report");
    setIsGeneratingReport(true);

    const msgs = messagesRef.current;
    const start = startTimeRef.current;
    const durationSec = start ? Math.floor((Date.now() - start) / 1000) : 0;

    try {
      const res = await fetch(`${API}/api/ai/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: interviewIdRef.current,
          messages: msgs.map((m) => ({ role: m.role, content: m.content })),
          durationSec,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setReport(result);
      } else {
        setError(result.error ?? "報告產生失敗");
      }
    } catch {
      setError("報告產生失敗，請稍後再試");
    } finally {
      setIsGeneratingReport(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (isEndedRef.current || !interviewIdRef.current) return;

    const userMsg = makeMessage("user", content);
    setMessages((prev) => { const next = [...prev, userMsg]; messagesRef.current = next; return next; });
    setIsAiThinking(true);

    const currentQ = questionCountRef.current;
    const nextQ = currentQ + 1;
    setQuestionCount(nextQ);
    questionCountRef.current = nextQ;

    const maxQ = interviewData?.maxQuestions ?? 10;
    if (nextQ > maxQ) {
      setIsAiThinking(false);
      await endInterview();
      return;
    }

    try {
      const res = await fetch(`${API}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: interviewIdRef.current,
          messages: messagesRef.current.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error();
      const { reply } = await res.json();

      if (isEndedRef.current) return;
      const assistantMsg = makeMessage("assistant", reply);
      setMessages((prev) => { const next = [...prev, assistantMsg]; messagesRef.current = next; return next; });
    } catch {
      const errMsg = makeMessage("assistant", "抱歉，我暫時無法回應。請再試一次或結束面試。");
      setMessages((prev) => { const next = [...prev, errMsg]; messagesRef.current = next; return next; });
    } finally {
      setIsAiThinking(false);
    }
  }, [endInterview, interviewData]);

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
          onReset={() => {}}
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
