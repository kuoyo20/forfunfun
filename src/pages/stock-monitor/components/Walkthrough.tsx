import { useEffect, useState } from "react";

const KEY = "stock-monitor:walkthrough-done";

const STEPS = [
  {
    title: "👋 歡迎來到家庭看盤儀表板",
    body: (
      <>
        <p>這是一個給家人輕鬆「看盤學習」的工具。</p>
        <p className="mt-2 text-amber-300">⚠ <b>它不是投資工具，不會告訴你該不該買賣</b>。</p>
        <p className="mt-2 text-slate-400">花 30 秒看完這 5 步，避免之後踩坑。</p>
      </>
    ),
  },
  {
    title: "1️⃣ 看價格與漲跌",
    body: (
      <>
        <p>頂部顯示<b className="text-cyan-300">即時報價</b>、漲跌、內外盤比。</p>
        <p className="mt-2"><b className="text-red-400">紅色</b> = 上漲（台股慣例與美股相反）。</p>
        <p className="mt-2 text-slate-400">資料來自 FinMind 公開資訊，<b>延遲一個交易日</b>。</p>
      </>
    ),
  },
  {
    title: "2️⃣ 看技術指標 — 但不要迷信",
    body: (
      <>
        <p>K 線、MA、KD、MACD 等都是<b className="text-cyan-300">過去資料的整理</b>，<b>不是預測</b>。</p>
        <p className="mt-2">所有「情境模擬」「區間參考價」只是<b className="text-yellow-300">統計推算</b>，<b>不是合理股價</b>。</p>
        <p className="mt-2 text-slate-400">右上「📖 新手」可隨時打開名詞速查。</p>
      </>
    ),
  },
  {
    title: "3️⃣ 自選股有 7 天冷靜期",
    body: (
      <>
        <p>把股票加入「★ 自選」時，系統會：</p>
        <ul className="mt-2 list-disc pl-5 text-slate-200 space-y-1">
          <li>強制你寫 <b className="text-cyan-300">30 字以上「為什麼追蹤」</b></li>
          <li>啟動 <b className="text-yellow-300">7 天冷靜期</b></li>
        </ul>
        <p className="mt-2 text-slate-400">這是為了避免「衝動加入 → 衝動買進 → 後悔」的常見陷阱。</p>
      </>
    ),
  },
  {
    title: "4️⃣ 風險警示要看",
    body: (
      <>
        <p>個股頁會自動跳<b className="text-red-400">過熱警告</b>：</p>
        <ul className="mt-2 list-disc pl-5 text-slate-200 space-y-1">
          <li>近 3 月漲幅 &gt; 30%</li>
          <li>RSI &gt; 80（超買）</li>
          <li>與 MA20 乖離 &gt; 15%</li>
          <li>連漲 ≥ 7 日</li>
        </ul>
        <p className="mt-2 text-slate-400">看到紅燈，問自己：「<b>如果明天跌 10%，我今天還會買嗎？</b>」</p>
      </>
    ),
  },
  {
    title: "✓ 我了解這不是投資建議",
    body: (
      <>
        <p>使用本頁前，請承諾：</p>
        <ul className="mt-2 list-disc pl-5 text-slate-200 space-y-1.5">
          <li>我不會把任何訊號當買賣建議</li>
          <li>我會自己讀法說會、年報原文</li>
          <li>我盈虧自負，不向開發者究責</li>
          <li>我會在做決定前，至少看完整體頁面，不只看一個指標</li>
        </ul>
      </>
    ),
  },
];

export function Walkthrough() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch { /* ignore */ }
  }, []);

  if (!open) return null;
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3">
      <div className="w-full max-w-md rounded-lg border border-cyan-400 bg-slate-900 shadow-[0_0_30px_rgba(34,211,238,0.4)]">
        <div className="border-b border-cyan-500/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-cyan-200">{s.title}</h2>
            <span className="text-[10px] text-slate-500">{step + 1} / {STEPS.length}</span>
          </div>
          <div className="mt-2 flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded ${i <= step ? "bg-cyan-400" : "bg-slate-700"}`} />
            ))}
          </div>
        </div>
        <div className="p-4 text-sm text-slate-200 space-y-1 min-h-[180px]">
          {s.body}
        </div>
        <div className="flex justify-between gap-2 border-t border-cyan-500/30 px-4 py-3">
          <button
            onClick={finish}
            className="text-[11px] text-slate-500 hover:text-slate-300"
          >
            略過
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                上一步
              </button>
            )}
            {isLast ? (
              <button
                onClick={finish}
                className="rounded bg-cyan-500/40 px-4 py-1.5 text-xs font-bold text-cyan-100 ring-1 ring-cyan-400 hover:bg-cyan-500/60"
              >
                ✓ 我承諾並開始使用
              </button>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                className="rounded bg-cyan-500/30 px-4 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-500/50"
              >
                下一步 →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
