import type { InterviewConfig, InterviewReport, Message } from "@/types/interview";

const TOPIC_QUESTIONS: Record<string, string[]> = {
  JavaScript: [
    "請說明 `var`、`let` 和 `const` 的差異，以及各自適合的使用場景？",
    "JavaScript 的事件迴圈（Event Loop）是如何運作的？請說明微任務和巨任務的執行順序。",
    "什麼是閉包（Closure）？你在實際專案中如何運用它？",
  ],
  TypeScript: [
    "你如何在 TypeScript 中使用泛型（Generics）？請舉一個實際必要的例子。",
    "TypeScript 中 `interface` 和 `type` 有什麼差別？你什麼時候會選擇其中之一？",
    "你如何處理嚴格空值檢查？有哪些常見的模式來處理可能為 undefined 的值？",
  ],
  React: [
    "請解釋 React 的元件生命週期。`useEffect` 等 Hook 如何對應到 class 生命週期方法？",
    "什麼時候會使用 `useMemo` vs `useCallback`？請描述一個它們實際產生效果的場景。",
    "你如何管理大型 React 應用程式的狀態？請比較你用過的不同方案的取捨。",
  ],
  "Node.js": [
    "Node.js 既然是單執行緒，它是如何處理並發請求的？",
    "你在 Express/Node.js 應用程式中使用什麼錯誤處理策略？",
    "如果要設計一個每秒處理數千則訊息的 Node.js 應用程式，你會怎麼做？",
  ],
  "系統設計": [
    "你會如何設計一個像 bit.ly 的短網址服務？請帶我走過關鍵元件。",
    "設計一個即時通知系統，你會考慮哪些取捨？",
    "如何擴展一個聊天應用程式以支援數百萬的同時在線用戶？",
  ],
  "資料結構": [
    "什麼時候你會選擇雜湊表（Hash Map）而非平衡二元搜尋樹？各有什麼取捨？",
    "請說明你會如何實作 LRU 快取。你會使用哪些資料結構？",
    "描述一個選擇正確資料結構顯著改善效能的經驗。",
  ],
  "演算法": [
    "請帶我走過你解決動態規劃問題的思考過程。",
    "什麼時候 BFS 比 DFS 更適合，反之亦然？請舉例說明。",
    "你如何分析程式碼的時間和空間複雜度？請舉一個近期的例子。",
  ],
  CSS: [
    "請解釋 CSS 盒模型。`box-sizing: border-box` 會如何改變行為？",
    "你如何決定使用 Flexbox 還是 Grid？請描述一個 Grid 明顯更好的版面。",
    "你如何處理響應式設計？面對不同螢幕尺寸，你的策略是什麼？",
  ],
  "測試": [
    "你的測試策略是什麼？如何決定什麼該單元測試、整合測試或端對端測試？",
    "你如何測試非同步程式碼？使用什麼模式來模擬 API 呼叫？",
    "描述一次測試在上線前捕獲重大 bug 的經驗。",
  ],
  DevOps: [
    "你會如何為新專案建立 CI/CD 管線？會選擇哪些工具，為什麼？",
    "你如何看待容器化？什麼情況下 Docker 是多餘的？",
    "你用過哪些監控和可觀測性工具？如何決定要監控什麼？",
  ],
};

const DIFFICULTY_PREFIXES: Record<string, string> = {
  junior: "這是一個基礎概念題。",
  mid: "讓我們深入一點。",
  senior: "我想從架構層面來探討。",
};

