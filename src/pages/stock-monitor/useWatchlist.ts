import { useEffect, useState } from "react";

const KEY = "stock-monitor:watchlist";
export const COOLDOWN_DAYS = 7;

export interface WatchItem {
  symbol: string;
  name?: string;
  /** 為什麼追蹤這檔（強制 ≥ 30 字） */
  note?: string;
  /** 加入時的 epoch ms（沒填 = 舊資料，視為冷靜期已過） */
  addedAt?: number;
}

function load(): WatchItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => x && typeof x.symbol === "string");
  } catch {
    return [];
  }
}

export function cooldownDaysLeft(item: WatchItem): number {
  if (!item.addedAt) return 0;
  const elapsed = Date.now() - item.addedAt;
  const left = COOLDOWN_DAYS - Math.floor(elapsed / (24 * 60 * 60 * 1000));
  return Math.max(0, left);
}

export function watchedDays(item: WatchItem): number {
  if (!item.addedAt) return COOLDOWN_DAYS;
  return Math.floor((Date.now() - item.addedAt) / (24 * 60 * 60 * 1000));
}

export function useWatchlist() {
  const [list, setList] = useState<WatchItem[]>([]);

  useEffect(() => {
    setList(load());
  }, []);

  const persist = (next: WatchItem[]) => {
    setList(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const add = (item: WatchItem) => {
    if (!item.symbol) return;
    if (list.some((x) => x.symbol === item.symbol)) return;
    persist([...list, { ...item, addedAt: Date.now() }]);
  };

  const remove = (symbol: string) => {
    persist(list.filter((x) => x.symbol !== symbol));
  };

  const has = (symbol: string) => list.some((x) => x.symbol === symbol);

  const get = (symbol: string) => list.find((x) => x.symbol === symbol);

  return { list, add, remove, has, get };
}
