export function Disclaimer() {
  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[11px] leading-relaxed text-amber-200">
      <span className="font-bold mr-1">⚠ 使用聲明：</span>
      本頁所有數值、訊號、情境參考價皆為 <b>演算法統計結果</b>，
      <b>非投資建議</b>，使用者應自行判斷並承擔風險。資料來自 FinMind 公開資訊，
      <b>免費版資料延遲一個交易日</b>，非即時報價。
    </div>
  );
}

export function SourceBadge({ source, time, warning }: { source: "finmind" | "mock"; time: string; warning?: string }) {
  const label =
    source === "finmind" ? { text: "FinMind 公開資料", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" }
    : { text: "Mock 模擬資料", cls: "bg-rose-500/20 text-rose-300 border-rose-500/40" };
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className={`inline-block rounded border px-1.5 py-0.5 ${label.cls}`}>資料來源：{label.text}</span>
      <span className="text-slate-400">最後更新 {time}</span>
      {warning ? <span className="text-amber-300">⚠ {warning}</span> : null}
    </div>
  );
}
