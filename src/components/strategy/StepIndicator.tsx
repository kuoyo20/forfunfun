const STEPS = ["輸入資訊", "診斷分析", "趨勢對策", "執行報告"];

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  ${i <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                `}
              >
                {i + 1}
              </span>
              <span
                className={`text-xs hidden sm:inline ${i <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-6 sm:w-12 h-px ${i < currentStep ? "bg-primary" : "bg-border"}`}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
