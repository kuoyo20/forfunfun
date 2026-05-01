const SECTIONS = [
  { id: "sec-quote", label: "報價" },
  { id: "sec-kline", label: "K線" },
  { id: "sec-tech", label: "技術" },
  { id: "sec-pattern", label: "型態" },
  { id: "sec-valuation", label: "估值" },
  { id: "sec-conclusion", label: "結論" },
];

export function SectionNav() {
  return (
    <div className="lg:hidden sticky top-0 z-20 -mx-2 mb-1 border-b border-cyan-500/30 bg-slate-950/95 backdrop-blur">
      <div className="overflow-x-auto">
        <div className="flex gap-1 px-2 py-1.5">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(s.id);
                if (el) {
                  const y = el.getBoundingClientRect().top + window.scrollY - 40;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }
              }}
              className="shrink-0 rounded-full border border-cyan-500/30 bg-slate-900/60 px-3 py-1 text-[11px] text-cyan-200 hover:bg-cyan-500/20 active:bg-cyan-500/30"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
