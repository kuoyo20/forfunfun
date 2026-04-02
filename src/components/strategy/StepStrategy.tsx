import { Plus, Trash2 } from "lucide-react";
import type { DiagnosticData, StrategyData, RevenueItem } from "./types";
import { Prose } from "./Prose";

interface DiagnosticPhaseProps {
  phase: "diagnostic";
  diagnosticData: DiagnosticData;
  revenueItems: RevenueItem[];
  setRevenueItems: React.Dispatch<React.SetStateAction<RevenueItem[]>>;
  onSearchTrends: () => void;
  strategyData?: never;
  onGenerateReport?: never;
}

interface ProposalPhaseProps {
  phase: "proposal";
  strategyData: StrategyData;
  diagnosticData: DiagnosticData;
  onGenerateReport: () => void;
  revenueItems?: never;
  setRevenueItems?: never;
  onSearchTrends?: never;
}

type StepStrategyProps = DiagnosticPhaseProps | ProposalPhaseProps;

function Card({
  label,
  title,
  children,
}: {
  label?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border/60 rounded-xl p-6 shadow-sm">
      {label && (
        <p className="text-[9px] tracking-[2px] text-primary/70 uppercase mb-1">
          {label}
        </p>
      )}
      <h3 className="text-sm font-bold text-foreground mb-4 pb-3 border-b border-border/40">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function StepStrategy(props: StepStrategyProps) {
  if (props.phase === "diagnostic") {
    return <DiagnosticView {...props} />;
  }
  return <ProposalView {...props} />;
}

function DiagnosticView({
  diagnosticData,
  revenueItems,
  setRevenueItems,
  onSearchTrends,
}: DiagnosticPhaseProps) {
  const addItem = () => {
    setRevenueItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), itemName: "", unitPrice: 0, quantity: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setRevenueItems((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev,
    );
  };

  const updateItem = (
    id: string,
    field: keyof RevenueItem,
    value: string | number,
  ) => {
    setRevenueItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card label="Diagnostic" title="客戶洞察分析">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-[10px] tracking-widest text-primary/70 uppercase mb-2">
                目標分析
              </p>
              <Prose>{diagnosticData.targetAnalysis}</Prose>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-[10px] tracking-widest text-primary/70 uppercase mb-2">
                產品適配度
              </p>
              <Prose>{diagnosticData.productFit}</Prose>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-[10px] tracking-widest text-primary/70 uppercase mb-2">
              客戶痛點
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {diagnosticData.painPoints.map((p, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                    {i + 1}
                  </span>
                  <Prose>{p}</Prose>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-[10px] tracking-widest text-primary/70 uppercase mb-2">
              開場策略
            </p>
            <Prose>{diagnosticData.openingStrategy}</Prose>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-[10px] tracking-widest text-primary/70 uppercase mb-2">
              建議方式
            </p>
            <Prose>{diagnosticData.recommendedApproach}</Prose>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-[10px] tracking-widest text-primary/70 uppercase mb-2">
              關鍵訊息
            </p>
            <div className="space-y-2">
              {diagnosticData.keyMessages.map((m, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-primary/60 text-xs mt-0.5">✦</span>
                  <Prose>{m}</Prose>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card label="Revenue Planning" title="營收品項規劃">
        <div className="space-y-3">
          {revenueItems.map((item, index) => (
            <div
              key={item.id}
              className="flex gap-3 items-end bg-muted/30 rounded-lg p-3"
            >
              <span className="text-[10px] text-stone font-mono mb-2">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <label className="block text-[10px] text-stone mb-1 tracking-wide">
                  品項名稱
                </label>
                <input
                  type="text"
                  value={item.itemName}
                  onChange={(e) =>
                    updateItem(item.id, "itemName", e.target.value)
                  }
                  placeholder="輸入品項..."
                  className="w-full px-3 py-2 border border-border/60 rounded-lg text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
                />
              </div>
              <div className="w-24">
                <label className="block text-[10px] text-stone mb-1 tracking-wide">
                  單價
                </label>
                <input
                  type="number"
                  value={item.unitPrice || ""}
                  onChange={(e) =>
                    updateItem(item.id, "unitPrice", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-border/60 rounded-lg text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
                />
              </div>
              <div className="w-20">
                <label className="block text-[10px] text-stone mb-1 tracking-wide">
                  數量
                </label>
                <input
                  type="number"
                  value={item.quantity || ""}
                  onChange={(e) =>
                    updateItem(item.id, "quantity", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-border/60 rounded-lg text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
                />
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-stone hover:text-destructive rounded-lg hover:bg-destructive/5 transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition mt-2"
          >
            <Plus size={14} /> 新增品項
          </button>
        </div>
      </Card>

      <button
        onClick={onSearchTrends}
        className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl text-sm font-medium hover:shadow-md hover:shadow-primary/20 transition-all duration-300"
      >
        搜尋亞洲市場趨勢 →
      </button>
    </div>
  );
}

function ProposalView({
  strategyData,
  diagnosticData,
  onGenerateReport,
}: ProposalPhaseProps) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center mb-2">
        <p className="text-[10px] tracking-[3px] text-primary/70 uppercase">
          ✦ Market Intelligence ✦
        </p>
        <h2 className="font-serif text-lg font-bold text-foreground mt-1">
          趨勢洞察與對策提案
        </h2>
      </div>

      <Card label="Trend Insights" title="亞洲市場趨勢洞察">
        <div className="space-y-3">
          {strategyData.trendInsights.map((t, i) => (
            <div key={i} className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
              <span className="mt-0.5 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                {i + 1}
              </span>
              <Prose>{t}</Prose>
            </div>
          ))}
        </div>
      </Card>

      <Card label="Competitor Analysis" title="競爭態勢分析">
        <Prose>{strategyData.competitorAnalysis}</Prose>
      </Card>

      <Card label="Pricing" title="定價策略建議">
        <Prose>{strategyData.pricingStrategy}</Prose>
      </Card>

      <Card label="Proposal" title="提案大綱">
        <div className="space-y-2">
          {strategyData.proposalOutline.map((p, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-primary/50 font-mono text-xs mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Prose>{p}</Prose>
            </div>
          ))}
        </div>
      </Card>

      <Card label="Closing" title="成交關鍵技巧">
        <div className="space-y-2">
          {strategyData.closingTechniques.map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary/60 text-xs mt-0.5">✦</span>
              <Prose>{c}</Prose>
            </div>
          ))}
        </div>
      </Card>

      <Card label="Review" title="診斷摘要回顧">
        <Prose>{diagnosticData.targetAnalysis}</Prose>
      </Card>

      <button
        onClick={onGenerateReport}
        className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl text-sm font-medium hover:shadow-md hover:shadow-primary/20 transition-all duration-300"
      >
        生成執行報告 →
      </button>
    </div>
  );
}
