import { useState, useRef, useEffect, useCallback } from "react";
import type { Message, MessageMetadata } from "@/types/interview";
import { cn } from "@/lib/utils";
import { Send, StopCircle, Loader2, ShieldAlert, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface InterviewChatProps {
  messages: Message[];
  isAiThinking: boolean;
  onSend: (message: string, metadata?: MessageMetadata) => void;
  onEndInterview: () => void;
  maxQuestions: number;
  timeLimitMinutes: number;
  perQuestionSec?: number;
  questionCount: number;
  startTime: number | null;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const CHARS_PER_SEC_THRESHOLD = 15;

export default function InterviewChat({
  messages, isAiThinking, onSend, onEndInterview,
  maxQuestions, timeLimitMinutes, perQuestionSec = 180,
  questionCount, startTime,
}: InterviewChatProps) {
  const [input, setInput] = useState("");
  const [interim, setInterim] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [perQElapsed, setPerQElapsed] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoEnded = useRef(false);

  // 行為追蹤
  const firstKeystrokeRef = useRef<number | null>(null);
  const pasteCountRef = useRef(0);
  const voiceUsedRef = useRef(false);
  const perQStartRef = useRef<number | null>(null);
  const hasAutoSubmittedThisQRef = useRef(false);
  const inputRef = useRef("");
  inputRef.current = input;

  // 語音輸入
  const handleFinalTranscript = useCallback((text: string) => {
    voiceUsedRef.current = true;
    setInput((prev) => {
      const next = prev ? `${prev}${text}` : text;
      inputRef.current = next;
      return next;
    });
    setInterim("");
    // 重設 textarea 高度
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 150) + "px";
      }
    });
  }, []);

  const handleInterimTranscript = useCallback((text: string) => {
    setInterim(text);
  }, []);

  const voice = useVoiceInput({
    language: "zh-TW",
    onFinalTranscript: handleFinalTranscript,
    onInterimTranscript: handleInterimTranscript,
  });

  useEffect(() => {
    if (voice.error) {
      toast.error(voice.error);
    }
  }, [voice.error]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isAiThinking]);

  // 整場倒數
  useEffect(() => {
    if (!startTime) return;
    const t = setInterval(() => { setElapsed(Math.floor((Date.now() - startTime) / 1000)); }, 1000);
    return () => clearInterval(t);
  }, [startTime]);

  const totalSeconds = timeLimitMinutes * 60;
  const timeRemaining = Math.max(0, totalSeconds - elapsed);
  const isLowTime = timeRemaining <= 60;
  const isTimeUp = timeRemaining === 0;

  useEffect(() => {
    if (isTimeUp && !hasAutoEnded.current) { hasAutoEnded.current = true; onEndInterview(); }
  }, [isTimeUp, onEndInterview]);

  // 每題倒數：新 AI 訊息到達時重設
  const lastAssistantId = messages.length > 0 ? messages[messages.length - 1]?.role === "assistant" ? messages[messages.length - 1]?.id : null : null;
  useEffect(() => {
    if (!lastAssistantId) return;
    perQStartRef.current = Date.now();
    setPerQElapsed(0);
    firstKeystrokeRef.current = null;
    pasteCountRef.current = 0;
    voiceUsedRef.current = false;
    hasAutoSubmittedThisQRef.current = false;
    // 若正在錄音，停止
    if (voice.isListening) voice.stop();
  }, [lastAssistantId, voice]);

  useEffect(() => {
    if (!perQStartRef.current) return;
    const t = setInterval(() => {
      if (perQStartRef.current) {
        setPerQElapsed(Math.floor((Date.now() - perQStartRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(t);
  }, [lastAssistantId]);

  const perQRemaining = Math.max(0, perQuestionSec - perQElapsed);
  const perQLow = perQRemaining <= 15;
  const perQUp = perQRemaining === 0;

  const buildMetadata = useCallback((autoSubmitted = false): MessageMetadata => {
    const first = firstKeystrokeRef.current;
    const now = Date.now();
    const typingMs = first ? now - first : 0;
    const chars = inputRef.current.length;
    const charsPerSec = typingMs > 0 ? (chars / (typingMs / 1000)) : 0;
    // 語音輸入時不判定為「打字異常快」
    const suspiciousFast = !voiceUsedRef.current && chars > 100 && charsPerSec > CHARS_PER_SEC_THRESHOLD;
    return {
      typingMs,
      charsPerSec: Math.round(charsPerSec * 10) / 10,
      pasteAttempts: pasteCountRef.current,
      suspiciousFast,
      autoSubmitted,
      voiceUsed: voiceUsedRef.current,
    };
  }, []);

  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  }, []);

  const submitCore = useCallback((text: string, autoSubmitted = false) => {
    if (voice.isListening) voice.stop();

    if (!text.trim() || isAiThinking) {
      if (autoSubmitted) {
        onSend("（時間到，未作答）", buildMetadata(true));
      }
      return;
    }
    onSend(text.trim(), buildMetadata(autoSubmitted));
    setInput("");
    setInterim("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [isAiThinking, onSend, buildMetadata, voice]);

  // 每題超時自動送出
  useEffect(() => {
    if (perQUp && !hasAutoSubmittedThisQRef.current && !isAiThinking && lastAssistantId) {
      hasAutoSubmittedThisQRef.current = true;
      toast.error("作答時間已到，自動送出");
      submitCore(inputRef.current, true);
    }
  }, [perQUp, isAiThinking, lastAssistantId, submitCore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCore(input, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (firstKeystrokeRef.current === null) {
      firstKeystrokeRef.current = Date.now();
    }
    setInput(e.target.value);
    adjustTextarea();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    pasteCountRef.current += 1;
    toast.error("此面試禁止貼上，請親自輸入回答");
  };

  const handleCopyCut = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  const isAtMaxQuestions = questionCount >= maxQuestions;
  const disabled = isAiThinking || isAtMaxQuestions || perQUp;
  const showMic = voice.isSupported;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* 頂部資訊 */}
      <div className="flex items-center justify-between rounded-t-xl border bg-card px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            第 <span className="font-medium text-foreground">{Math.min(questionCount, maxQuestions)}</span> / {maxQuestions} 題
          </span>
          <span className={cn("font-mono text-sm", isLowTime ? "text-destructive font-medium animate-pulse" : "text-muted-foreground")}>
            總 {formatTime(timeRemaining)}
          </span>
        </div>
        <button onClick={() => setShowConfirm(true)} className="flex items-center gap-1.5 rounded-lg border border-destructive/50 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">
          <StopCircle className="h-4 w-4" />
          結束面試
        </button>
      </div>

      {/* 對話訊息 */}
      <div className="flex-1 overflow-y-auto border-x px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap", message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
              {message.content}
            </div>
          </div>
        ))}
        {isAiThinking && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              思考中...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 本題倒數 + 狀態列 */}
      {lastAssistantId && !isAtMaxQuestions && (
        <div className="flex items-center justify-between px-4 py-2 border-x text-xs bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldAlert className="h-3 w-3" />
              禁止貼上
            </div>
            {voice.isListening && (
              <div className="flex items-center gap-1.5 text-red-600 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                錄音中
              </div>
            )}
          </div>
          <div className={cn("font-mono", perQLow ? "text-destructive font-semibold" : "text-muted-foreground")}>
            本題 {formatTime(perQRemaining)}
          </div>
        </div>
      )}

      {/* 輸入區 */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-b-xl border bg-card px-4 py-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onCopy={handleCopyCut}
            onCut={handleCopyCut}
            placeholder={isAtMaxQuestions
              ? "已達最大題數 — 請結束面試查看報告"
              : showMic
                ? "輸入文字或按麥克風說話...（Enter 送出）"
                : "輸入你的回答...（Enter 送出，Shift+Enter 換行）"}
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none leading-relaxed py-1"
          />
          {voice.isListening && interim && (
            <div className="text-xs text-muted-foreground italic mt-1">
              <span className="text-red-500">•</span> {interim}
            </div>
          )}
        </div>
        {showMic && (
          <button
            type="button"
            onClick={voice.toggle}
            disabled={disabled}
            title={voice.isListening ? "停止錄音" : "開始語音輸入"}
            className={cn(
              "rounded-lg p-2 transition-colors shrink-0 border",
              voice.isListening
                ? "bg-red-500 text-white border-red-500 hover:bg-red-600 animate-pulse"
                : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            {voice.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
        <button type="submit" disabled={!input.trim() || disabled} className={cn("rounded-lg p-2 transition-colors shrink-0", input.trim() && !disabled ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground")}>
          <Send className="h-4 w-4" />
        </button>
      </form>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl border bg-card p-6 shadow-lg max-w-sm mx-4 space-y-4">
            <h3 className="text-lg font-semibold">確定結束面試？</h3>
            <p className="text-sm text-muted-foreground">你目前已回答了 {questionCount - 1} 題。確定要結束面試並產生報告嗎？</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowConfirm(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors">繼續面試</button>
              <button onClick={() => { setShowConfirm(false); onEndInterview(); }} className="rounded-lg bg-destructive text-primary-foreground px-4 py-2 text-sm hover:bg-destructive/90 transition-colors">結束並查看報告</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
