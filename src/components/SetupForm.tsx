import { useState } from "react";
import type { InterviewConfig } from "@/types/interview";
import { cn } from "@/lib/utils";
import { History } from "lucide-react";

interface SetupFormProps {
  onStart: (config: InterviewConfig) => void;
  onViewHistory: () => void;
}

const TOPIC_OPTIONS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "系統設計",
  "資料結構",
  "演算法",
  "CSS",
  "測試",
  "DevOps",
];

const DIFFICULTY_OPTIONS = [
  { value: "junior" as const, label: "初階", description: "0-2 年經驗" },
  { value: "mid" as const, label: "中階", description: "2-5 年經驗" },
  { value: "senior" as const, label: "資深", description: "5 年以上經驗" },
];

export default function SetupForm({ onStart, onViewHistory }: SetupFormProps) {
  const [position, setPosition] = useState("");
  const [difficulty, setDifficulty] = useState<InterviewConfig["difficulty"]>("mid");
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!position.trim() || selectedTopics.length === 0) return;
    onStart({
      position: position.trim(),
      difficulty,
      maxQuestions,
      timeLimitMinutes,
      topics: selectedTopics,
    });
  };

  const isValid = position.trim() !== "" && selectedTopics.length > 0;
  const showPositionError = submitted && !position.trim();
  const showTopicError = submitted && selectedTopics.length === 0;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI 模擬面試</h1>
        <p className="text-muted-foreground">
          設定你的模擬面試，開始與 AI 練習
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
          <div className="space-y-2">
            <label htmlFor="position" className="text-sm font-medium">應徵職位</label>
            <input
              id="position"
              type="text"
              placeholder="例如：資深前端工程師"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className={cn(
                "w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                showPositionError ? "border-destructive" : "border-input"
              )}
            />
            {showPositionError && (
              <p className="text-xs text-destructive">請輸入應徵職位</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">難度等級</label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDifficulty(opt.value)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    difficulty === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">面試主題（已選 {selectedTopics.length} 個）</label>
            <div className="flex flex-wrap gap-2">
              {TOPIC_OPTIONS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm border transition-colors",
                    selectedTopics.includes(topic)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {topic}
                </button>
              ))}
            </div>
            {showTopicError && (
              <p className="text-xs text-destructive">請至少選擇一個主題</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="maxQuestions" className="text-sm font-medium">最大題數</label>
              <select id="maxQuestions" value={maxQuestions} onChange={(e) => setMaxQuestions(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {[5, 10, 15, 20].map((n) => (<option key={n} value={n}>{n} 題</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="timeLimit" className="text-sm font-medium">時間限制</label>
              <select id="timeLimit" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {[10, 15, 20, 30, 45, 60].map((n) => (<option key={n} value={n}>{n} 分鐘</option>))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onViewHistory} className="flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium hover:bg-accent transition-colors">
            <History className="h-4 w-4" />
            歷史紀錄
          </button>
          <button
            type="submit"
            disabled={submitted && !isValid}
            className={cn(
              "flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              !submitted || isValid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            開始面試
          </button>
        </div>
      </form>
    </div>
  );
}
