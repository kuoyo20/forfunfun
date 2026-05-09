import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  symbol: string;
  name?: string;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

const MIN_LEN = 30;

export function AddWatchModal({ open, symbol, name, onClose, onConfirm }: Props) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  if (!open) return null;

  const length = note.trim().length;
  const ok = length >= MIN_LEN;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-cyan-400 bg-slate-900 shadow-[0_0_30px_rgba(34,211,238,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-cyan-500/30 px-4 py-3">
          <h2 className="text-base font-bold text-cyan-200">
            ★ 加入自選股 — {symbol} {name}
          </h2>
          <p className="mt-1 text-[11px] text-slate-400">
            為了避免衝動，加入前請寫下「<b className="text-cyan-300">為什麼想追蹤這檔</b>」（至少 {MIN_LEN} 字）
          </p>
        </div>
        <div className="p-4 space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例：朋友推薦 / 看好半導體擴產題材 / 法說會 EPS 大成長 / 殖利率高 ..."
            className="w-full h-28 rounded border border-slate-600 bg-slate-950 px-2 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
            autoFocus
          />
          <div className="flex items-center justify-between text-[11px]">
            <span className={length >= MIN_LEN ? "text-green-400" : "text-amber-400"}>
              {length} / {MIN_LEN} 字
            </span>
            <span className="text-slate-500">
              系統會啟動 <b className="text-yellow-400">7 天冷靜期</b>，幫助你避免衝動決策
            </span>
          </div>
          <div className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-200">
            ⚠ 三個月後可以回來看看：當時的理由還站得住腳嗎？這是訓練投資判斷力最有效的方法之一。
          </div>
        </div>
        <div className="flex gap-2 border-t border-cyan-500/30 px-4 py-3 justify-end">
          <button
            onClick={onClose}
            className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            取消
          </button>
          <button
            disabled={!ok}
            onClick={() => onConfirm(note.trim())}
            className={`rounded px-3 py-1.5 text-xs font-bold ${
              ok
                ? "bg-cyan-500/30 text-cyan-100 ring-1 ring-cyan-400 hover:bg-cyan-500/50"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            加入並啟動冷靜期
          </button>
        </div>
      </div>
    </div>
  );
}
