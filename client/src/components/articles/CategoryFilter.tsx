import { CATEGORIES } from '../../types';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function CategoryFilter({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange('')}
        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
          value === '' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        全部
      </button>
      {Object.entries(CATEGORIES).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            value === key ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
