import { Prose } from "./Prose";
import type {
  FormData,
  DiagnosticData,
  StrategyData,
  RevenueItem,
} from "./types";

interface StepReportProps {
  formData: FormData;
  diagnosticData: DiagnosticData;
  strategyData: StrategyData;
  revenueItems: RevenueItem[];
  setRevenueItems: React.Dispatch<React.SetStateAction<RevenueItem[]>>;
  targetLabels: Record<string, string>;
  modeLabels: Record<string, string>;
  onGoBack: () => void;
}

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

export function StepReport({
  formData,
  diagnosticData,
  strategyData,
  revenueItems,
  targetLabels,
  modeLabels,
  onGoBack,
}: StepReportProps) {
  const totalRevenue = revenueItems.reduce(
    (sum, r) => sum + r.unitPrice * r.quantity,
    0,
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Report Header */}
      <div className="text-center mb-2">
        <p className="text-[9px] tracking-[3px] text-primary/70 uppercase">
          ✦ Executive Report ✦
        </p>
        <h2 className="font-serif text-xl font-bold text-foreground mt-2">
          {formData.brandName}
        </h2>
        <p className="text-xs text-stone mt-1">策略執行計畫書</p>
      </div>

      {/* Basic Info */}
      <Card label="Overview" title="基本資訊">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "品牌", value: formData.brandName },
            { label: "對象", value: targetLabels[formData.targetType] },
            { label: "產品", value: formData.product },
            { label: "銷售模式", value: modeLabels[formData.salesMode] },
          ].map((item) => (
            <div key={item.label} className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] tracking-widest text-primary/70 uppercase mb-1">
                {item.label}
              </p>
              <p className="text-sm font-medium text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Diagnostic Summary */}
      <Card label="Diagnostic" title="診斷摘要">
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-[10px] tracking-widest text-primary/70 uppercase mb-2">
              目標分析
            </p>
            <Prose>{diagnosticData.targetAnalysis}</Prose>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-[10px] tracking-widest text-primary/70 uppercase mb-2">
              產品適配
            </p>
            <Prose>{diagnosticData.productFit}</Prose>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-[10px] tracking-widest text-primary/70 uppercase mb-2">
              建議方式
            </p>
            <Prose>{diagnosticData.recommendedApproach}</Prose>
          </div>
        </div>
      </Card>

      {/* Strategy Summary */}
      <Card label="Strategy" title="對策摘要">
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-[10px] tracking-widest text-primary/70 uppercase mb-2">
              競爭分析
            </p>
            <Prose>{strategyData.competitorAnalysis}</Prose>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-[10px] tracking-widest text-primary/70 uppercase mb-2">
              定價策略
            </p>
            <Prose>{strategyData.pricingStrategy}</Prose>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-[10px] tracking-widest text-primary/70 uppercase mb-2">
              跟進計畫
            </p>
            <Prose>{strategyData.followUpPlan}</Prose>
          </div>
        </div>
      </Card>

      {/* Revenue Table */}
      <Card label="Revenue Forecast" title="預估營收">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left">
                <th className="pb-3 text-[10px] tracking-widest text-primary/70 uppercase font-medium">
                  品項
                </th>
                <th className="pb-3 text-[10px] tracking-widest text-primary/70 uppercase font-medium">
                  單價
                </th>
                <th className="pb-3 text-[10px] tracking-widest text-primary/70 uppercase font-medium">
                  數量
                </th>
                <th className="pb-3 text-[10px] tracking-widest text-primary/70 uppercase font-medium text-right">
                  小計
                </th>
              </tr>
            </thead>
            <tbody>
              {revenueItems
                .filter((r) => r.itemName)
                .map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/30 hover:bg-muted/30 transition"
                  >
                    <td className="py-3 text-foreground">{r.itemName}</td>
                    <td className="py-3 text-muted-foreground font-mono">
                      {r.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-3 text-muted-foreground font-mono">
                      {r.quantity}
                    </td>
                    <td className="py-3 text-right text-foreground font-mono">
                      {(r.unitPrice * r.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="font-bold text-foreground">
                <td className="pt-4 text-sm" colSpan={3}>
                  總計
                </td>
                <td className="pt-4 text-right font-mono text-primary text-base">
                  {totalRevenue.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <button
        onClick={onGoBack}
        className="w-full py-3 border border-border/60 rounded-xl text-sm text-foreground hover:bg-muted/50 transition-all duration-300"
      >
        ← 返回修改策略
      </button>
    </div>
  );
}
