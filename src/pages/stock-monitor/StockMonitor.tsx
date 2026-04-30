import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSnapshot } from "./service";
import {
  buildPriceLevels,
  buildTechSummary,
  detectKPatterns,
  detectWMPattern,
  multiPeriodAnalysis,
  withMA,
} from "./indicators";
import { buildMainForceAlert, buildOverallConclusion, buildPlaybook } from "./rules";
import { KLineChart } from "./components/KLineChart";
import { HeaderQuote } from "./components/HeaderQuote";
import {
  ChipPanel,
  IndustryPanel,
  InOutStructPanel,
  KeyPriceLevelsPanel,
  MainForceAlertPanel,
  TechnicalSummaryPanel,
  VolPriceStructPanel,
  WinRateGauge,
} from "./components/InfoPanels";
import { KPatternTable, MultiPeriodPanel, PatternAnalysisPanel } from "./components/PatternPanels";
import { PlaybookPanel } from "./components/PlaybookPanel";
import { Disclaimer, SourceBadge } from "./components/Disclaimer";
import { useWatchlist } from "./useWatchlist";

const POLL_MS = 5 * 60 * 1000;

const PRESETS: { symbol: string; name: string }[] = [
  { symbol: "2330", name: "台積電" },
  { symbol: "2454", name: "聯發科" },
  { symbol: "2317", name: "鴻海" },
  { symbol: "3583", name: "辛耘" },
  { symbol: "2603", name: "長榮" },
  { symbol: "2412", name: "中華電" },
  { symbol: "0050", name: "元大台灣50" },
  { symbol: "0056", name: "元大高股息" },
];

