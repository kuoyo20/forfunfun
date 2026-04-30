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

const POLL_MS = 5000;

export default function StockMonitor() {
  const [symbol, setSymbol] = useState("3583");
  const [input, setInput] = useState("3583");

  const { data, isLoading, error } = useQuery({
    queryKey: ["stock-snapshot", symbol],
    queryFn: () => fetchSnapshot(symbol),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });

  const derived = useMemo(() => {
    if (!data) return null;
    const barsMA = withMA(data.kbars);
    const tech = buildTechSummary(barsMA);
    const levels = buildPriceLevels(barsMA);
    const patterns = detectKPatterns(data.kbars);
    const wm = detectWMPattern(data.kbars);
    const multi = multiPeriodAnalysis(barsMA);
    const playbook = buildPlaybook(data.quote.price);
    const alert = buildMainForceAlert(data.chip);
    const conclusion = buildOverallConclusion({ tech, bars: data.kbars, supportUpper: levels.supportUpper });
    const nextDate = nextWeekday();
    return { barsMA, tech, levels, patterns, wm, multi, playbook, alert, conclusion, nextDate };
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 px-3 py-3 text-slate-100">
      <div className="mx-auto max-w-[1480px] space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-widest text-cyan-300">即時監控儀表板</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) setSymbol(input.trim());
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="股票代號"
              className="w-28 rounded border border-cyan-500/40 bg-slate-900 px-2 py-1 text-sm text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <button type="submit" className="rounded bg-cyan-500/20 px-3 py-1 text-sm text-cyan-200 hover:bg-cyan-500/30">查詢</button>
            <span className="text-[11px] text-slate-500">每 {POLL_MS / 1000}s 自動更新</span>
          </form>
        </div>

        {isLoading || !data || !derived ? (
          <div className="rounded border border-cyan-500/30 bg-slate-900/60 px-4 py-12 text-center text-cyan-300">
            {error ? `資料讀取失敗：${(error as Error).message}` : "載入中..."}
          </div>
        ) : (
          <>
            <HeaderQuote quote={data.quote} />

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-7 rounded-md border border-cyan-500/30 bg-slate-950/60 p-2">
                <KLineChart
                  bars={derived.barsMA}
                  recentHigh={derived.levels.recentHigh}
                  supportUpper={derived.levels.supportUpper}
                  supportLower={derived.levels.supportLower}
                />
              </div>
              <div className="col-span-3 space-y-3">
                <TechnicalSummaryPanel tech={derived.tech} />
                <ChipPanel chip={data.chip} />
              </div>
              <div className="col-span-2">
                <IndustryPanel info={data.industry} />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-2"><MainForceAlertPanel alert={derived.alert} /></div>
              <div className="col-span-2"><WinRateGauge rate={data.shortTermWinRate} /></div>
              <div className="col-span-2"><KeyPriceLevelsPanel levels={derived.levels} /></div>
              <div className="col-span-3"><VolPriceStructPanel tech={derived.tech} /></div>
              <div className="col-span-3"><InOutStructPanel inner={data.quote.innerVolume} outer={data.quote.outerVolume} /></div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3"><KPatternTable patterns={derived.patterns} /></div>
              <div className="col-span-3"><PatternAnalysisPanel wm={derived.wm} /></div>
              <div className="col-span-3"><MultiPeriodPanel rows={derived.multi} /></div>
              <div className="col-span-3"><PlaybookPanel scenarios={derived.playbook} date={derived.nextDate} /></div>
            </div>

            <div className="rounded-md border border-cyan-500/40 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="rounded bg-cyan-500/30 px-2 py-0.5 text-xs font-bold tracking-widest text-cyan-200">整體結論</span>
                <p className="text-sm font-bold text-cyan-100">{derived.conclusion}</p>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">※ 本頁所有訊號為演算法即時統計結果，僅供研究參考，非投資建議。</p>
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