const FOLLOW_UP_TEMPLATES = [
  "這很有趣。你能從實際經驗中給我一個更具體的例子嗎？",
  "好觀點。如果規模增加 100 倍，你的做法會有什麼不同？",
  "了解。如果可以重新開始那個專案，你會做什麼不同的決定？",
  "你能帶我走過如果這個解決方案失敗了，你會如何除錯？",
  "你會如何向團隊中的初階開發者解釋這個概念？",
  "這個方法有哪些潛在的陷阱？你會如何避免？",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getQuestionPool(config: InterviewConfig): string[] {
  const pool: string[] = [];
  for (const topic of config.topics) {
    const questions = TOPIC_QUESTIONS[topic];
    if (questions) pool.push(...questions);
  }
  if (pool.length === 0) {
    pool.push(
      "請分享一個你最近做過的有挑戰性的專案。",
      "你如何學習新技術？",
      "描述你理想的開發工作流程。",
    );
  }
  return pool;
}

function buildQuestion(
  config: InterviewConfig,
  questionPool: string[],
  askedQuestions: Set<string>,
  questionIndex: number,
  lastAnswer: string,
): string {
  if (questionIndex > 1 && questionIndex % 3 === 0 && lastAnswer.length > 20) {
    return pickRandom(FOLLOW_UP_TEMPLATES);
  }

  const available = questionPool.filter((q) => !askedQuestions.has(q));
  if (available.length === 0) {
    return pickRandom(FOLLOW_UP_TEMPLATES);
  }

  const question = pickRandom(available);
  askedQuestions.add(question);

  const prefix = DIFFICULTY_PREFIXES[config.difficulty] ?? "";
  return prefix + question;
}

const sessionAskedQuestions = new Set<string>();
let sessionQuestionPool: string[] = [];

export function resetSession(): void {
  sessionAskedQuestions.clear();
  sessionQuestionPool = [];
}

export async function fetchNextQuestion(
  config: InterviewConfig,
  messages: Message[],
  questionIndex: number,
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

  if (sessionQuestionPool.length === 0) {
    sessionQuestionPool = getQuestionPool(config);
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const lastAnswer = lastUserMsg?.content ?? "";

  return buildQuestion(config, sessionQuestionPool, sessionAskedQuestions, questionIndex, lastAnswer);
}

export function buildGreeting(config: InterviewConfig): string {
  const topicList = config.topics.join("、");
  const diffLabel = config.difficulty === "junior" ? "初階" : config.difficulty === "mid" ? "中階" : "資深";

  return (
    `你好！我是今天的面試官，將針對 **${config.position}** 職位進行面試。` +
    `我們會聚焦在 ${topicList}，難度為${diffLabel}等級。` +
    `你有 ${config.timeLimitMinutes} 分鐘，最多 ${config.maxQuestions} 題。\n\n` +
    `讓我們開始吧 — 請先簡單自我介紹，並說說你對這個職位感興趣的原因？`
  );
}

function pairQuestionsAndAnswers(messages: Message[]): { question: string; answer: string }[] {
  const pairs: { question: string; answer: string }[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "assistant") {
      const nextUser = messages[i + 1];
      if (nextUser && nextUser.role === "user") {
        pairs.push({ question: messages[i].content, answer: nextUser.content });
      }
    }
  }
  return pairs;
}

function evaluateAnswer(answer: string, difficulty: string): { score: number; feedback: string } {
  const length = answer.length;
  const hasSpecificTerms = /範例|專案|實作|設計|因為|方法|經驗|example|project|implemented|built|designed|because|approach/i.test(answer);
  const hasNumbers = /\d/.test(answer);

  let baseScore: number;
  if (length < 30) baseScore = 40 + Math.floor(Math.random() * 15);
  else if (length < 100) baseScore = 55 + Math.floor(Math.random() * 15);
  else if (length < 300) baseScore = 65 + Math.floor(Math.random() * 15);
  else baseScore = 75 + Math.floor(Math.random() * 15);

  if (hasSpecificTerms) baseScore += 5;
  if (hasNumbers) baseScore += 3;
  const score = Math.min(100, baseScore);

  let feedback: string;
  if (score >= 85) feedback = "出色的回答，有具體細節和清晰的推理。";
  else if (score >= 70) feedback = "不錯的回答。加入更多具體案例會更有說服力。";
  else if (score >= 55) feedback = "回答尚可，但缺乏深度。試著加入具體的經驗或技術細節。";
  else feedback = "回答過於簡短。請用案例、取捨分析和推理過程來補充。";

  if (difficulty === "senior" && score < 80) {
    feedback += " 對於資深職位，需要展現更多架構層面的洞察。";
  }

  return { score, feedback };
}

export async function fetchReport(
  config: InterviewConfig,
  messages: Message[],
  durationSeconds: number,
): Promise<InterviewReport> {
  await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));

  const pairs = pairQuestionsAndAnswers(messages);
  const questionBreakdown = pairs.map(({ question, answer }) => {
    const { score, feedback } = evaluateAnswer(answer, config.difficulty);
    return { question, answer, score, feedback };
  });

  const scores = questionBreakdown.map((q) => q.score);
  const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const avgLength = pairs.length > 0 ? pairs.reduce((sum, p) => sum + p.answer.length, 0) / pairs.length : 0;

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (overallScore >= 70) strengths.push("展現了對核心概念的扎實理解");
  if (avgLength > 150) strengths.push("回答詳細且完整");
  if (pairs.length >= config.maxQuestions * 0.8) strengths.push("完成了大部分面試題目");
  if (scores.some((s) => s >= 85)) strengths.push("部分回答展現了出色的深度");

  if (overallScore < 65) weaknesses.push("整體回答需要更多技術深度");
  if (avgLength < 80) weaknesses.push("回答偏簡短 — 建議提供更多細節");
  if (scores.some((s) => s < 50)) weaknesses.push("部分回答明顯低於預期水準");
  if (durationSeconds < config.timeLimitMinutes * 60 * 0.3) {
    weaknesses.push("完成速度過快 — 建議花更多時間思考再作答");
  }

  if (strengths.length === 0) strengths.push("展現了嘗試回答所有問題的態度");
  if (weaknesses.length === 0) weaknesses.push("小建議：可以加入更多實際案例來加強回答");

  const recommendations = [
    "練習 STAR 方法（情境、任務、行動、結果）來回答行為面試題",
    "描述過往專案時，加入具體的數據或成果",
    `複習 ${config.topics[0] ?? "核心"} 基礎知識，以提升技術回答的品質`,
  ];

  if (config.difficulty === "senior") {
    recommendations.push("加強架構決策和取捨分析的表達");
  }
  if (avgLength < 100) {
    recommendations.push("每題回答建議 3-5 句話，提供足夠的細節");
  }

  return { overallScore, strengths, weaknesses, recommendations, questionBreakdown };
}