export default function StockMonitor() {
  const [symbol, setSymbol] = useState("3583");
  const [input, setInput] = useState("3583");
  const watchlist = useWatchlist();

  const { data, isLoading, isFetching, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["stock-snapshot", symbol],
    queryFn: () => fetchSnapshot(symbol),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
    retry: 1,
  });

  const derived = useMemo(() => {
    if (!data) return null;
    const snap = data.snapshot;
    const barsMA = withMA(snap.kbars);
    const tech = buildTechSummary(barsMA);
    const levels = buildPriceLevels(barsMA);
    const patterns = detectKPatterns(snap.kbars);
    const wm = detectWMPattern(snap.kbars);
    const multi = multiPeriodAnalysis(barsMA);
    const playbook = buildPlaybook(snap.quote.price);
    const alert = buildMainForceAlert(snap.chip);
    const conclusion = buildOverallConclusion({ tech, bars: snap.kbars, supportUpper: levels.supportUpper });
    const nextDate = nextWeekday();
    return { snap, barsMA, tech, levels, patterns, wm, multi, playbook, alert, conclusion, nextDate };
  }, [data]);

  const updatedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("zh-TW", { hour12: false }) : "—";

  return (
    <div className="min-h-screen bg-slate-950 px-3 py-3 text-slate-100">
      <div className="mx-auto max-w-[1480px] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold tracking-widest text-cyan-300">家庭看盤儀表板</h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.symbol}
                  onClick={() => { setInput(p.symbol); setSymbol(p.symbol); }}
                  className={`rounded border px-2 py-0.5 text-[11px] ${symbol === p.symbol ? "border-cyan-400 bg-cyan-500/30 text-cyan-100" : "border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700"}`}
                >
                  {p.symbol} {p.name}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = input.trim();
                if (v) setSymbol(v);
              }}
              className="flex items-center gap-1"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="代號"
                className="w-20 rounded border border-cyan-500/40 bg-slate-900 px-2 py-1 text-sm text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
              <button type="submit" className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-500/30">查詢</button>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="rounded border border-cyan-500/40 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
              >
                {isFetching ? "更新中…" : "↻ 重新整理"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (watchlist.has(symbol)) watchlist.remove(symbol);
                  else watchlist.add({ symbol, name: data?.snapshot.quote.name });
                }}
                className={`rounded border px-2 py-1 text-xs ${watchlist.has(symbol) ? "border-yellow-400 bg-yellow-500/20 text-yellow-200" : "border-slate-500 text-slate-300 hover:bg-slate-700"}`}
                title={watchlist.has(symbol) ? "從自選股移除" : "加入自選股"}
              >
                {watchlist.has(symbol) ? "★ 已加自選" : "☆ 加入自選"}
              </button>
            </form>
          </div>
        </div>

        {watchlist.list.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-2 py-1.5">
            <span className="text-[11px] font-bold text-yellow-300 mr-1">★ 我的自選</span>
            {watchlist.list.map((w) => (
              <span key={w.symbol} className={`group inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] ${symbol === w.symbol ? "border-yellow-400 bg-yellow-500/30 text-yellow-100" : "border-yellow-500/40 bg-slate-900/40 text-yellow-200"}`}>
                <button
                  type="button"
                  onClick={() => { setInput(w.symbol); setSymbol(w.symbol); }}
                  className="hover:text-yellow-100"
                >
                  {w.symbol}{w.name ? ` ${w.name}` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => watchlist.remove(w.symbol)}
                  className="opacity-50 hover:opacity-100 hover:text-red-300"
                  title="移除"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <Disclaimer />

        {isLoading || !data || !derived ? (
          <div className="rounded border border-cyan-500/30 bg-slate-900/60 px-4 py-12 text-center text-cyan-300">
            {error ? `資料讀取失敗：${(error as Error).message}` : "載入中... (首次抓取 FinMind 資料約需 1-3 秒)"}
          </div>
        ) : (
          <>
            <SourceBadge source={data.source} time={updatedAt} warning={data.warning} />
            <HeaderQuote quote={derived.snap.quote} />

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 lg:col-span-7 rounded-md border border-cyan-500/30 bg-slate-950/60 p-2">
                <KLineChart
                  bars={derived.barsMA}
                  recentHigh={derived.levels.recentHigh}
                  supportUpper={derived.levels.supportUpper}
                  supportLower={derived.levels.supportLower}
                />
              </div>
              <div className="col-span-12 lg:col-span-3 space-y-3">
                <TechnicalSummaryPanel tech={derived.tech} />
                <ChipPanel chip={derived.snap.chip} />
              </div>
              <div className="col-span-12 lg:col-span-2">
                <IndustryPanel info={derived.snap.industry} />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-2"><MainForceAlertPanel alert={derived.alert} /></div>
              <div className="lg:col-span-2"><WinRateGauge rate={derived.snap.shortTermWinRate} /></div>
              <div className="lg:col-span-2"><KeyPriceLevelsPanel levels={derived.levels} /></div>
              <div className="lg:col-span-3 col-span-2"><VolPriceStructPanel tech={derived.tech} /></div>
              <div className="lg:col-span-3 col-span-2"><InOutStructPanel inner={derived.snap.quote.innerVolume} outer={derived.snap.quote.outerVolume} /></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-3"><KPatternTable patterns={derived.patterns} /></div>
              <div className="lg:col-span-3"><PatternAnalysisPanel wm={derived.wm} /></div>
              <div className="lg:col-span-3"><MultiPeriodPanel rows={derived.multi} /></div>
              <div className="lg:col-span-3"><PlaybookPanel scenarios={derived.playbook} date={derived.nextDate} /></div>
            </div>

            <div className="rounded-md border border-cyan-500/40 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="rounded bg-cyan-500/30 px-2 py-0.5 text-xs font-bold tracking-widest text-cyan-200">演算法觀察</span>
                <p className="text-sm font-bold text-cyan-100">{derived.conclusion}</p>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                ※ 上述為純規則演算法輸出，<b>非投資建議、非選股推薦</b>。家人看盤娛樂用，請勿據此買賣。
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function nextWeekday() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}
