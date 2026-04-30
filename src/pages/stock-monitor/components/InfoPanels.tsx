import type { ChipFlow, IndustryInfo, TechSummary } from "../types";
import { Light, Panel } from "./Panel";

export function TechnicalSummaryPanel({ tech }: { tech: TechSummary }) {
  const rows: [string, string][] = [
    ["趨勢方向", tech.maStatus.split("｜")[0]],
    ["MA狀態", tech.maStatus.split("｜")[1] ?? "-"],
    ["KD指標", tech.kdStatus],
    ["MACD", tech.macdStatus],
    ["成交量", tech.volumeStatus],
    ["量價關係", tech.volPriceRelation],
  ];
  return (
    <Panel title="技術分析總覽">
      <table className="w-full text-[11px]">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-slate-800/60 last:border-0">
              <td className="py-1 text-slate-400 w-20">{k}</td>
              <td className="py-1 text-cyan-200">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export function ChipPanel({ chip }: { chip: ChipFlow }) {
  const fmtNet = (n: number) => (n >= 0 ? `買超 ${n} 張` : `賣超 ${Math.abs(n)} 張`);
  const cls = (n: number) => (n >= 0 ? "text-red-400" : "text-green-400");
  return (
    <Panel title="籌碼分析" badge="(近5日)">
      <table className="w-full text-[11px]">
        <tbody>
          <tr className="border-b border-slate-800/60">
            <td className="py-1 text-slate-400 w-20">主力</td>
            <td className={`py-1 ${cls(chip.mainForceNet5d)}`}>進出互見 ({chip.mainForceNet5d >= 0 ? "+" : ""}{chip.mainForceNet5d} 張)</td>
          </tr>
          <tr className="border-b border-slate-800/60">
            <td className="py-1 text-slate-400">外資</td>
            <td className={`py-1 ${cls(chip.foreignNet5d)}`}>{fmtNet(chip.foreignNet5d)}</td>
          </tr>
          <tr>
            <td className="py-1 text-slate-400">投信</td>
            <td className={`py-1 ${cls(chip.itrustNet5d)}`}>{fmtNet(chip.itrustNet5d)}</td>
          </tr>
        </tbody>
      </table>
    </Panel>
  );
}

export function IndustryPanel({ info }: { info: IndustryInfo }) {
  return (
    <div className="grid gap-3">
      <Panel title="產業概況">
        <ul className="list-disc pl-4 space-y-0.5 text-cyan-100">
          {info.industry.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </Panel>
      <Panel title="公司概況">
        <ul className="list-disc pl-4 space-y-0.5 text-cyan-100">
          {info.company.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </Panel>
    </div>
  );
}

export function MainForceAlertPanel({
  alert,
}: {
  alert: { mainForce: "green" | "yellow" | "red"; concentration: "green" | "yellow" | "red"; stability: "green" | "yellow" | "red"; conclusion: string; description: string };
}) {
  return (
    <Panel title="主力出貨警示">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[10px] text-slate-400">主力動向</div>
          <div className="mt-1"><Light color={alert.mainForce} /></div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">籌碼集中度</div>
          <div className="mt-1"><Light color={alert.concentration} /></div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">籌碼穩定度</div>
          <div className="mt-1"><Light color={alert.stability} /></div>
        </div>
      </div>
      <div className="mt-2">
        <span className="inline-block rounded bg-yellow-500/20 px-2 py-0.5 text-yellow-300 text-[11px] font-bold">{alert.conclusion}</span>
      </div>
      <p className="mt-1 text-[11px] text-slate-300">{alert.description}</p>
    </Panel>
  );
}

export function WinRateGauge({ rate }: { rate: number }) {
  const angle = -90 + (rate / 100) * 180;
  return (
    <Panel title="短線勝率" badge="(近10日)">
      <div className="relative mx-auto h-[120px] w-[200px]">
        <svg viewBox="0 0 200 110" className="h-full w-full">
          <defs>
            <linearGradient id="gauge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <path d="M 10 100 A 90 90 0 0 1 190 100" stroke="url(#gauge)" strokeWidth="14" fill="none" strokeLinecap="round" />
          <line
            x1="100"
            y1="100"
            x2={100 + 70 * Math.cos((angle * Math.PI) / 180)}
            y2={100 + 70 * Math.sin((angle * Math.PI) / 180)}
            stroke="#fde047"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="5" fill="#fde047" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <div className="text-2xl font-black text-yellow-300">{rate}%</div>
          <div className="text-[10px] text-slate-400">中等偏多</div>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 px-1">
        <span>0%</span><span>100%</span>
      </div>
    </Panel>
  );
}

export function KeyPriceLevelsPanel({ levels }: { levels: { resistanceUpper: number; resistanceLower: number; supportUpper: number; supportLower: number } }) {
  return (
    <Panel title="關鍵價位">
      <div className="space-y-2">
        <div className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-red-300">壓力區</span>
            <span className="font-mono text-red-200">{levels.resistanceLower.toFixed(0)} / {levels.resistanceUpper.toFixed(0)}</span>
          </div>
        </div>
        <div className="rounded border border-green-500/40 bg-green-500/10 px-2 py-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-green-300">支撐區</span>
            <span className="font-mono text-green-200">{levels.supportLower.toFixed(0)} / {levels.supportUpper.toFixed(0)}</span>
          </div>
        </div>
        <div className="text-center text-[11px] text-cyan-300">守住支撐 → 多方格局不變</div>
      </div>
    </Panel>
  );
}

export function VolPriceStructPanel({ tech }: { tech: TechSummary }) {
  const rows: [string, string][] = [
    ["量價背離", tech.volPriceRelation.includes("量縮") ? "價漲量縮，短線需留意" : "量價同步"],
    ["均線乖離", `與MA20乖離約 ${tech.biasMA20 >= 0 ? "+" : ""}${tech.biasMA20}%，${Math.abs(tech.biasMA20) > 8 ? "偏高" : "適中"}`],
    ["主力行為", "主力進出互見，籌碼整理中"],
    ["操作觀察", "量縮整理，等待方向選擇"],
  ];
  return (
    <Panel title="量價結構分析">
      <table className="w-full text-[11px]">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-slate-800/60 last:border-0">
              <td className="py-1 text-slate-400 w-20">{k}</td>
              <td className="py-1 text-cyan-100">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export function InOutStructPanel({ inner, outer }: { inner: number; outer: number }) {
  const total = inner + outer;
  const innerPct = (inner / total) * 100;
  const outerPct = 100 - innerPct;
  return (
    <Panel title="內外盤結構">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-green-300">內盤 (賣壓)</span>
          <span className="font-mono">{inner}</span>
          <span className="text-slate-400">{innerPct.toFixed(2)}%</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-red-300">外盤 (買盤)</span>
          <span className="font-mono">{outer}</span>
          <span className="text-slate-400">{outerPct.toFixed(2)}%</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded">
          <div className="bg-green-500" style={{ width: `${innerPct}%` }} />
          <div className="bg-red-500" style={{ width: `${outerPct}%` }} />
        </div>
        <div className="text-center text-[11px] text-cyan-300">
          {outerPct > innerPct ? "外盤大於內盤，買盤較積極" : "內盤大於外盤，賣壓較重"}
        </div>
      </div>
    </Panel>
  );
}
