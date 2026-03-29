import OpenAI from 'openai';
import db from '../db/connection.js';

function getSettings() {
  const rows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'ai_%'").all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  return settings;
}

function getClient() {
  const settings = getSettings();
  if (!settings.ai_api_key) throw new Error('請先在設定頁面配置 AI API Key');
  return new OpenAI({
    apiKey: settings.ai_api_key,
    baseURL: settings.ai_base_url || 'https://api.openai.com/v1',
  });
}

function getModel() {
  const settings = getSettings();
  return settings.ai_model || 'gpt-4o';
}

const SYSTEM_PROMPTS: Record<string, string> = {
  summarize: '你是一位專業的寫作助手。請將以下文字精簡摘要，保留核心觀點和重要資訊。用繁體中文回覆。',
  rewrite: '你是一位專業的寫作助手。請重寫以下文字，保持核心含義但改善表達方式和文筆。用繁體中文回覆。',
  expand: '你是一位專業的寫作助手。請擴展以下文字，加入更多細節、例子和深入分析。用繁體中文回覆。',
  'adjust-tone': '你是一位專業的寫作助手。請將以下文字調整為指定的語氣風格，保持核心含義不變。用繁體中文回覆。',
  'continue': '你是一位專業的寫作助手。請根據以下文字的脈絡和風格，接續撰寫後續內容。用繁體中文回覆。',
  'title-suggest': '你是一位專業的寫作助手。請根據以下文章內容，建議 5 個吸引人的標題。用繁體中文回覆。',
};

export async function aiAction(action: string, text: string, options?: { tone?: string; prompt?: string }) {
  const client = getClient();
  const systemPrompt = SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.rewrite;
  let userMessage = text;

  if (action === 'adjust-tone' && options?.tone) {
    userMessage = `語氣風格：${options.tone}\n\n文字：${text}`;
  }
  if (options?.prompt) {
    userMessage = `${options.prompt}\n\n${text}`;
  }

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  return response.choices[0]?.message?.content || '';
}

export async function* aiActionStream(action: string, text: string, options?: { tone?: string; prompt?: string }) {
  const client = getClient();
  const systemPrompt = SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.rewrite;
  let userMessage = text;

  if (action === 'adjust-tone' && options?.tone) {
    userMessage = `語氣風格：${options.tone}\n\n文字：${text}`;
  }
  if (options?.prompt) {
    userMessage = `${options.prompt}\n\n${text}`;
  }

  const stream = await client.chat.completions.create({
    model: getModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}
