import type { FormData } from "./types";

interface StepInputProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: () => void;
}

const TARGET_OPTIONS = [
  { value: "chef", label: "主廚" },
  { value: "owner", label: "經營者" },
  { value: "procurement", label: "採購經理" },
] as const;

const MODE_OPTIONS = [
  { value: "craftsman", label: "職人匠心" },
  { value: "wolf", label: "華爾街之狼" },
  { value: "spin", label: "SPIN 顧問" },
  { value: "challenger", label: "挑戰者模式" },
] as const;

export function StepInput({ formData, setFormData, onSubmit }: StepInputProps) {
  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <p className="text-[10px] tracking-[2px] text-stone uppercase">
          Step 1 · 輸入基本資訊
        </p>
        <h2 className="font-serif text-lg font-bold text-foreground mt-2">
          填寫客戶與產品資料
        </h2>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            品牌名稱 *
          </label>
          <input
            type="text"
            value={formData.brandName}
            onChange={(e) => update("brandName", e.target.value)}
            placeholder="例：苗林行"
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            對象類型
          </label>
          <div className="flex gap-2">
            {TARGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("targetType", opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs border transition ${
                  formData.targetType === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            產品名稱 *
          </label>
          <input
            type="text"
            value={formData.product}
            onChange={(e) => update("product", e.target.value)}
            placeholder="例：法國 AOP 奶油"
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            銷售模式
          </label>
          <div className="flex flex-wrap gap-2">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("salesMode", opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs border transition ${
                  formData.salesMode === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            主力品項
          </label>
          <input
            type="text"
            value={formData.mainItems}
            onChange={(e) => update("mainItems", e.target.value)}
            placeholder="例：奶油、起司、鮮奶油"
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            備註
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="其他補充說明..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <button
          onClick={onSubmit}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition"
        >
          啟動 AI 診斷分析
        </button>
      </div>
    </div>
  );
}
