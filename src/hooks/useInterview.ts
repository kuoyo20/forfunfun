import { useState, useCallback } from "react";
import type {
  InterviewConfig,
  InterviewPhase,
  InterviewReport,
  Message,
} from "@/types/interview";

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function makeAssistantMessage(content: string): Message {
  return {
    id: generateId(),
    role: "assistant",
    content,
    timestamp: Date.now(),
  };
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

  const startInterview = useCallback((interviewConfig: InterviewConfig) => {
    setConfig(interviewConfig);
    setPhase("interview");
    setStartTime(Date.now());
    setQuestionCount(1);

    const greeting = makeAssistantMessage(
      `Hello! I'll be conducting your interview for the ${interviewConfig.position} position today. ` +
        `We'll cover ${interviewConfig.topics.join(", ")} at a ${interviewConfig.difficulty} level. ` +
        `Let's get started!\n\nCan you tell me about your experience and what drew you to this role?`
    );
    setMessages([greeting]);
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsAiThinking(true);

      setTimeout(() => {
        const nextQ = questionCount + 1;
        setQuestionCount(nextQ);

        const followUps = [
          "That's a great point. Can you elaborate on how you handled the technical challenges in that project?",
          "Interesting approach. How would you handle a situation where requirements change mid-sprint?",
          "Good answer. Can you walk me through how you'd design a scalable system for this use case?",
          "Thanks for sharing that. What testing strategies do you typically employ?",
          "I see. How do you approach code reviews and collaboration with your team?",
          "Great example. Can you describe a time when you had to debug a particularly difficult issue?",
          "That's helpful context. How do you stay current with new technologies and best practices?",
          "Noted. What's your approach to balancing technical debt with feature development?",
          "Good insight. How would you mentor a junior developer on your team?",
          "Thanks. Can you describe your ideal development workflow?",
        ];

        const response = makeAssistantMessage(
          followUps[(nextQ - 2) % followUps.length]
        );
        setMessages((prev) => [...prev, response]);
        setIsAiThinking(false);
      }, 1500);
    },
    [questionCount]
  );

  const generateReport = useCallback(() => {
    setPhase("report");
    setIsGeneratingReport(true);

    setTimeout(() => {
      const mockReport: InterviewReport = {
        overallScore: 78,
        strengths: [
          "Strong communication skills",
          "Good understanding of core concepts",
          "Demonstrates problem-solving ability",
        ],
        weaknesses: [
          "Could provide more specific examples",
          "System design answers could be more detailed",
        ],
        recommendations: [
          "Practice explaining complex topics concisely",
          "Study system design patterns more thoroughly",
          "Prepare more STAR-format examples",
        ],
        questionBreakdown: messages
          .filter((m) => m.role === "assistant")
          .slice(0, -1)
          .map((q, i) => ({
            question: q.content,
            answer:
              messages.filter((m) => m.role === "user")[i]?.content ??
              "No answer provided",
            score: Math.floor(Math.random() * 30) + 60,
            feedback: "Demonstrated understanding with room for improvement.",
          })),
      };

      setReport(mockReport);
      setIsGeneratingReport(false);
    }, 2000);
  }, [messages]);

  const reset = useCallback(() => {
    setPhase("setup");
    setConfig(null);
    setMessages([]);
    setReport(null);
    setIsGeneratingReport(false);
    setError(null);
    setQuestionCount(0);
    setStartTime(null);
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
    generateReport,
    reset,
    questionCount,
    startTime,
  };
}
