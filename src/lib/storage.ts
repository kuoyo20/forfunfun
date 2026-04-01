import type { InterviewRecord } from "@/types/interview";

const STORAGE_KEY = "interview-history";

export function loadHistory(): InterviewRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as InterviewRecord[];
  } catch {
    return [];
  }
}

export function saveRecord(record: InterviewRecord): void {
  const history = loadHistory();
  history.unshift(record);
  // Keep at most 50 records
  if (history.length > 50) history.length = 50;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function deleteRecord(id: string): void {
  const history = loadHistory().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
