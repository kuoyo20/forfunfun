import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Save, Check, Mail, Building2, Bell } from "lucide-react";
import { toast } from "sonner";

interface AppSettings {
  companyName: string;
  emailSignature: string;
  passEmailPreamble: string;
  failEmailPreamble: string;
  autoSendOnDecision: boolean;
}

const DEFAULTS: AppSettings = {
  companyName: "",
  emailSignature: "",
  passEmailPreamble: "",
  failEmailPreamble: "",
  autoSendOnDecision: true,
};

const KEY = "app-settings";

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    toast.success("設定已儲存");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">設定</h1>
        <p className="text-sm text-muted-foreground mt-1">管理公司資訊與 email 寄送行為</p>
      </div>

      {/* 公司資訊 */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">公司資訊</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">公司名稱</label>
          <input
            type="text"
            value={settings.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            placeholder="例如：苗林行股份有限公司"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            會出現在寄給候選人的 Email 署名裡
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email 署名</label>
          <input
            type="text"
            value={settings.emailSignature}
            onChange={(e) => update("emailSignature", e.target.value)}
            placeholder="例如：HR 團隊 敬上"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Email 行為 */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">通知行為</h2>
        </div>

        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <div>
            <div className="text-sm font-medium">決策後自動寄通知信</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              HR 按下「通過 / 不通過」時，是否預設寄信給候選人
            </p>
          </div>
          <button
            onClick={() => update("autoSendOnDecision", !settings.autoSendOnDecision)}
            className={cn(
              "relative inline-flex h-6 w-11 rounded-full transition-colors",
              settings.autoSendOnDecision ? "bg-primary" : "bg-muted"
            )}
          >
            <span className={cn(
              "inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform",
              settings.autoSendOnDecision ? "translate-x-5" : "translate-x-0.5"
            )} />
          </button>
        </label>
      </div>

      {/* Email 模板 */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">信件開頭補充文字（選填）</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          會加在系統預設的通過/不通過信件開頭，可以加入公司特有的訊息（例如：團隊介紹、下一步說明）
        </p>

        <div className="space-y-2">
          <label className="text-sm font-medium text-green-600">通過信 — 開頭補充</label>
          <textarea
            value={settings.passEmailPreamble}
            onChange={(e) => update("passEmailPreamble", e.target.value)}
            placeholder="例如：我們公司致力於..."
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-red-500">不通過信 — 開頭補充</label>
          <textarea
            value={settings.failEmailPreamble}
            onChange={(e) => update("failEmailPreamble", e.target.value)}
            placeholder="例如：非常感謝您對我們的興趣..."
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* 環境變數提示 */}
      <div className="rounded-xl border border-yellow-300 bg-yellow-50/50 p-4 space-y-2">
        <div className="text-sm font-semibold text-yellow-800">系統層級設定</div>
        <p className="text-xs text-yellow-800/80">
          以下設定需要在伺服器的 <code className="bg-white/60 px-1 rounded">.env</code> 或 Vercel 環境變數中調整：
        </p>
        <ul className="text-xs text-yellow-800/80 space-y-1 ml-4">
          <li>• <code className="bg-white/60 px-1 rounded">ANTHROPIC_API_KEY</code> — Claude API 金鑰</li>
          <li>• <code className="bg-white/60 px-1 rounded">HR_NOTIFICATION_EMAIL</code> — 面試完成通知 HR 的 email</li>
          <li>• <code className="bg-white/60 px-1 rounded">SMTP_*</code> — 寄信伺服器（Gmail、SendGrid 等）</li>
          <li>• <code className="bg-white/60 px-1 rounded">FRONTEND_URL</code> — 寄信裡面試連結的網址</li>
        </ul>
      </div>

      {/* 儲存按鈕 */}
      <div className="sticky bottom-6 z-10">
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold shadow-lg hover:bg-primary/90 transition-colors"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "已儲存" : "儲存設定"}
        </button>
      </div>
    </div>
  );
}
