import { useState, useEffect, useRef } from 'react';
import { Loader2, X, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface ClientResearchProps {
  clientName: string;
  product: string;
  onResearchReady?: (research: string) => void;
  autoTrigger?: boolean;
}

const ClientResearch = ({ clientName, product, onResearchReady, autoTrigger = true }: ClientResearchProps) => {
  const [research, setResearch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearched, setLastSearched] = useState<string>('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-trigger research when client name changes (debounced)
  useEffect(() => {
    if (!autoTrigger) return;
    if (!clientName.trim() || clientName.trim().length < 2) return;
    if (clientName.trim() === lastSearched) return;

    // Clear previous timer
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      doResearch();
    }, 1500); // Wait 1.5s after user stops typing

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [clientName]);

  useEffect(() => {
    if (research && onResearchReady) {
      onResearchReady(research);
    }
  }, [research, onResearchReady]);

  const doResearch = async () => {
    const name = clientName.trim();
    if (!name) return;
    setLoading(true);
    setError(null);
    setResearch(null);
    setLastSearched(name);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('research-client', {
        body: { clientName: name, product },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setResearch(data.research);
    } catch (e) {
      setError(e instanceof Error ? e.message : '查詢失敗');
    } finally {
      setLoading(false);
    }
  };

  // Show nothing if no name entered yet
  if (!clientName.trim() || clientName.trim().length < 2) return null;

  // Loading state
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-secondary/50 p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
            <Globe size={12} className="text-primary" />
            AI 情報搜尋中 — {clientName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
          <Loader2 size={16} className="animate-spin" />
          正在搜尋並分析 {clientName} 的品牌情報...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={doResearch} className="text-xs text-primary hover:underline">重試</button>
        </div>
      </div>
    );
  }

  // Research result
  if (research) {
    return (
      <div className="rounded-lg border border-border bg-secondary/50 p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
            <Globe size={12} className="text-accent" />
            AI 客戶情報 — {lastSearched}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={doResearch} className="text-xs text-primary hover:underline">重新搜尋</button>
            <button onClick={() => { setResearch(null); setError(null); setLastSearched(''); }} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="text-sm text-foreground leading-relaxed max-h-60 overflow-y-auto prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1">
          <ReactMarkdown>{research}</ReactMarkdown>
        </div>
        <div className="mt-2 pt-2 border-t border-border">
          <span className="text-xs text-accent flex items-center gap-1">
            ✅ 情報已就緒，將自動融入 AI 生成策略
          </span>
        </div>
      </div>
    );
  }

  // Waiting state (auto-trigger will fire soon)
  if (!lastSearched && autoTrigger) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-fade-in">
        <Globe size={12} />
        <span>輸入完成後將自動搜尋品牌情報...</span>
      </div>
    );
  }

  return null;
};

export default ClientResearch;
