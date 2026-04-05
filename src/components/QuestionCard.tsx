import type { Question } from '@/types';
import { getBadgeStyle, getBadgeLabel } from '@/utils/questionBadge';

interface QuestionCardProps {
  question: Question;
  index: number;
}

const QuestionCard = ({ question, index }: QuestionCardProps) => (
  <div
    data-pdf-section
    className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-5 animate-fade-in"
    style={{ animationDelay: `${index * 60}ms` }}
  >
    <div className="flex items-center justify-between mb-2 md:mb-3">
      <span className="text-xs font-bold text-muted-foreground">問題 #{index + 1}</span>
      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getBadgeStyle(question.type)}`}>
        {getBadgeLabel(question.type)}
      </span>
    </div>

    <p className="text-foreground font-medium mb-3 md:mb-4 leading-relaxed text-[15px] md:text-base">
      {question.ask}
    </p>

    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3">
      <div className="rounded-lg bg-listen-bg border border-listen-border p-3">
        <p className="text-xs font-bold text-muted-foreground mb-1">📌 聆聽重點</p>
        <p className="text-sm text-foreground leading-relaxed">{question.listen}</p>
      </div>
      <div className="rounded-lg bg-praise-bg border border-praise-border p-3">
        <p className="text-xs font-bold text-muted-foreground mb-1">⭐ 讚美話術</p>
        <p className="text-sm text-foreground leading-relaxed">{question.praise}</p>
      </div>
    </div>
  </div>
);

export default QuestionCard;
