import { useState } from 'react';
import { Share2, Loader2, Presentation, FileText, Copy, RefreshCw } from 'lucide-react';

interface ResultActionsProps {
  onShareText: () => Promise<void>;
  onSharePdf: () => Promise<void>;
  onGeneratePptx: () => Promise<void>;
  onCopyNblm: () => void;
  onCopyAll: () => void;
  onReset: () => void;
  exportingPdf: boolean;
  exportingPptx: boolean;
}

const ResultActions = ({
  onShareText, onSharePdf, onGeneratePptx,
  onCopyNblm, onCopyAll, onReset,
  exportingPdf, exportingPptx,
}: ResultActionsProps) => {
  const [copied, setCopied] = useState(false);
  const [nblmCopied, setNblmCopied] = useState(false);

  const handleCopyAll = () => {
    onCopyAll();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyNblm = () => {
    onCopyNblm();
    setNblmCopied(true);
    setTimeout(() => setNblmCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
      <button onClick={onShareText} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm min-h-[44px]">
        <Share2 size={14} /> 分享文字
      </button>
      <button onClick={onSharePdf} disabled={exportingPdf} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50 min-h-[44px]">
        {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
        {exportingPdf ? '處理中...' : '分享 PDF'}
      </button>
      <button onClick={onGeneratePptx} disabled={exportingPptx} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50 min-h-[44px]">
        {exportingPptx ? <Loader2 size={14} className="animate-spin" /> : <Presentation size={14} />}
        {exportingPptx ? '生成中...' : '生成簡報'}
      </button>
      <button onClick={handleCopyNblm} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors min-h-[44px]">
        <FileText size={14} /> {nblmCopied ? '已複製！' : 'NBLM 指令'}
      </button>
      <button onClick={handleCopyAll} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors min-h-[44px]">
        <Copy size={14} /> {copied ? '已複製！' : '複製全部'}
      </button>
      <button onClick={onReset} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors min-h-[44px]">
        <RefreshCw size={14} /> 重新設定
      </button>
    </div>
  );
};

export default ResultActions;
