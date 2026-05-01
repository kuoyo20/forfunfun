import type { Quote } from "../types";

export function HeaderQuote({ quote }: { quote: Quote }) {
  const up = quote.change >= 0;
  const total = quote.innerVolume + quote.outerVolume;
  const innerPct = total === 0 ? 50 : (quote.innerVolume / total) * 100;
  const outerPct = 100 - innerPct;

  return (
    <div className="rounded-md border border-cyan-500/30 bg-slate-950/70 px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl md:text-3xl font-black text-cyan-300">{quote.symbol}</span>
          <span className="text-base sm:text-lg md:text-xl font-bold text-slate-100">{quote.name}</span>
        </div>
        <div className={`text-2xl sm:text-3xl md:text-4xl font-black tabular-nums ${up ? "text-red-400" : "text-green-400"}`}>
          {quote.price.toFixed(2)}
        </div>
        <div className={`text-sm sm:text-base font-bold ${up ? "text-red-400" : "text-green-400"}`}>
          {up ? "▲" : "▼"} {Math.abs(quote.change).toFixed(2)}{" "}
          <span className="text-xs">({quote.changePct.toFixed(2)}%)</span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] sm:text-[11px] text-slate-300 sm:flex sm:flex-wrap sm:gap-x-4">
        <div>
          <div className="text-slate-500">單量</div>
          <div className="text-yellow-300 font-mono">{quote.lotSize}</div>
        </div>
        <div>
          <div className="text-slate-500">成交量</div>
          <div className="text-yellow-300 font-mono">{quote.totalVolume.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-slate-500">時間</div>
          <div className="text-yellow-300 font-mono">{quote.time}</div>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px]">
          <span className="text-green-400">內盤</span>
          <span className="text-green-300 font-bold font-mono">{quote.innerVolume}</span>
          <span className="text-slate-500">({innerPct.toFixed(1)}%)</span>
          <span className="text-red-400 ml-1">外盤</span>
          <span className="text-red-300 font-bold font-mono">{quote.outerVolume}</span>
          <span className="text-slate-500">({outerPct.toFixed(1)}%)</span>
        </div>
        <div className="mt-1 flex h-1.5 overflow-hidden rounded">
          <div className="bg-green-500" style={{ width: `${innerPct}%` }} />
          <div className="bg-red-500" style={{ width: `${outerPct}%` }} />
        </div>
      </div>
    </div>
  );
}
