import { Plus, Trash2 } from "lucide-react";
import type { DiagnosticData, StrategyData, RevenueItem } from "./types";

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
    setRevenueItems((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const updateItem = (id: string, field: keyof RevenueItem, value: string | number) => {
    setRevenueItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  return (
    <div className="space-y-6">
      {/* Diagnostic Results */}
      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">診斷結果</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">目標分析：</span>
            {diagnosticData.targetAnalysis}
          </div>
          <div>
            <span className="font-medium text-foreground">產品適配：</span>
            {diagnosticData.productFit}
          </div>
          <div>
            <span className="font-medium text-foreground">痛點：</span>
            <ul className="list-disc ml-5 mt-1">
              {diagnosticData.painPoints.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="font-medium text-foreground">開場策略：</span>
            {diagnosticData.openingStrategy}
          </div>
          <div>
            <span className="font-medium text-foreground">建議方式：</span>
            {diagnosticData.recommendedApproach}
          </div>
          <div>
            <span className="font-medium text-foreground">關鍵訊息：</span>
            <ul className="list-disc ml-5 mt-1">
              {diagnosticData.keyMessages.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Revenue Items */}
      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">
          營收品項規劃
        </h3>
        <div className="space-y-3">
          {revenueItems.map((item) => (
            <div key={item.id} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-[10px] text-stone mb-1">
                  品項名稱
                </label>
                <input
                  type="text"
                  value={item.itemName}
                  onChange={(e) =>
                    updateItem(item.id, "itemName", e.target.value)
                  }
                  className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background"
                />
              </div>
              <div className="w-24">
                <label className="block text-[10px] text-stone mb-1">
                  單價
                </label>
                <input
                  type="number"
                  value={item.unitPrice || ""}
                  onChange={(e) =>
                    updateItem(item.id, "unitPrice", Number(e.target.value))
                  }
                  className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background"
                />
              </div>
              <div className="w-20">
                <label className="block text-[10px] text-stone mb-1">
                  數量
                </label>
                <input
                  type="number"
                  value={item.quantity || ""}
                  onChange={(e) =>
                    updateItem(item.id, "quantity", Number(e.target.value))
                  }
                  className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background"
                />
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="p-1.5 text-stone hover:text-destructive transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={addItem}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus size={12} /> 新增品項
          </button>
        </div>
      </section>

      <button
        onClick={onSearchTrends}
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition"
      >
        搜尋亞洲市場趨勢
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
    <div className="space-y-6">
      <div className="text-center mb-4">
        <p className="text-[10px] tracking-[2px] text-stone uppercase">
          ✦ 趨勢分析完成
        </p>
      </div>

      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">
          亞洲市場趨勢
        </h3>
        <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1">
          {strategyData.trendInsights.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">競爭分析</h3>
        <p className="text-sm text-muted-foreground">
          {strategyData.competitorAnalysis}
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">定價策略</h3>
        <p className="text-sm text-muted-foreground">
          {strategyData.pricingStrategy}
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">提案大綱</h3>
        <ol className="list-decimal ml-5 text-sm text-muted-foreground space-y-1">
          {strategyData.proposalOutline.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      </section>

      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">成交技巧</h3>
        <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1">
          {strategyData.closingTechniques.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </section>

      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">
          診斷摘要回顧
        </h3>
        <p className="text-sm text-muted-foreground">
          {diagnosticData.targetAnalysis}
        </p>
      </section>

      <button
        onClick={onGenerateReport}
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition"
      >
        生成執行報告
      </button>
    </div>
  );
}
