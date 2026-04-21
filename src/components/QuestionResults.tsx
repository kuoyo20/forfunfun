import { forwardRef } from 'react';
import type { Question, FormData } from '@/types';
import { ROLE_LABELS } from '@/constants';
import QuestionCard from '@/components/QuestionCard';
import ResultActions from '@/components/ResultActions';
import BrandReminders from '@/components/BrandReminders';

interface QuestionResultsProps {
  formData: FormData;
  questions: Question[];
  exportingPdf: boolean;
  exportingPptx: boolean;
  onShareText: () => Promise<void>;
  onSharePdf: () => Promise<void>;
  onGeneratePptx: () => Promise<void>;
  onCopyNblm: () => void;
  onCopyAll: () => void;
  onReset: () => void;
}

const QuestionResults = forwardRef<HTMLDivElement, QuestionResultsProps>(({
  formData, questions, exportingPdf, exportingPptx,
  onShareText, onSharePdf, onGeneratePptx,
  onCopyNblm, onCopyAll, onReset,
}, ref) => (
  <div ref={ref} className="animate-fade-in space-y-4 md:space-y-6">
    {/* Result Header */}
    <div data-pdf-section className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-5 flex flex-col gap-3 md:gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent" />
          <h2 className="text-base md:text-lg font-bold text-foreground">{formData.clientName} 進攻計畫</h2>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground">
          對象：{ROLE_LABELS[formData.targetRole]} ｜ 產品：{formData.product}
        </p>
      </div>
      <ResultActions
        onShareText={onShareText}
        onSharePdf={onSharePdf}
        onGeneratePptx={onGeneratePptx}
        onCopyNblm={onCopyNblm}
        onCopyAll={onCopyAll}
        onReset={onReset}
        exportingPdf={exportingPdf}
        exportingPptx={exportingPptx}
      />
    </div>

    {/* Question Cards */}
    <div className="space-y-3 md:space-y-4">
      {questions.map((q, index) => (
        <QuestionCard key={q.id + index} question={q} index={index} />
      ))}
    </div>

    <BrandReminders />
  </div>
));

QuestionResults.displayName = 'QuestionResults';

export default QuestionResults;
