import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// ──────── 從履歷 / JD 自動抽取結構化資料 ────────

export async function extractFromDocs(params: {
  resumeText?: string | null;
  jdText?: string | null;
}): Promise<{
  candidateName?: string;
  candidateEmail?: string;
  position?: string;
  suggestedDifficulty?: "junior" | "mid" | "senior";
  suggestedTopics?: string[];
  roleCategory?: string;
}> {
  const { resumeText, jdText } = params;
  if (!resumeText && !jdText) return {};

  const systemPrompt = `你是一個 HR 助手，負責從履歷和職位說明書中萃取結構化資訊，並建議面試主題。

回傳嚴格的 JSON 格式（不要加 markdown code block）：
{
  "candidateName": "候選人姓名（若找不到用 null）",
  "candidateEmail": "候選人 email（若找不到用 null）",
  "position": "職位名稱（以 JD 優先，若無從履歷推測）",
  "suggestedDifficulty": "junior | mid | senior（根據經驗年資或 JD 要求）",
  "roleCategory": "engineering | design | marketing | sales | product | finance | hr | general",
  "suggestedTopics": ["主題1", "主題2", ...]
}

主題建議規則：
- 列出 5-8 個具體面試主題
- 要貼合這個職位真正會問的內容
- 例如：前端工程師 → ["React", "JavaScript", "CSS", "效能優化", "跨瀏覽器相容"]
- 例如：行銷經理 → ["品牌策略", "數據分析", "活動企劃", "KPI 管理", "跨部門溝通"]
- 例如：業務 → ["客戶開發", "談判技巧", "CRM 系統", "產業知識"]
- 不要只列技術/工具，也要涵蓋軟實力
- 用繁體中文`;

  let userPrompt = "";
  if (resumeText) userPrompt += `【履歷】\n${resumeText.slice(0, 4000)}\n\n`;
  if (jdText) userPrompt += `【職位說明書】\n${jdText.slice(0, 4000)}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = response.content[0];
    if (block.type !== "text") return {};

    let text = block.text.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(text);

    return {
      candidateName: parsed.candidateName || undefined,
      candidateEmail: parsed.candidateEmail || undefined,
      position: parsed.position || undefined,
      suggestedDifficulty: parsed.suggestedDifficulty || undefined,
      roleCategory: parsed.roleCategory || undefined,
      suggestedTopics: Array.isArray(parsed.suggestedTopics) ? parsed.suggestedTopics : undefined,
    };
  } catch (err) {
    console.error("extractFromDocs failed:", err);
    return {};
  }
}

// ──────── 根據面試設定，預覽會出的問題 ────────

export async function previewQuestions(params: {
  position: string;
  difficulty: string;
  topics: string[];
  resumeText?: string | null;
  jdText?: string | null;
  count?: number;
}): Promise<string[]> {
  const { position, difficulty, topics, resumeText, jdText, count = 5 } = params;
  const diffLabel = difficulty === "junior" ? "初階" : difficulty === "mid" ? "中階" : "資深";

  const systemPrompt = `你是專業面試官，針對「${position}」（${diffLabel}）職位，產出 ${count} 題有代表性的面試題目。

主題：${topics.join("、") || "依據職位判斷"}

規則：
- 只回傳 JSON array，例如 ["題目1", "題目2", ...]
- 不要加 markdown code block
- 題目要真正能評估該職位所需能力，而不是泛泛之問
- 用繁體中文
- 每題應該是一個完整的問題，15-50 字

${resumeText ? `【履歷參考】\n${resumeText.slice(0, 2000)}\n\n` : ""}${jdText ? `【JD 參考】\n${jdText.slice(0, 2000)}\n` : ""}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: `請產出 ${count} 題面試題。` }],
    });

    const block = response.content[0];
    if (block.type !== "text") return [];

    let text = block.text.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("previewQuestions failed:", err);
    return [];
  }
}

