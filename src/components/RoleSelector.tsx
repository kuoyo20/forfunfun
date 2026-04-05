import type { RoleKey } from '@/types';
import { ROLE_LABELS, ROLE_ICONS } from '@/constants';

interface RoleSelectorProps {
  value: RoleKey;
  onChange: (role: RoleKey) => void;
}

const RoleSelector = ({ value, onChange }: RoleSelectorProps) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-1.5">面向對象</label>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
      {(Object.entries(ROLE_LABELS) as [RoleKey, string][]).map(([key, label]) => {
        const Icon = ROLE_ICONS[key];
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center justify-center gap-1.5 p-3 text-sm rounded-lg border transition-all min-h-[44px] ${
              value === key
                ? 'bg-role-active-bg border-role-active-border text-role-active-text font-bold shadow-sm'
                : 'bg-card border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        );
      })}
    </div>
  </div>
);

export default RoleSelector;
