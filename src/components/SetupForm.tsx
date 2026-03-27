import { useState } from "react";
import type { InterviewConfig } from "@/types/interview";
import { cn } from "@/lib/utils";

interface SetupFormProps {
  onStart: (config: InterviewConfig) => void;
}

const TOPIC_OPTIONS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "System Design",
  "Data Structures",
  "Algorithms",
  "CSS",
  "Testing",
  "DevOps",
];

const DIFFICULTY_OPTIONS = [
  { value: "junior" as const, label: "Junior", description: "0-2 years experience" },
  { value: "mid" as const, label: "Mid-Level", description: "2-5 years experience" },
  { value: "senior" as const, label: "Senior", description: "5+ years experience" },
];

export default function SetupForm({ onStart }: SetupFormProps) {
  const [position, setPosition] = useState("");
  const [difficulty, setDifficulty] = useState<InterviewConfig["difficulty"]>("mid");
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Interview Practice</h1>
        <p className="text-muted-foreground">
          Configure your mock interview session and practice with AI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
          {/* Position */}
          <div className="space-y-2">
            <label htmlFor="position" className="text-sm font-medium">
              Position Title
            </label>
            <input
              id="position"
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty Level</label>
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

          {/* Topics */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Topics ({selectedTopics.length} selected)
            </label>
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
          </div>

          {/* Settings row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="maxQuestions" className="text-sm font-medium">
                Max Questions
              </label>
              <select
                id="maxQuestions"
                value={maxQuestions}
                onChange={(e) => setMaxQuestions(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} questions
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="timeLimit" className="text-sm font-medium">
                Time Limit
              </label>
              <select
                id="timeLimit"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {[10, 15, 20, 30, 45, 60].map((n) => (
                  <option key={n} value={n}>
                    {n} minutes
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!isValid}
          className={cn(
            "w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors",
            isValid
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Start Interview
        </button>
      </form>
    </div>
  );
}