interface AskParams {
  config: {
    position: string;
    difficulty: string;
    topics: string[];
    maxQuestions: number;
    timeLimitMin: number;
  };
  messages: { role: string; content: string }[];
  resumeText?: string | null;
  jdText?: string | null;
}

function buildSystemPrompt(params: AskParams): string {
  const { config, resumeText, jdText } = params;
  const diffLabel = config.difficulty === "junior" ? "初階" : config.difficulty === "mid" ? "中階" : "資深";

  let prompt = `你是一位專業的面試官，正在面試一位應徵「${config.position}」的候選人。
難度等級：${diffLabel}
面試主題：${config.topics.join("、")}
最多 ${config.maxQuestions} 題，時間限制 ${config.timeLimitMin} 分鐘。

規則：
- 每次只問一個問題
- 根據候選人的回答深度決定是否追問或換新題
- 問題要針對面試主題，難度符合等級
- 用繁體中文提問
- 語氣專業友善
- 不要重複已經問過的問題
- 不要在回覆中加入評分或評語，留到最後報告`;

  if (resumeText) {
    prompt += `\n\n以下是候選人的履歷內容，請根據履歷針對性提問：\n---\n${resumeText.slice(0, 3000)}\n---`;
  }

  if (jdText) {
    prompt += `\n\n以下是職位說明書（JD），請確保問題涵蓋 JD 中的關鍵需求：\n---\n${jdText.slice(0, 3000)}\n---`;
  }

  return prompt;
}

export async function askInterviewer(params: AskParams): Promise<string> {
  const systemPrompt = buildSystemPrompt(params);

  const apiMessages = params.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: apiMessages,
  });

  const block = response.content[0];
  if (block.type === "text") return block.text;
  return "抱歉，我暫時無法回應，請再試一次。";
}

export async function generateAIReport(params: {
  config: AskParams["config"];
  messages: { role: string; content: string }[];
  durationSec: number;
  resumeText?: string | null;
  jdText?: string | null;
}): Promise<{
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  questionBreakdown: { question: string; answer: string; score: number; feedback: string }[];
}> {
  const { config, messages, durationSec } = params;
  const diffLabel = config.difficulty === "junior" ? "初階" : config.difficulty === "mid" ? "中階" : "資深";

  // Pair Q&A
  const pairs: { question: string; answer: string }[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "assistant" && messages[i + 1]?.role === "user") {
      pairs.push({ question: messages[i].content, answer: messages[i + 1].content });
    }
  }

  const qaText = pairs.map((p, i) => `Q${i + 1}: ${p.question}\nA${i + 1}: ${p.answer}`).join("\n\n");

  const systemPrompt = `你是一位面試評估專家。請根據以下面試對話，產出一份 JSON 格式的面試報告。

職位：${config.position}
難度：${diffLabel}
主題：${config.topics.join("、")}
面試時長：${Math.floor(durationSec / 60)} 分 ${durationSec % 60} 秒
${params.resumeText ? `\n履歷摘要：${params.resumeText.slice(0, 1500)}` : ""}
${params.jdText ? `\nJD 摘要：${params.jdText.slice(0, 1500)}` : ""}

請嚴格回傳以下 JSON 格式（不要加 markdown code block，直接回傳純 JSON）：
{
  "overallScore": 0-100 的整數,
  "strengths": ["優勢1", "優勢2", ...],
  "weaknesses": ["待改進1", "待改進2", ...],
  "recommendations": ["建議1", "建議2", ...],
  "questionBreakdown": [
    {
      "question": "面試問題",
      "answer": "候選人回答",
      "score": 0-100 的整數,
      "feedback": "針對此題的評語"
    }
  ]
}

評分標準：
- 90-100：卓越，展現專家級理解
- 80-89：優秀，回答完整有深度
- 70-79：良好，但可以更具體
- 60-69：尚可，缺乏深度或具體案例
- 50-59：不足，回答過於籠統
- 0-49：嚴重不足`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: qaText || "（無對話紀錄）" }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type");
  }

  // Parse JSON, handle possible markdown code block wrapper
  let jsonText = block.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  return JSON.parse(jsonText);
}
