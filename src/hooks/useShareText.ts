import { useCallback } from 'react';
import type { Question, FormData } from '@/types';
import { ROLE_LABELS } from '@/constants';
import { getBadgeLabel } from '@/utils/questionBadge';

export function useShareText(formData: FormData, questions: Question[]) {
  const getShareText = useCallback(() => {
    const header = `📋 ${formData.clientName} 進攻計畫\n對象：${ROLE_LABELS[formData.targetRole]} ｜ 產品：${formData.product}\n\n`;
    const body = questions
      .map((q, i) => `【問題 #${i + 1}】${getBadgeLabel(q.type)}\n${q.ask}\n📌 聆聽: ${q.listen}\n⭐ 讚美: ${q.praise}`)
      .join('\n\n');
    const footer = `\n\n— 苗林行業務關鍵提問生成器`;
    return header + body + footer;
  }, [formData, questions]);

  const getNblmPrompt = useCallback(() => {
    const header = `請幫我製作一份針對「${formData.clientName}」的業務拜訪簡報（PPTX 或 Google Slides）。\n\n`;
    const context = `📋 背景資訊：\n- 推廣產品：${formData.product}\n- 面向對象：${ROLE_LABELS[formData.targetRole]}\n- 合作狀況：${formData.history === 'new' ? '全新客戶' : '既有客戶'}\n${formData.clientFocus ? `- 客戶重點：${formData.clientFocus}\n` : ''}\n`;
    const questionsText = `📌 關鍵提問策略（共 ${questions.length} 題）：\n` +
      questions.map((q, i) => `${i + 1}. 【${getBadgeLabel(q.type)}】${q.ask}\n   聆聽：${q.listen}\n   讚美：${q.praise}`).join('\n\n');
    const style = `\n\n🎨 簡報風格要求：\n- 烘焙插畫風格，溫暖色調\n- 每頁 1-2 個問題，搭配聆聽重點和讚美話術\n- 封面包含客戶名稱、產品、苗林行品牌\n- 結尾頁加入苗林行品牌精神：讓品味與食俱進\n- 專業但親切的語調`;
    return header + context + questionsText + style;
  }, [formData, questions]);

  return { getShareText, getNblmPrompt };
}
