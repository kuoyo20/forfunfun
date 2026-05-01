import { Panel } from "./Panel";

interface LinkDef {
  label: string;
  desc: string;
  href: (s: string) => string;
}

const LINKS: LinkDef[] = [
  {
    label: "公開資訊觀測站｜公司基本資料",
    desc: "MOPS 官方原始資料",
    href: (s) => `https://mops.twse.com.tw/mops/web/t05st03?TYPEK=sii&colorchg=1&co_id=${s}`,
  },
  {
    label: "公開資訊觀測站｜重大訊息",
    desc: "近期董事會、自結營收、重訊",
    href: (s) => `https://mops.twse.com.tw/mops/web/t05st01?co_id=${s}`,
  },
  {
    label: "公開資訊觀測站｜法人說明會",
    desc: "法說會時程 + 簡報下載",
    href: (s) => `https://mops.twse.com.tw/mops/web/t100sb02_1?co_id=${s}&firstin=ture&TYPEK=`,
  },
  {
    label: "公開資訊觀測站｜年報 / 財報",
    desc: "歷年年報、季報",
    href: (s) => `https://mops.twse.com.tw/mops/web/ezsearch_query?step=00&TYPEK=&co_id=${s}`,
  },
  {
    label: "Yahoo 股市｜個股新聞",
    desc: "媒體聚合的最新新聞",
    href: (s) => `https://tw.stock.yahoo.com/quote/${s}/news`,
  },
  {
    label: "Goodinfo｜籌碼 / 財務",
    desc: "整理過的歷史數據（第三方）",
    href: (s) => `https://goodinfo.tw/tw/StockBzPerformance.asp?STOCK_ID=${s}`,
  },
];

export function PublicLinksPanel({ symbol }: { symbol: string }) {
  return (
    <Panel title="公開資訊連結" badge="(原始資料來源)">
      <div className="grid grid-cols-1 gap-1">
        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href(symbol)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded border border-slate-700 bg-slate-900/40 px-2 py-1 text-[11px] hover:border-cyan-400 hover:bg-cyan-500/10"
          >
            <div className="flex flex-col">
              <span className="text-cyan-200 group-hover:text-cyan-100">{l.label}</span>
              <span className="text-[10px] text-slate-500">{l.desc}</span>
            </div>
            <span className="text-slate-500 group-hover:text-cyan-300">↗</span>
          </a>
        ))}
      </div>
      <div className="text-[10px] text-slate-500 mt-2 leading-relaxed">
        ※ 本頁僅整理連結，不對連結內容負責；分析、估值、預測請以發布者原始說明為準。
      </div>
    </Panel>
  );
}
