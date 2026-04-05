import { Briefcase, Sparkles, Star, Loader2 } from 'lucide-react';
import type { FormData, RoleKey, HistoryKey } from '@/types';
import type { ClientData } from '@/data/clients';
import ClientSearch from '@/components/ClientSearch';
import ClientResearch from '@/components/ClientResearch';
import RoleSelector from '@/components/RoleSelector';
import FocusSelector from '@/components/FocusSelector';

interface QuestionFormProps {
  formData: FormData;
  useAI: boolean;
  aiLoading: boolean;
  onFormChange: React.Dispatch<React.SetStateAction<FormData>>;
  onToggleAI: (val: boolean) => void;
  onResearchReady: (research: string) => void;
  onSubmit: () => void;
}

const QuestionForm = ({
  formData, useAI, aiLoading,
  onFormChange, onToggleAI, onResearchReady, onSubmit,
}: QuestionFormProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFormChange(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectClient = (client: ClientData) => {
    onFormChange({
      product: client.product,
      clientName: client.name,
      targetRole: client.targetRole as RoleKey,
      clientFocus: client.clientFocus,
      history: client.history as HistoryKey,
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-8">
        <h2 className="text-base md:text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          <Briefcase size={18} className="text-primary" />
          客戶情境設定
        </h2>
        <p className="text-sm text-muted-foreground mb-6">填入客戶資訊，系統將生成量身定做的提問策略</p>

        <div className="space-y-5">
          {/* Product + Client Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">推廣產品</label>
              <input
                name="product" value={formData.product} onChange={handleInputChange}
                placeholder="例：法國奶油、日本麵粉"
                className="w-full rounded-lg border border-input bg-background px-3 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <ClientSearch
              value={formData.clientName}
              onChange={(val) => onFormChange(prev => ({ ...prev, clientName: val }))}
              onSelectClient={handleSelectClient}
            />
          </div>

          <RoleSelector
            value={formData.targetRole}
            onChange={(role) => onFormChange(prev => ({ ...prev, targetRole: role }))}
          />

          {/* History */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">過往合作狀況</label>
            <select
              name="history" value={formData.history} onChange={handleInputChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="new">全新客戶 (進攻中)</option>
              <option value="existing">既有客戶 (維護/深耕)</option>
            </select>
          </div>

          <FocusSelector
            value={formData.clientFocus}
            onChange={(val) => onFormChange(prev => ({ ...prev, clientFocus: val }))}
          />

          <ClientResearch
            clientName={formData.clientName}
            product={formData.product}
            onResearchReady={onResearchReady}
          />

          {/* AI Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleAI(!useAI)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useAI ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useAI ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Sparkles size={14} className={useAI ? 'text-primary' : ''} />
              {useAI ? 'AI 智慧生成' : '內建題庫'}
            </span>
          </div>

          <button
            onClick={onSubmit}
            disabled={aiLoading}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-base shadow-md disabled:opacity-60 min-h-[48px]"
          >
            {aiLoading ? <Loader2 size={18} className="animate-spin" /> : (useAI ? <Sparkles size={18} /> : <Star size={18} />)}
            {aiLoading ? 'AI 生成中...' : (useAI ? 'AI 生成進攻策略' : '生成進攻策略')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;
