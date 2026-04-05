import type { Question, QuestionCategory } from '@/types';

export const questionDatabase: Record<QuestionCategory, Question[]> = {
  general: [
    { id: 'g1', ask: "老闆/店長，最近店裡的生意狀況如何？有沒有哪個時段或是哪類產品特別受歡迎？", listen: "聆聽客流量、熱銷品項、或是淡旺季的困擾。", praise: "聽起來您對市場的敏銳度很高，難怪生意能維持這麼好！", type: 'opening' },
    { id: 'g2', ask: "就您的觀察，現在進來的客人，他們的口味偏好有沒有什麼明顯的變化？", listen: "聆聽市場趨勢關鍵字（如：健康、低糖、視覺系、重口味）。", praise: "您真的很懂您的客人，觀察得好細微。", type: 'opening' },
  ],
  boss: [
    { id: 'b1', ask: "在目前的成本結構下，您比較傾向「提高單價做差異化」，還是「優化成本做量」？", listen: "判斷客戶是重品質（可推高價品）還是重利潤（推高CP值品）。", praise: "這個經營策略很務實，確實現在大環境需要這樣的考量。", type: 'needs' },
    { id: 'b2', ask: "如果不考慮成本，您心目中最想在這家店呈現的招牌產品是什麼樣子？", listen: "挖掘老闆的夢想與品牌核心價值。", praise: "哇，這個願景很棒耶！如果有機會能幫您實現這個想法就太好了。", type: 'vision' },
    { id: 'b3', ask: "對於{product}這個品項，您覺得目前市面上的供應商，最大的痛點通常是什麼？", listen: "找出競爭對手的弱點（缺貨、品質不穩、服務差）。", praise: "您說到重點了，這確實是很多同業最頭痛的地方。", type: 'pain' },
  ],
  chef: [
    { id: 'c1', ask: "師傅，在操作目前的{product}時，有沒有哪個步驟是您覺得最花時間或最難控制品質的？", listen: "尋找操作性痛點（如：發酵不穩、難打發、易消泡）。", praise: "不愧是專業的，連這麼細節的操作手感都注意到了。", type: 'pain' },
    { id: 'c2', ask: "下一季的新品開發，您目前有沒有想要嘗試什麼特殊的風味或口感？", listen: "了解研發方向，以便提供對應的Recipe或樣品。", praise: "這個想法很有創意耶！做出來一定會很有話題。", type: 'needs' },
    { id: 'c3', ask: "如果有一款原料能讓您的{product}保濕性更好（或特定功能），您會願意試試看嗎？", listen: "測試嘗試新原料的意願度。", praise: "師傅您真的很勇於嘗試新事物，這就是職人精神啊！", type: 'closing' },
  ],
  purchaser: [
    { id: 'p1', ask: "目前配合的原物料廠商中，有沒有哪一家的服務或配送是讓您覺得還可以更好的？", listen: "尋找服務缺口（配送慢、帳務不清、常缺貨）。", praise: "辛苦了，控管這麼多供應商真的很不容易。", type: 'pain' },
    { id: 'p2', ask: "在評估新的供應商時，除了價格之外，您最看重的是什麼？穩定性？還是售後服務？", listen: "了解採購的決策權重。", praise: "確實，穩定的供貨比什麼都重要，您考量得很周全。", type: 'needs' },
  ],
  marketing: [
    { id: 'm1', ask: "最近在社群媒體上，您覺得哪一種產品照片或故事，客人的互動率最高？", listen: "了解品牌行銷風格。", praise: "你們的IG經營得很有質感，連我都想跟風去吃了。", type: 'vision' },
    { id: 'm2', ask: "如果這款{product}背後有一個百年老店的故事，您覺得對推廣會有幫助嗎？", listen: "測試是否需要品牌故事支援。", praise: "您很有行銷SENSE，知道現在客人都喜歡聽故事。", type: 'vision' },
  ],
  newClient: [
    { id: 'nc1', ask: "冒昧請教一下，您之前對苗林行的印象大概是如何呢？", listen: "了解品牌知名度與既定印象。", praise: "謝謝您的直言，我們最近確實在這方面做了很多新的努力。", type: 'history' },
  ],
  existingClient: [
    { id: 'ec1', ask: "上次我們合作的那個專案（或是上次進的貨），後續的使用狀況還順利嗎？", listen: "確認滿意度，做售後服務。", praise: "聽到您這樣說我就放心了，有任何問題隨時跟我說。", type: 'history' },
  ],
  closing: [
    { id: 'cl1', ask: "基於我們剛剛聊到的需求，如果我下週帶一款{product}的樣品來給您試試，週二下午方便嗎？", listen: "直接獲取承諾（成交/試用）。", praise: "太好了，我很期待聽聽您的試用回饋。", type: 'closing' },
    { id: 'cl2', ask: "除了您之外，這個新的採購案通常還需要哪位主管點頭確認嗎？", listen: "確認決策鏈（Decision Maker）。", praise: "了解，那我會準備一份適合呈報給該主管的資料給您參考。", type: 'closing' },
  ],
};
