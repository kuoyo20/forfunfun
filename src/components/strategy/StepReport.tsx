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
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-[10px] tracking-[2px] text-stone uppercase">
          ✦ 執行報告
        </p>
        <h2 className="font-serif text-lg font-bold text-foreground mt-2">
          {formData.brandName} — 策略執行計畫
        </h2>
      </div>

      {/* Basic Info */}
      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">基本資訊</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-stone">品牌：</span>
            <span className="text-foreground">{formData.brandName}</span>
          </div>
          <div>
            <span className="text-stone">對象：</span>
            <span className="text-foreground">
              {targetLabels[formData.targetType]}
            </span>
          </div>
          <div>
            <span className="text-stone">產品：</span>
            <span className="text-foreground">{formData.product}</span>
          </div>
          <div>
            <span className="text-stone">模式：</span>
            <span className="text-foreground">
              {modeLabels[formData.salesMode]}
            </span>
          </div>
        </div>
      </section>

      {/* Diagnostic Summary */}
      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">診斷摘要</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>{diagnosticData.targetAnalysis}</p>
          <p>{diagnosticData.productFit}</p>
          <p>
            <span className="font-medium text-foreground">建議方式：</span>
            {diagnosticData.recommendedApproach}
          </p>
        </div>
      </section>

      {/* Strategy Summary */}
      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">對策摘要</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>{strategyData.competitorAnalysis}</p>
          <p>{strategyData.pricingStrategy}</p>
          <p>{strategyData.followUpPlan}</p>
        </div>
      </section>

      {/* Revenue Table */}
      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">預估營收</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-stone">
              <th className="pb-2">品項</th>
              <th className="pb-2">單價</th>
              <th className="pb-2">數量</th>
              <th className="pb-2 text-right">小計</th>
            </tr>
          </thead>
          <tbody>
            {revenueItems
              .filter((r) => r.itemName)
              .map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="py-2">{r.itemName}</td>
                  <td className="py-2">{r.unitPrice.toLocaleString()}</td>
                  <td className="py-2">{r.quantity}</td>
                  <td className="py-2 text-right">
                    {(r.unitPrice * r.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="font-bold text-foreground">
              <td className="pt-3" colSpan={3}>
                總計
              </td>
              <td className="pt-3 text-right">
                {totalRevenue.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <button
        onClick={onGoBack}
        className="w-full py-2.5 border border-border rounded-md text-sm text-foreground hover:bg-muted transition"
      >
        返回修改策略
      </button>
    </div>
  );
}
