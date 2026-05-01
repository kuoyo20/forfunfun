import { ReactNode, useEffect, useState } from "react";

interface Props {
  title: string;
  badge?: string;
  children: ReactNode;
  className?: string;
  /** Stable id used to persist collapse state in localStorage. If omitted, panel is not collapsible. */
  collapsibleId?: string;
}

const STORAGE_KEY = "stock-monitor:panel-collapsed";

function loadCollapsed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function persistCollapsed(state: Record<string, boolean>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function Panel({ title, badge, children, className, collapsibleId }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!collapsibleId) return;
    setCollapsed(!!loadCollapsed()[collapsibleId]);
  }, [collapsibleId]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (collapsibleId) {
      const all = loadCollapsed();
      if (next) all[collapsibleId] = true;
      else delete all[collapsibleId];
      persistCollapsed(all);
    }
  };

  return (
    <div
      className={`rounded-md border border-cyan-500/30 bg-slate-950/60 shadow-[0_0_12px_rgba(34,211,238,0.08)] ${className ?? ""}`}
    >
      <div className="flex items-center justify-between border-b border-cyan-500/20 px-3 py-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-xs font-bold text-cyan-300 tracking-widest truncate">{title}</h3>
          {badge ? <span className="text-[10px] text-cyan-400/70 truncate">{badge}</span> : null}
        </div>
        {collapsibleId && (
          <button
            type="button"
            onClick={toggle}
            className="ml-2 shrink-0 rounded px-1.5 text-[10px] text-cyan-400/70 hover:bg-cyan-500/10 hover:text-cyan-200"
            title={collapsed ? "展開" : "收合"}
          >
            {collapsed ? "▶" : "▼"}
          </button>
        )}
      </div>
      {!collapsed && <div className="p-3 text-xs text-slate-200">{children}</div>}
    </div>
  );
}

export function Light({ color }: { color: "green" | "yellow" | "red" }) {
  const map = {
    green: "bg-green-500 shadow-[0_0_8px_#22c55e]",
    yellow: "bg-yellow-400 shadow-[0_0_8px_#facc15]",
    red: "bg-red-500 shadow-[0_0_8px_#ef4444]",
  };
  return <span className={`inline-block h-3 w-3 rounded-full ${map[color]}`} />;
}
