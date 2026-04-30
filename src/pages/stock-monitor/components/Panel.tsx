import { ReactNode } from "react";

interface Props {
  title: string;
  badge?: string;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, badge, children, className }: Props) {
  return (
    <div
      className={`rounded-md border border-cyan-500/30 bg-slate-950/60 shadow-[0_0_12px_rgba(34,211,238,0.08)] ${className ?? ""}`}
    >
      <div className="flex items-center justify-between border-b border-cyan-500/20 px-3 py-1.5">
        <h3 className="text-xs font-bold text-cyan-300 tracking-widest">{title}</h3>
        {badge ? <span className="text-[10px] text-cyan-400/70">{badge}</span> : null}
      </div>
      <div className="p-3 text-xs text-slate-200">{children}</div>
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
