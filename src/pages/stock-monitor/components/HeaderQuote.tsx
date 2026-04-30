import type { Quote } from "../types";

export function HeaderQuote({ quote }: { quote: Quote }) {
  const up = quote.change >= 0;
  const innerPct = (quote.innerVolume / (quote.innerVolume + quote.outerVolume)) * 100;
  const outerPct = 100 - innerPct;
  const ratio = `${Math.round(innerPct)} : ${Math.round(outerPct)}`;

  return (
    <div className="grid grid-cols-12 items-center gap-3 rounded-md border border-cyan-500/30 bg-slate-950/70 px-4 py-2">
      <div className="col-span-3 flex items-baseline gap-3">
        <span className="text-3xl font-black text-cyan-300">{quote.symbol}</span>
        <span className="text-2xl font-bold text-slate-100">{quote.name}</span>
      </div>
      <div className="col-span-2 text-right">
        <div className={`text-4xl font-black ${up ? "text-red-400" : "text-green-400"}`}>{quote.price.toFixed(2)}</div>
      </div>
      <div className="col-span-2">
        <div className={`text-lg font-bold ${up ? "text-red-400" : "text-green-400"}`}>
          {up ? "▲" : "▼"} {Math.abs(quote.change).toFixed(2)}{" "}
          <span className="text-sm">({quote.changePct.toFixed(2)}%)</span>
        </div>
      </div>
      <div className="col-span-1 text-center">
        <div className="text-[10px] text-slate-400">單量</div>
        <div className="text-yellow-300 text-lg">{quote.lotSize}</div>
      </div>
      <div className="col-span-1 text-center">
        <div className="text-[10px] text-slate-400">成交量</div>
        <div className="text-yellow-300 text-lg">{quote.totalVolume}</div>
      </div>
      <div className="col-span-1 text-center">
        <div className="text-[10px] text-slate-400">時間</div>
        <div className="text-yellow-300 text-sm">{quote.time}</div>
      </div>
      <div className="col-span-2">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-green-400">內盤</span>
          <span className="text-green-300 font-bold">{quote.innerVolume}</span>
          <span className="text-slate-400">({innerPct.toFixed(2)}%)</span>
          <span className="text-red-400 ml-2">外盤</span>
          <span className="text-red-300 font-bold">{quote.outerVolume}</span>
          <span className="text-slate-400">({outerPct.toFixed(2)}%)</span>
        </div>
        <div className="mt-1 flex h-2 overflow-hidden rounded">
          <div className="bg-green-500" style={{ width: `${innerPct}%` }} />
          <div className="bg-red-500" style={{ width: `${outerPct}%` }} />
        </div>
        <div className="mt-0.5 text-right text-[10px] text-cyan-400">內外盤比 {ratio}</div>
      </div>
    </div>
  );
}
