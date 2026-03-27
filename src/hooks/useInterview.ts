import { useState, useCallback, useRef } from "react";
import type {
  InterviewConfig,
  InterviewPhase,
  InterviewReport,
  Message,
} from "@/types/interview";
import {
  buildGreeting,
  fetchNextQuestion,
  fetchReport,
  resetSession,
} from "@/lib/api";
import { saveRecord } from "@/lib/storage";

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function makeMessage(role: Message["role"], content: string): Message {
  return { id: generateId(), role, content, timestamp: Date.now() };
}

export function useInterview() {
  const [phase, setPhase] = useState<InterviewPhase>("setup");
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Use refs for values accessed inside async callbacks to avoid stale closures
  const questionCountRef = useRef(0);
  const messagesRef = useRef<Message[]>([]);
  const configRef = useRef<InterviewConfig | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isEndedRef = useRef(false);

  const startInterview = useCallback((interviewConfig: InterviewConfig) => {
    resetSession();
    isEndedRef.current = false;

    setConfig(interviewConfig);
    configRef.current = interviewConfig;
    setPhase("interview");

    const now = Date.now();
    setStartTime(now);
    startTimeRef.current = now;

    setQuestionCount(1);
    questionCountRef.current = 1;

    const greeting = makeMessage("assistant", buildGreeting(interviewConfig));
    setMessages([greeting]);
    messagesRef.current = [greeting];
  }, []);

  const endInterview = useCallback(async () => {
    if (isEndedRef.current) return;
    isEndedRef.current = true;

    setPhase("report");
    setIsGeneratingReport(true);

    const cfg = configRef.current;
    const msgs = messagesRef.current;
    const start = startTimeRef.current;
    const durationSeconds = start ? Math.floor((Date.now() - start) / 1000) : 0;

    if (!cfg) {
      setError("Interview configuration is missing.");
      setIsGeneratingReport(false);
      return;
    }

    try {
      const result = await fetchReport(cfg, msgs, durationSeconds);
      setReport(result);

      // Auto-save to history
      saveRecord({
        id: generateId(),
        date: Date.now(),
        config: cfg,
        messages: msgs,
        report: result,
        durationSeconds,
      });
    } catch {
      setError("Failed to generate report. Please try again.");
    } finally {
      setIsGeneratingReport(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (isEndedRef.current) return;

    const userMessage = makeMessage("user", content);
    setMessages((prev) => {
      const next = [...prev, userMessage];
      messagesRef.current = next;
      return next;
    });

    setIsAiThinking(true);

    const cfg = configRef.current;
    if (!cfg) {
      setError("Interview configuration is missing.");
      setIsAiThinking(false);
      return;
    }

    const currentQ = questionCountRef.current;
    const nextQ = currentQ + 1;
    setQuestionCount(nextQ);
    questionCountRef.current = nextQ;

    // Auto-end if max questions reached
    if (nextQ > cfg.maxQuestions) {
      setIsAiThinking(false);
      await endInterview();
      return;
    }

    try {
      const updatedMessages = messagesRef.current;
      const response = await fetchNextQuestion(cfg, updatedMessages, nextQ);

      if (isEndedRef.current) return; // User may have ended while waiting

      const assistantMsg = makeMessage("assistant", response);
      setMessages((prev) => {
        const next = [...prev, assistantMsg];
        messagesRef.current = next;
        return next;
      });
    } catch {
      setError("Failed to get next question. Please try again.");
    } finally {
      setIsAiThinking(false);
    }
  }, [endInterview]);

  const reset = useCallback(() => {
    resetSession();
    isEndedRef.current = false;
    setPhase("setup");
    setConfig(null);
    configRef.current = null;
    setMessages([]);
    messagesRef.current = [];
    setReport(null);
    setIsGeneratingReport(false);
    setError(null);
    setQuestionCount(0);
    questionCountRef.current = 0;
    setStartTime(null);
    startTimeRef.current = null;
  }, []);

  const goToHistory = useCallback(() => {
    setPhase("history");
  }, []);

  const goToSetup = useCallback(() => {
    setPhase("setup");
  }, []);

  return {
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
  };
}
