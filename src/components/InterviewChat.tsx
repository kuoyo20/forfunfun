import { useState, useRef, useEffect, useCallback } from "react";
import type { Message } from "@/types/interview";
import { cn } from "@/lib/utils";
import { Send, StopCircle, Loader2 } from "lucide-react";

interface InterviewChatProps {
  messages: Message[];
  isAiThinking: boolean;
  onSend: (message: string) => void;
  onEndInterview: () => void;
  maxQuestions: number;
  timeLimitMinutes: number;
  questionCount: number;
  startTime: number | null;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function InterviewChat({
  messages,
  isAiThinking,
  onSend,
  onEndInterview,
  maxQuestions,
  timeLimitMinutes,
  questionCount,
  startTime,
}: InterviewChatProps) {
  const [input, setInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoEnded = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking]);

  // Timer
  useEffect(() => {
    if (!startTime) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Auto-end when time runs out
  const totalSeconds = timeLimitMinutes * 60;
  const timeRemaining = Math.max(0, totalSeconds - elapsed);
  const isLowTime = timeRemaining <= 60;
  const isTimeUp = timeRemaining === 0;

  useEffect(() => {
    if (isTimeUp && !hasAutoEnded.current) {
      hasAutoEnded.current = true;
      onEndInterview();
    }
  }, [isTimeUp, onEndInterview]);

  // Auto-resize textarea
  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAiThinking) return;
    onSend(input.trim());
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEndClick = () => {
    setShowConfirm(true);
  };

  const confirmEnd = () => {
    setShowConfirm(false);
    onEndInterview();
  };

  const isAtMaxQuestions = questionCount >= maxQuestions;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-xl border bg-card px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Question{" "}
            <span className="font-medium text-foreground">
              {Math.min(questionCount, maxQuestions)}
            </span>{" "}
            / {maxQuestions}
          </span>
          <span
            className={cn(
              "font-mono text-sm",
              isLowTime ? "text-destructive font-medium animate-pulse" : "text-muted-foreground"
            )}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>
        <button
          onClick={handleEndClick}
          className="flex items-center gap-1.5 rounded-lg border border-destructive/50 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <StopCircle className="h-4 w-4" />
          End Interview
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto border-x px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isAiThinking && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 rounded-b-xl border bg-card px-4 py-3"
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextarea();
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isAtMaxQuestions
                ? "Maximum questions reached — end the interview to see your report"
                : "Type your answer... (Enter to send, Shift+Enter for new line)"
            }
            disabled={isAiThinking || isAtMaxQuestions}
            rows={1}
            className="w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none leading-relaxed py-1"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || isAiThinking || isAtMaxQuestions}
          className={cn(
            "rounded-lg p-2 transition-colors shrink-0",
            input.trim() && !isAiThinking && !isAtMaxQuestions
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "text-muted-foreground"
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl border bg-card p-6 shadow-lg max-w-sm mx-4 space-y-4">
            <h3 className="text-lg font-semibold">End Interview?</h3>
            <p className="text-sm text-muted-foreground">
              You've answered {questionCount - 1} question{questionCount - 1 !== 1 ? "s" : ""} so far.
              Are you sure you want to end the interview and generate your report?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                Continue Interview
              </button>
              <button
                onClick={confirmEnd}
                className="rounded-lg bg-destructive text-primary-foreground px-4 py-2 text-sm hover:bg-destructive/90 transition-colors"
              >
                End & Get Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
