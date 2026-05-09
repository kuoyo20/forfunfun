import type { BacktestRow } from "../decisionHelpers";
import { Panel } from "./Panel";

export function BacktestPanel({ rows, currentPrice }: { rows: BacktestRow[]; currentPrice: number }) {
  if (rows.length === 0) {
    return (
      <Panel title="假如你 X 年前買進" badge="(歷史回測)">
        <div className="text-center text-slate-500 text-[11px] py-4">資料不足，至少需 30 個交易日</div>
      </Panel>
    );
  }
  return (
    <Panel title="假如你 X 年前買進" badge="(歷史真實表現)">
      <table className="w-full text-[11px]">
        <thead className="text-slate-400 border-b border-slate-800">
          <tr>
            <th className="text-left py-1">期間</th>
            <th className="text-right">買入價</th>
            <th className="text-right">總報酬</th>
            <th className="text-right">年化</th>
            <th className="text-right">最大回撤</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-slate-800/60">
              <td className="py-1 text-cyan-200">{r.label}</td>
              <td className="text-right font-mono text-slate-300">{r.startPrice.toFixed(2)}</td>
              <td className={`text-right font-mono ${r.totalReturn >= 0 ? "text-red-300" : "text-green-300"}`}>
                {r.totalReturn >= 0 ? "+" : ""}{r.totalReturn.toFixed(1)}%
              </td>
              <td className={`text-right font-mono ${r.annualized >= 0 ? "text-red-300" : "text-green-300"}`}>
                {r.annualized >= 0 ? "+" : ""}{r.annualized.toFixed(1)}%
              </td>
              <td className="text-right font-mono text-red-400">{r.maxDrawdown.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200 leading-relaxed">
        💡 <b>最大回撤</b> = 持有期間最慘的時候，從高點跌到低點的幅度。如果你看到 -30%，
        想想：<b>當時心臟撐得住嗎？會不會在最低點認賠殺出？</b>
      </div>
      <div className="text-[10px] text-slate-500 mt-1">
        ※ 過去績效不代表未來表現，目前股價 {currentPrice.toFixed(2)}
      </div>
    </Panel>
  );
}
