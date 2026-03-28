import { StepIndicator } from "@/components/strategy/StepIndicator";
import { StepInput } from "@/components/strategy/StepInput";
import { StepStrategy } from "@/components/strategy/StepStrategy";
import { StepReport } from "@/components/strategy/StepReport";
import { LoadingOverlay } from "@/components/strategy/LoadingOverlay";
import { useStrategyFlow } from "@/hooks/useStrategyFlow";

const TARGET_LABELS: Record<string, string> = {
  chef: "主廚",
  owner: "經營者",
  procurement: "採購經理",
};

const MODE_LABELS: Record<string, string> = {
  craftsman: "職人匠心",
  wolf: "華爾街之狼",
  spin: "SPIN 顧問",
  challenger: "挑戰者模式",
};

const Index = () => {
  const {
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
  } = useStrategyFlow();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
          <div>
            <p className="text-[9px] sm:text-[10px] tracking-[2px] sm:tracking-[3px] text-stone uppercase">
              Since 1964 · Miaolin Strategy
            </p>
            <h1 className="font-serif text-base sm:text-xl font-bold text-foreground mt-0.5 sm:mt-1">
              引領亞洲食材與餐飲趨勢
            </h1>
          </div>
          <div className="sm:text-right">
            <p className="text-[9px] sm:text-[10px] tracking-[1px] sm:tracking-[2px] text-gold font-bold uppercase">
              價值工程師：對策執行系統
            </p>
            <p className="text-[9px] text-stone mt-0.5">v10.0</p>
          </div>
        </div>
      </header>

      <StepIndicator currentStep={currentStep} />

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {currentStep === 0 && (
          <StepInput
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleRunDiagnosis}
          />
        )}

        {currentStep === 1 && diagnosticData && (
          <div className="transition-all duration-400">
            <div className="text-center mb-8">
              <p className="text-[10px] tracking-[2px] text-stone uppercase">
                ✦ 完成輸入，啟動對策系統
              </p>
            </div>
            <StepStrategy
              phase="diagnostic"
              diagnosticData={diagnosticData}
              revenueItems={revenueItems}
              setRevenueItems={setRevenueItems}
              onSearchTrends={handleSearchTrends}
            />
          </div>
        )}

        {currentStep === 2 && strategyData && diagnosticData && (
          <div className="transition-all duration-400">
            <StepStrategy
              phase="proposal"
              strategyData={strategyData}
              diagnosticData={diagnosticData}
              onGenerateReport={handleGenerateReport}
            />
          </div>
        )}

        {currentStep === 3 && diagnosticData && strategyData && (
          <StepReport
            formData={formData}
            diagnosticData={diagnosticData}
            strategyData={strategyData}
            revenueItems={revenueItems}
            setRevenueItems={setRevenueItems}
            targetLabels={TARGET_LABELS}
            modeLabels={MODE_LABELS}
            onGoBack={() => setCurrentStep(1)}
          />
        )}
      </main>

      <footer className="border-t border-border py-8 text-center">
        <p className="font-serif text-sm text-stone">
          「讓品味，與食俱進。」
        </p>
        <p className="text-[10px] text-stone mt-2 tracking-[1px]">
          與客戶共創價值 · Since 1964
        </p>
      </footer>

      {loading && <LoadingOverlay message={loadingMessage} />}
    </div>
  );
};

export default Index;
