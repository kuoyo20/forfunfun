import type { WorstScenario } from "../decisionHelpers";
import { Panel } from "./Panel";

export function WorstScenarioPanel({ scenarios }: { scenarios: WorstScenario[] }) {
  if (scenarios.length === 0) {
    return (
      <Panel title="歷史最糟情境" badge="(壓力測試)">
        <div className="text-center text-slate-500 text-[11px] py-4">資料不足</div>
      </Panel>
    );
  }
  return (
    <Panel title="歷史最糟情境" badge="(壓力測試)">
      <p className="text-[11px] text-slate-300 mb-2">
        如果你<b className="text-amber-300">不幸買在最高點</b>，過去 5 年內最慘的：
      </p>
      <div className="space-y-1">
        {scenarios.map((s) => (
          <div key={s.label} className="grid grid-cols-[60px_1fr_auto] gap-2 items-baseline rounded bg-slate-900/40 px-2 py-1 text-[11px]">
            <span className="text-slate-400">{s.label}</span>
            <span className="text-red-400 font-mono font-bold">{s.worstReturn.toFixed(1)}%</span>
            <span className="text-[10px] text-slate-500">{s.worstStart.slice(2)} → {s.worstEnd.slice(2)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200 leading-relaxed">
        🧠 自我檢查：<b>看到「半年最多跌 -45%」，你能接受 100 萬變 55 萬嗎？</b>
        <br />答不出「能」就不要 all-in。
      </div>
    </Panel>
  );
}
