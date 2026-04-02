const STEPS = ["輸入資訊", "診斷分析", "趨勢對策", "執行報告"];

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <nav className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
      <ol className="flex items-center justify-between">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${
                    i < currentStep
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : i === currentStep
                        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/30 scale-110"
                        : "bg-muted text-muted-foreground"
                  }
                `}
              >
                {i < currentStep ? "✓" : i + 1}
              </span>
              <span
                className={`text-[10px] tracking-wide hidden sm:block transition-colors ${
                  i <= currentStep
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-3 mt-[-1.2rem] sm:mt-[-1.8rem]">
                <div
                  className={`h-px transition-colors duration-300 ${
                    i < currentStep ? "bg-primary" : "bg-border"
                  }`}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
