export interface InterviewConfig {
  position: string;
  difficulty: "junior" | "mid" | "senior";
  maxQuestions: number;
  timeLimitMinutes: number;
  topics: string[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export type InterviewPhase = "setup" | "interview" | "report";

export interface InterviewReport {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  questionBreakdown: {
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }[];
}
