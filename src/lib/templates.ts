/**
 * 面試範本（儲存在 localStorage，方便 HR 重複使用常用設定）
 */

export interface InterviewTemplate {
  id: string;
  name: string;
  position: string;
  difficulty: string;
  topics: string[];
  maxQuestions: number;
  timeLimitMin: number;
  perQuestionSec: number;
  linkValidDays: number;
  jdText?: string;
  createdAt: number;
}

const KEY = "interview-templates";

export function loadTemplates(): InterviewTemplate[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as InterviewTemplate[];
  } catch {
    return [];
  }
}

export function saveTemplate(tpl: Omit<InterviewTemplate, "id" | "createdAt">): InterviewTemplate {
  const newTpl: InterviewTemplate = {
    ...tpl,
    id: Math.random().toString(36).substring(2, 9),
    createdAt: Date.now(),
  };
  const list = loadTemplates();
  list.unshift(newTpl);
  if (list.length > 20) list.length = 20;
  localStorage.setItem(KEY, JSON.stringify(list));
  return newTpl;
}

export function deleteTemplate(id: string): void {
  const list = loadTemplates().filter((t) => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}
