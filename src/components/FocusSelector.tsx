import { FOCUS_OPTIONS } from '@/constants';

interface FocusSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const FocusSelector = ({ value, onChange }: FocusSelectorProps) => {
  const selected = value.split('、').filter(Boolean);

  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter(c => c !== option)
      : [...selected, option];
    onChange(next.join('、'));
  };

  const addCustom = (val: string) => {
    if (!val || selected.includes(val)) return;
    onChange([...selected, val].join('、'));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        客戶目前痛點 / 需求 <span className="text-muted-foreground font-normal">(可多選)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {FOCUS_OPTIONS.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`px-3 py-2 text-sm rounded-lg border transition-all min-h-[40px] ${
              selected.includes(option)
                ? 'bg-role-active-bg border-role-active-border text-role-active-text font-bold shadow-sm'
                : 'bg-card border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="mt-2">
        <input
          placeholder="其他需求（自行輸入）"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          onBlur={(e) => {
            const val = e.target.value.trim();
            if (val) { addCustom(val); e.target.value = ''; }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
          }}
        />
      </div>
      {value && (
        <p className="mt-1.5 text-xs text-muted-foreground">已選：{value}</p>
      )}
    </div>
  );
};

export default FocusSelector;
