import { useState, useRef, useCallback } from 'react';
import { useQuestionGenerator } from '@/hooks/useQuestionGenerator';
import { useExport } from '@/hooks/useExport';
import { useShareText } from '@/hooks/useShareText';
import Header from '@/components/Header';
import QuestionForm from '@/components/QuestionForm';
import QuestionResults from '@/components/QuestionResults';
import SalesChatBot from '@/components/SalesChatBot';

const Index = () => {
  const {
    formData, questions, generated, aiLoading, useAI,
    setFormData, setUseAI, generate, reset,
  } = useQuestionGenerator();

  const { exportPdf, exportPptx, exportingPdf, exportingPptx } = useExport(formData, questions);
  const { getShareText, getNblmPrompt } = useShareText(formData, questions);

  const [clientResearch, setClientResearch] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleResearchReady = useCallback((research: string) => {
    setClientResearch(research);
  }, []);

  const handleGenerate = () => generate(clientResearch);

  const handleReset = () => {
    reset();
    setClientResearch(null);
  };

  const handleShareText = async () => {
    const text = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: `${formData.clientName} 進攻計畫`, text });
        return;
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return;
      }
    }
    await navigator.clipboard.writeText(text);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(getShareText());
  };

  const handleCopyNblm = () => {
    navigator.clipboard.writeText(getNblmPrompt());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-3 md:px-4 py-4 md:py-8">
        {!generated && (
          <QuestionForm
            formData={formData}
            useAI={useAI}
            aiLoading={aiLoading}
            onFormChange={setFormData}
            onToggleAI={setUseAI}
            onResearchReady={handleResearchReady}
            onSubmit={handleGenerate}
          />
        )}

        {generated && (
          <QuestionResults
            ref={resultsRef}
            formData={formData}
            questions={questions}
            exportingPdf={exportingPdf}
            exportingPptx={exportingPptx}
            onShareText={handleShareText}
            onSharePdf={() => exportPdf(resultsRef)}
            onGeneratePptx={() => exportPptx(clientResearch)}
            onCopyNblm={handleCopyNblm}
            onCopyAll={handleCopyAll}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} Miaolin Foods Sales Support System
      </footer>

      <SalesChatBot />
    </div>
  );
};

export default Index;
