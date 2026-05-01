import { useEffect, useState } from "react";
import StockMonitor from "./StockMonitor";
import { CompareView } from "./CompareView";
import { MarketView } from "./MarketView";

type View = "monitor" | "compare" | "market";

const TUTOR_KEY = "stock-monitor:tutor";

const TABS: { key: View; label: string }[] = [
  { key: "monitor", label: "個股" },
  { key: "compare", label: "對比" },
  { key: "market", label: "大盤" },
];

function readView(): View {
  if (typeof window === "undefined") return "monitor";
  const h = window.location.hash.replace("#", "") as View;
  return TABS.some((t) => t.key === h) ? h : "monitor";
}

export function StockMonitorApp() {
  const [view, setView] = useState<View>(readView());
  const [tutor, setTutor] = useState<boolean>(() => {
    try { return localStorage.getItem(TUTOR_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    const onHash = () => setView(readView());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const toggleTutor = () => {
    const next = !tutor;
    setTutor(next);
    try { localStorage.setItem(TUTOR_KEY, next ? "1" : "0"); } catch { /* ignore */ }
  };

  const switchView = (v: View) => {
    setView(v);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = v;
      window.history.replaceState({}, "", url.toString());
    }
  };

  const switchToMonitor = (symbol: string) => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("s", symbol);
      url.hash = "monitor";
      window.history.replaceState({}, "", url.toString());
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="sticky top-0 z-30 border-b border-cyan-500/30 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto max-w-[1480px] flex items-center gap-1 px-2 py-1.5 sm:px-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchView(t.key)}
              className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-bold transition-colors ${
                view === t.key
                  ? "bg-cyan-500/30 text-cyan-100 ring-1 ring-cyan-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-cyan-200"
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto">
            <button
              onClick={toggleTutor}
              className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors ${
                tutor
                  ? "bg-yellow-500/20 text-yellow-200 ring-1 ring-yellow-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-yellow-200"
              }`}
              title="顯示看盤名詞速查"
            >
              📖 新手
            </button>
          </div>
        </div>
      </div>
      {view === "monitor" && <StockMonitor tutor={tutor} />}
      {view === "compare" && (
        <div className="mx-auto max-w-[1480px] px-2 py-2 sm:px-3 sm:py-3">
          <CompareView onPick={switchToMonitor} />
        </div>
      )}
      {view === "market" && (
        <div className="mx-auto max-w-[1480px] px-2 py-2 sm:px-3 sm:py-3">
          <MarketView onPick={switchToMonitor} />
        </div>
      )}
    </div>
  );
}
