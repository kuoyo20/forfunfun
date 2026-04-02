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
      <div className="text-center mb-10">
        <p className="text-[9px] tracking-[3px] text-primary/70 uppercase">
          ✦ Step 01 ✦
        </p>
        <h2 className="font-serif text-xl font-bold text-foreground mt-2">
          填寫客戶與產品資料
        </h2>
        <p className="text-xs text-stone mt-2">
          請輸入基本資訊，AI 將為您量身打造銷售策略
        </p>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <label className="block text-[10px] tracking-widest text-primary/70 uppercase font-medium mb-2">
            品牌名稱 *
          </label>
          <input
            type="text"
            value={formData.brandName}
            onChange={(e) => update("brandName", e.target.value)}
            placeholder="例：苗林行"
            className="w-full px-4 py-2.5 border border-border/60 rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
          />
        </div>

        <div>
          <label className="block text-[10px] tracking-widest text-primary/70 uppercase font-medium mb-2">
            對象類型
          </label>
          <div className="flex gap-2">
            {TARGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("targetType", opt.value)}
                className={`flex-1 px-3 py-2.5 rounded-lg text-xs border transition-all duration-200 ${
                  formData.targetType === opt.value
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-sm shadow-primary/20"
                    : "bg-background text-foreground border-border/60 hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] tracking-widest text-primary/70 uppercase font-medium mb-2">
            產品名稱 *
          </label>
          <input
            type="text"
            value={formData.product}
            onChange={(e) => update("product", e.target.value)}
            placeholder="例：法國 AOP 奶油"
            className="w-full px-4 py-2.5 border border-border/60 rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
          />
        </div>

        <div>
          <label className="block text-[10px] tracking-widest text-primary/70 uppercase font-medium mb-2">
            銷售模式
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("salesMode", opt.value)}
                className={`px-3 py-2.5 rounded-lg text-xs border transition-all duration-200 ${
                  formData.salesMode === opt.value
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-sm shadow-primary/20"
                    : "bg-background text-foreground border-border/60 hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] tracking-widest text-primary/70 uppercase font-medium mb-2">
            主力品項
          </label>
          <input
            type="text"
            value={formData.mainItems}
            onChange={(e) => update("mainItems", e.target.value)}
            placeholder="例：奶油、起司、鮮奶油"
            className="w-full px-4 py-2.5 border border-border/60 rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
          />
        </div>

        <div>
          <label className="block text-[10px] tracking-widest text-primary/70 uppercase font-medium mb-2">
            備註
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="其他補充說明..."
            rows={3}
            className="w-full px-4 py-2.5 border border-border/60 rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition resize-none"
          />
        </div>

        <button
          onClick={onSubmit}
          className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl text-sm font-medium hover:shadow-md hover:shadow-primary/20 transition-all duration-300"
        >
          啟動 AI 診斷分析 →
        </button>
      </div>
    </div>
  );
}
