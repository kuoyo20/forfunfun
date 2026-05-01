export function FinalDisclaimer() {
  return (
    <div className="rounded-md border-2 border-amber-500/60 bg-amber-500/10 px-4 py-3 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.15)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">⚠</span>
        <h3 className="text-sm font-black tracking-widest text-amber-300">不負責聲明 / 重要警語</h3>
      </div>
      <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed text-amber-100">
        <li>
          本頁所有「<b>區間參考價</b>」「<b>情境模擬</b>」「<b>YoY</b>」「<b>歷史 PE 分位</b>」皆由演算法
          以 <b>已公開的歷史資料</b> 統計而成，<b>不是預測、不是推估、不是合理股價、不是目標價、不是分析師意見</b>。
        </li>
        <li>
          本頁不是投顧服務，<b>不構成任何投資建議、買賣推薦、選股推薦或績效保證</b>。
          使用者依此操作所生之損益，<b>與本頁開發者完全無關，使用者自行承擔全部風險</b>。
        </li>
        <li>
          本頁所有數據來自 FinMind 公開資訊與公開資訊觀測站 (MOPS) 等第三方來源，
          <b>免費版資料延遲一個交易日</b>，可能存在錯漏，本頁不對資料正確性負責。
        </li>
        <li>
          股市有風險，過去績效不代表未來表現。買賣股票前請<b>參閱公司公開說明書、財務報告、法說會簡報原文</b>，
          並諮詢具有合格證照的專業人士。
        </li>
        <li>
          本頁為個人家庭看盤娛樂工具，<b>非營利、不對外公開招攬</b>。如有任何認定為投顧業務之疑慮，
          請即停止使用並來信告知，將立即下架相關功能。
        </li>
      </ul>
    </div>
  );
}
