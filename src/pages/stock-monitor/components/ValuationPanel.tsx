import type { ValuationStats } from "../types";
import { Panel } from "./Panel";

export function ValuationPanel({ valuation, currentPrice }: { valuation: ValuationStats; currentPrice: number }) {
  if (!valuation.current || valuation.samples === 0) {
    return (
      <Panel title="估值歷史區間" badge="(近 3 年)">
        <div className="text-center text-slate-500 text-[11px] py-4">無估值資料</div>
        <div className="text-[10px] text-slate-500">※ 歷史統計，非預測、非投資建議</div>
      </Panel>
    );
  }

  const { current, perMin, perMax, perQ1, perMedian, perQ3, perPercentile } = valuation;
  const range = perMax - perMin || 1;
  const pos = (n: number) => Math.max(0, Math.min(100, ((n - perMin) / range) * 100));

  const eps = current.per > 0 ? round(currentPrice / current.per) : 0;
  const refLow = round(eps * perQ1);
  const refMid = round(eps * perMedian);
  const refHigh = round(eps * perQ3);

  let percentileTag = "中位";
  if (perPercentile >= 80) percentileTag = "歷史高檔";
  else if (perPercentile >= 60) percentileTag = "中高";
  else if (perPercentile <= 20) percentileTag = "歷史低檔";
  else if (perPercentile <= 40) percentileTag = "中低";

  return (
    <Panel title="估值歷史區間" badge="(近 3 年｜非預測)">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-[11px]">
          <span className="text-slate-400">目前 PER</span>
          <span className="text-cyan-200 font-bold text-base">{current.per.toFixed(1)} 倍</span>
          <span className="text-yellow-300">歷史 {perPercentile}% 分位 · {percentileTag}</span>
        </div>

        <div className="relative h-6">
          <div className="absolute inset-x-0 top-2 h-2 rounded bg-slate-800" />
          <div
            className="absolute top-2 h-2 rounded bg-cyan-500/30"
            style={{ left: `${pos(perQ1)}%`, width: `${pos(perQ3) - pos(perQ1)}%` }}
            title={`Q1-Q3 區間 ${perQ1.toFixed(1)} ~ ${perQ3.toFixed(1)}`}
          />
          <div
            className="absolute top-1 h-4 w-0.5 bg-cyan-300"
            style={{ left: `${pos(perMedian)}%` }}
            title={`中位數 ${perMedian.toFixed(1)}`}
          />
          <div
            className="absolute top-0 h-6 w-1 rounded bg-yellow-300 shadow-[0_0_6px_#facc15]"
            style={{ left: `${pos(current.per)}%` }}
            title={`目前 ${current.per.toFixed(1)}`}
          />
          <div className="absolute -bottom-2 left-0 text-[9px] text-slate-500">{perMin.toFixed(0)}</div>
          <div className="absolute -bottom-2 right-0 text-[9px] text-slate-500">{perMax.toFixed(0)}</div>
        </div>

        <table className="w-full text-[11px] mt-3">
          <tbody>
            <tr className="border-b border-slate-800/60">
              <td className="py-0.5 text-slate-400 w-20">PE 區間</td>
              <td className="py-0.5">
                <span className="text-slate-500">{perMin.toFixed(1)}</span>
                <span className="mx-1 text-slate-600">|</span>
                <span className="text-slate-300">Q1 {perQ1.toFixed(1)}</span>
                <span className="mx-1 text-slate-600">·</span>
                <span className="text-cyan-300">中 {perMedian.toFixed(1)}</span>
                <span className="mx-1 text-slate-600">·</span>
                <span className="text-slate-300">Q3 {perQ3.toFixed(1)}</span>
                <span className="mx-1 text-slate-600">|</span>
                <span className="text-slate-500">{perMax.toFixed(1)}</span>
              </td>
            </tr>
            <tr className="border-b border-slate-800/60">
              <td className="py-0.5 text-slate-400">PBR 區間</td>
              <td className="py-0.5 text-slate-300">
                {valuation.pbrMin.toFixed(1)} ~ {valuation.pbrMax.toFixed(1)} 倍（中 {valuation.pbrMedian.toFixed(1)}）
              </td>
            </tr>
            <tr className="border-b border-slate-800/60">
              <td className="py-0.5 text-slate-400">推估 EPS</td>
              <td className="py-0.5 text-slate-300">{eps.toFixed(2)} 元（= 收盤 ÷ 目前 PER）</td>
            </tr>
            <tr>
              <td className="py-0.5 text-slate-400">PE 區間映射</td>
              <td className="py-0.5">
                <span className="text-slate-300">區間參考價：</span>
                <span className="text-slate-200">{refLow.toFixed(0)}</span>
                <span className="mx-1 text-slate-600">/</span>
                <span className="text-cyan-300">{refMid.toFixed(0)}</span>
                <span className="mx-1 text-slate-600">/</span>
                <span className="text-slate-200">{refHigh.toFixed(0)}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-200 leading-relaxed">
          ⚠ 上述「區間參考價」= <b>當前推估 EPS × 歷史 PE 分位</b>，<b>純歷史統計</b>，
          假設 EPS 不變、市場給予歷史相同 PE 倍數。此<b>非預估、非合理股價、非目標價、非投資建議</b>，
          僅供觀察該股目前估值在歷史中的相對位置。
        </div>
      </div>
    </Panel>
  );
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
