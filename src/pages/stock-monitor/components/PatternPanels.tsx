import type { KPattern, MultiPeriodRow } from "../types";
import { Panel } from "./Panel";

export function KPatternTable({ patterns }: { patterns: KPattern[] }) {
  return (
    <Panel title="K線型態表">
      <table className="w-full text-[11px]">
        <thead className="text-slate-400">
          <tr>
            <th className="text-left py-1 w-20">型態</th>
            <th className="text-left py-1 w-12">狀態</th>
            <th className="text-left py-1">說明</th>
          </tr>
        </thead>
        <tbody>
          {patterns.map((p) => (
            <tr key={p.name} className="border-t border-slate-800/60">
              <td className="py-1 text-cyan-200">{p.name}</td>
              <td className={`py-1 ${p.matched ? "text-green-400" : "text-slate-500"}`}>{p.matched ? "成立" : "未成立"}</td>
              <td className="py-1 text-slate-300">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export function PatternAnalysisPanel({ wm }: { wm: { wBottom: boolean; mTop: boolean; note: string } }) {
  return (
    <Panel title="型態分析" badge="(不硬套)">
      <div className="space-y-2">
        <div>
          <div className="text-cyan-300 font-bold text-[11px]">W 底型態</div>
          <div className={`${wm.wBottom ? "text-green-400" : "text-red-300"} text-[11px]`}>{wm.wBottom ? "已成立" : "未形成標準W底"}</div>
          <div className="text-[10px] text-slate-400">目前屬高檔回落整理，未出現雙底結構</div>
        </div>
        <div>
          <div className="text-cyan-300 font-bold text-[11px]">M 頭型態</div>
          <div className={`${wm.mTop ? "text-green-400" : "text-red-300"} text-[11px]`}>{wm.mTop ? "已成立" : "未形成標準M頭"}</div>
          <div className="text-[10px] text-slate-400">未出現雙峰高點，暫非M頭結構</div>
        </div>
        <div className="text-[10px] text-slate-500">{wm.note}</div>
      </div>
    </Panel>
  );
}

export function MultiPeriodPanel({ rows }: { rows: MultiPeriodRow[] }) {
  const trendCN = (t: MultiPeriodRow["trend"]) => (t === "bull" ? "多頭" : t === "bear" ? "空頭" : "盤整");
  const strengthCN = (s: MultiPeriodRow["strength"]) => (s === "strong" ? "強" : s === "medium-strong" ? "中強" : "弱");
  const periodCN = (p: MultiPeriodRow["period"]) => (p === "daily" ? "日 K" : p === "weekly" ? "週 K" : "月 K");
  const cls = (t: MultiPeriodRow["trend"]) => (t === "bull" ? "text-red-400" : t === "bear" ? "text-green-400" : "text-yellow-300");

  return (
    <Panel title="多週期分析">
      <table className="w-full text-[11px]">
        <thead className="text-slate-400">
          <tr>
            <th className="text-left py-1 w-12">週期</th>
            <th className="text-left py-1 w-14">趨勢方向</th>
            <th className="text-left py-1 w-14">多空強度</th>
            <th className="text-left py-1">備註</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.period} className="border-t border-slate-800/60">
              <td className="py-1 text-cyan-200">{periodCN(r.period)}</td>
              <td className={`py-1 font-bold ${cls(r.trend)}`}>{trendCN(r.trend)}</td>
              <td className="py-1 text-yellow-300">{strengthCN(r.strength)}</td>
              <td className="py-1 text-slate-300">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
