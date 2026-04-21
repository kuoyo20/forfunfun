import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { clientDatabase, ClientData } from '@/data/clients';

interface ClientSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelectClient: (client: ClientData) => void;
}

const ClientSearch = ({ value, onChange, onSelectClient }: ClientSearchProps) => {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<ClientData[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length > 0) {
      const results = clientDatabase.filter(c =>
        c.name.toLowerCase().includes(value.toLowerCase())
      );
      setFiltered(results);
      setOpen(results.length > 0);
    } else {
      setFiltered([]);
      setOpen(false);
    }
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (client: ClientData) => {
    onSelectClient(client);
    setOpen(false);
  };

  const showAll = () => {
    setFiltered(clientDatabase);
    setOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-foreground mb-1.5">客戶品牌名稱</label>
      <div className="relative">
        <input
          name="clientName"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => { if (value.trim()) { setOpen(filtered.length > 0); } }}
          placeholder="輸入任何品牌名稱（如：星巴克、鼎泰豐）"
          className="w-full rounded-lg border border-input bg-background pl-3 pr-10 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={showAll}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          title="顯示常用客戶"
        >
          <Search size={16} />
        </button>
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto">
          <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border bg-secondary/50">
            常用客戶（也可直接輸入任何品牌）
          </div>
          {filtered.map(client => (
            <button
              key={client.name}
              onClick={() => handleSelect(client)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-secondary transition-colors flex items-center justify-between gap-2 border-b border-border last:border-b-0"
            >
              <span className="font-medium text-foreground">{client.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{client.product}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientSearch;
