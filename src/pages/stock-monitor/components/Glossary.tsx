import { Panel } from "./Panel";

const TERMS: { term: string; def: string }[] = [
  { term: "MA5 / MA20 / MA60", def: "5/20/60 個交易日的收盤平均線。MA5 短線、MA20 中線、MA60 季線。MA5 由下往上穿越 MA20 稱為「黃金交叉」。" },
  { term: "多頭排列", def: "MA5 > MA20 > MA60，表示短中長期均線都在上升，趨勢偏多。" },
  { term: "KD 指標", def: "0–100 區間。> 80 稱「高檔鈍化」，常見於強勢；< 20 稱「低檔鈍化」，常見於弱勢。" },
  { term: "MACD", def: "由兩條 EMA 差值組成，DIF 為 EMA12 − EMA26，DEM 為 DIF 的 EMA9，柱狀為兩者差。OSC 由負轉正常被視為轉強訊號。" },
  { term: "內外盤", def: "內盤 = 以買價成交的張數（賣壓主動），外盤 = 以賣價成交的張數（買盤主動）。外盤大代表買方積極。" },
  { term: "三大法人", def: "外資 / 投信（投資信託基金）/ 自營商。買賣超 = 買進 − 賣出。連續同方向通常代表趨勢方。" },
  { term: "PER 本益比", def: "股價 ÷ 每股盈餘 EPS。歷史 PE 區間 = 該股過去 N 年實際出現的 PE 範圍，可看「目前是貴或便宜」（相對歷史）。" },
  { term: "PBR 股價淨值比", def: "股價 ÷ 每股淨值。多用在金融股、資產股的估值參考。" },
  { term: "YoY / MoM", def: "Year over Year（年增率）= 與去年同期比。Month over Month（月增率）= 與上個月比。" },
  { term: "支撐 / 壓力", def: "支撐 = 過去多次反彈的價位，跌破代表轉弱；壓力 = 過去多次回落的價位，突破代表轉強。" },
  { term: "量縮 / 量增", def: "量能比 5 日均量小 = 量縮；大 = 量增。價漲量增最健康；價漲量縮要小心。" },
  { term: "W 底 / M 頭", def: "W 底 = 雙底反轉型態，多頭訊號；M 頭 = 雙峰反轉型態，空頭訊號。需頸線突破才確認。" },
];

export function Glossary() {
  return (
    <Panel title="📖 看盤名詞速查" badge="(新手模式)" collapsibleId="glossary">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
        {TERMS.map((t) => (
          <div key={t.term} className="border-l-2 border-cyan-500/30 pl-2">
            <dt className="text-[11px] font-bold text-cyan-300">{t.term}</dt>
            <dd className="text-[10px] text-slate-300 leading-relaxed">{t.def}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
