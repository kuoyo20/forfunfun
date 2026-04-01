import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

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
    model: "claude-sonnet-4-20250514",
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
    model: "claude-sonnet-4-20250514",
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
