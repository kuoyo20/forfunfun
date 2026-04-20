import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import { useQuestionGenerator } from '@/hooks/useQuestionGenerator';
import { useExport } from '@/hooks/useExport';
import { useShareText } from '@/hooks/useShareText';
import { useClient } from '@/hooks/useClients';
import { useVisits } from '@/hooks/useVisits';
import Header from '@/components/Header';
import QuestionForm from '@/components/QuestionForm';
import QuestionResults from '@/components/QuestionResults';
import SalesChatBot from '@/components/SalesChatBot';
import type { RoleKey, HistoryKey } from '@/types';

function buildHistoryContext(visits: { visit_date: string; product_discussed: string | null; client_reaction: string | null; key_findings: string | null; next_action: string | null }[]): string {
  if (visits.length === 0) return '';
  const recent = visits.slice(0, 3);
  const lines = recent.map((v, i) => {
    const date = new Date(v.visit_date).toLocaleDateString('zh-TW');
    const parts = [`【第 ${i + 1} 次拜訪 — ${date}】`];
    if (v.product_discussed) parts.push(`推廣：${v.product_discussed}`);
    if (v.client_reaction) parts.push(`客戶反應：${v.client_reaction}`);
    if (v.key_findings) parts.push(`關鍵發現：${v.key_findings}`);
    if (v.next_action) parts.push(`承諾事項：${v.next_action}`);
    return parts.join('\n');
  });
  return `\n\n【過往拜訪脈絡】\n${lines.join('\n\n')}`;
}

const QuestionGenerator = () => {
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get('clientId') || undefined;

  const { client } = useClient(clientIdParam);
  const { visits } = useVisits(clientIdParam);

  const {
    formData, questions, generated, aiLoading, useAI,
    setFormData, setUseAI, generate, reset,
  } = useQuestionGenerator();

  const { exportPdf, exportPptx, exportingPdf, exportingPptx } = useExport(formData, questions);
  const { getShareText, getNblmPrompt } = useShareText(formData, questions);

  const [clientResearch, setClientResearch] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Pre-populate form from CRM client
  useEffect(() => {
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientName: client.name,
        targetRole: (client.contact_role && ['boss', 'chef', 'purchaser', 'marketing'].includes(client.contact_role)
          ? client.contact_role
          : 'boss') as RoleKey,
        history: (client.status === 'active' ? 'existing' : 'new') as HistoryKey,
      }));
    }
  }, [client, setFormData]);

  const historyContext = useMemo(() => buildHistoryContext(visits), [visits]);

  const handleResearchReady = useCallback((research: string) => {
    setClientResearch(research);
  }, []);

  const handleGenerate = () => {
    const combinedContext = [clientResearch, historyContext].filter(Boolean).join('\n');
    generate(combinedContext || null);
  };

  const handleReset = () => {
    reset();
    setClientResearch(null);
  };

  const handleShareText = async () => {
    const text = getShareText();
    if (navigator.share) {
      try { await navigator.share({ title: `${formData.clientName} 進攻計畫`, text }); return; }
      catch (e) { if ((e as DOMException).name === 'AbortError') return; }
    }
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-3 md:px-4 py-4 md:py-6">
        {clientIdParam && client && !generated && (
          <div className="mb-4 bg-accent/10 border border-accent/30 rounded-lg p-3 flex items-center gap-2 text-sm">
            <Link to={`/clients/${client.id}`} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft size={14} />
            </Link>
            <History size={14} className="text-accent" />
            <span className="text-foreground">
              將帶入 <strong>{client.name}</strong> 的
              <span className="text-accent font-bold"> 過往 {visits.length} 次拜訪脈絡 </span>
              生成精準提問
            </span>
          </div>
        )}

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
            onCopyNblm={() => navigator.clipboard.writeText(getNblmPrompt())}
            onCopyAll={() => navigator.clipboard.writeText(getShareText())}
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

export default QuestionGenerator;
