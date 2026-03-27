import { useState, useRef, useEffect } from "react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking]);

  useEffect(() => {
    if (!startTime) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAiThinking) return;
    onSend(input.trim());
    setInput("");
  };

  const totalSeconds = timeLimitMinutes * 60;
  const timeRemaining = Math.max(0, totalSeconds - elapsed);
  const isLowTime = timeRemaining < 60;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-xl border bg-card px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Question{" "}
            <span className="font-medium text-foreground">
              {questionCount}
            </span>{" "}
            / {maxQuestions}
          </span>
          <span
            className={cn(
              "font-mono text-sm",
              isLowTime ? "text-destructive font-medium" : "text-muted-foreground"
            )}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>
        <button
          onClick={onEndInterview}
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
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
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
        className="flex items-center gap-2 rounded-b-xl border bg-card px-4 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer..."
          disabled={isAiThinking}
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isAiThinking}
          className={cn(
            "rounded-lg p-2 transition-colors",
            input.trim() && !isAiThinking
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "text-muted-foreground"
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
