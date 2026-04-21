export interface InterviewConfig {
  position: string;
  difficulty: "junior" | "mid" | "senior";
  maxQuestions: number;
  timeLimitMinutes: number;
  perQuestionSec?: number;
  topics: string[];
}

export interface MessageMetadata {
  typingMs?: number;
  charsPerSec?: number;
  pasteAttempts?: number;
  suspiciousFast?: boolean;
  autoSubmitted?: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  metadata?: MessageMetadata;
}

export type InterviewPhase = "setup" | "interview" | "report" | "history";

export interface QuestionBreakdown {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

export interface InterviewReport {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  questionBreakdown: QuestionBreakdown[];
}

export interface InterviewRecord {
  id: string;
  date: number;
  config: InterviewConfig;
  messages: Message[];
  report: InterviewReport;
  durationSeconds: number;
}
