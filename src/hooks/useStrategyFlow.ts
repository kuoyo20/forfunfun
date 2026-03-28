import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  FormData,
  DiagnosticData,
  StrategyData,
  RevenueItem,
} from "@/components/strategy/types";

export function useStrategyFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [formData, setFormData] = useState<FormData>({
    brandName: "",
    targetType: "chef",
    product: "",
    salesMode: "craftsman",
    mainItems: "",
    notes: "",
  });
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(
    null,
  );
  const [strategyData, setStrategyData] = useState<StrategyData | null>(null);
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([
    { id: crypto.randomUUID(), itemName: "", unitPrice: 0, quantity: 0 },
  ]);

  const handleRunDiagnosis = async () => {
    if (!formData.brandName.trim() || !formData.product.trim()) {
      toast.error("請填寫品牌名稱和產品名稱");
      return;
    }

    setLoading(true);
    setLoadingMessage("AI 正在分析客戶特性與生成策略...");
    try {
      const { data, error } = await supabase.functions.invoke(
        "sales-diagnosis",
        {
          body: {
            brandName: formData.brandName,
            targetType: formData.targetType,
            product: formData.product,
            salesMode: formData.salesMode,
            mainItems: formData.mainItems,
            notes: formData.notes,
          },
        },
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setDiagnosticData(data as DiagnosticData);
      setCurrentStep(1);
    } catch (err) {
      console.error("Diagnosis error:", err);
      toast.error(
        err instanceof Error ? err.message : "診斷分析失敗，請稍後再試。",
      );
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleSearchTrends = async () => {
    setLoading(true);
    setLoadingMessage("AI 正在搜尋亞洲市場趨勢...");
    try {
      const { data, error } = await supabase.functions.invoke("sales-trends", {
        body: {
          brandName: formData.brandName,
          targetType: formData.targetType,
          product: formData.product,
          salesMode: formData.salesMode,
          mainItems: formData.mainItems,
          targetScale: String(revenueItems.length),
          newItems: revenueItems
            .filter((r) => r.itemName)
            .map((r) => r.itemName)
            .join("、"),
          diagnosticSummary: diagnosticData
            ? `${diagnosticData.targetAnalysis} ${diagnosticData.productFit}`
            : "",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStrategyData(data as StrategyData);
      setCurrentStep(2);
    } catch (err) {
      console.error("Trends error:", err);
      toast.error(
        err instanceof Error ? err.message : "趨勢搜尋失敗，請稍後再試。",
      );
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleGenerateReport = () => {
    setCurrentStep(3);
  };

  return {
    currentStep,
    setCurrentStep,
    loading,
    loadingMessage,
    formData,
    setFormData,
    diagnosticData,
    strategyData,
    revenueItems,
    setRevenueItems,
    handleRunDiagnosis,
    handleSearchTrends,
    handleGenerateReport,
  };
}
