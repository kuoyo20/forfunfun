import type { NextDayScenario } from "../types";
import { Panel } from "./Panel";

const COLOR: Record<NextDayScenario["type"], { border: string; bg: string; text: string; idx: string }> = {
  "high-open-up": { border: "border-red-500/60", bg: "bg-red-500/10", text: "text-red-300", idx: "①" },
  range: { border: "border-yellow-500/60", bg: "bg-yellow-500/10", text: "text-yellow-300", idx: "②" },
  "low-open-pullback": { border: "border-green-500/60", bg: "bg-green-500/10", text: "text-green-300", idx: "③" },
};

export function PlaybookPanel({ scenarios, date }: { scenarios: NextDayScenario[]; date: string }) {
  return (
    <Panel title="隔日操作劇本" badge={`(${date})`}>
      <div className="grid grid-cols-3 gap-2">
        {scenarios.map((s) => {
          const c = COLOR[s.type];
          return (
            <div key={s.type} className={`rounded border ${c.border} ${c.bg} p-2`}>
              <div className={`text-center font-bold ${c.text} text-[12px] mb-1.5`}>{c.idx} {s.label}</div>
              <Row k="進場價" v={`${s.entryLow.toFixed(0)} ~ ${s.entryHigh.toFixed(0)}`} cls={c.text} />
              <Row k="停損價" v={s.stopLoss.toFixed(0)} cls="text-slate-200" />
              <Row k="目標價" v={`${s.target1.toFixed(0)} / ${s.target2.toFixed(0)}`} cls="text-yellow-200" />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Row({ k, v, cls }: { k: string; v: string; cls: string }) {
  return (
    <div className="flex justify-between text-[11px] border-t border-slate-800/60 py-0.5">
      <span className="text-slate-400">{k}</span>
      <span className={`font-mono ${cls}`}>{v}</span>
    </div>
  );
}
