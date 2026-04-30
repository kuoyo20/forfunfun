import { useEffect, useState } from "react";

const KEY = "stock-monitor:watchlist";

export interface WatchItem {
  symbol: string;
  name?: string;
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
      /* quota or private mode — silently ignore */
    }
  };

  const add = (item: WatchItem) => {
    if (!item.symbol) return;
    const exists = list.some((x) => x.symbol === item.symbol);
    if (exists) return;
    persist([...list, item]);
  };

  const remove = (symbol: string) => {
    persist(list.filter((x) => x.symbol !== symbol));
  };

  const has = (symbol: string) => list.some((x) => x.symbol === symbol);

  return { list, add, remove, has };
}
