import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import type { Visit, VisitInsert } from '@/integrations/supabase/types';
import { ROLE_LABELS } from '@/constants';
import type { RoleKey } from '@/types';

interface Props {
  open: boolean;
  clientId: string;
  initial?: Visit | null;
  onClose: () => void;
  onSubmit: (data: VisitInsert) => Promise<void>;
}

const VisitFormDialog = ({ open, clientId, initial, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<VisitInsert>({ client_id: clientId });
  const [followUpAction, setFollowUpAction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? {
      client_id: clientId,
      visit_date: initial.visit_date,
      product_discussed: initial.product_discussed || '',
      target_role: initial.target_role || '',
      outcome: initial.outcome,
      client_reaction: initial.client_reaction || '',
      key_findings: initial.key_findings || '',
      next_action: initial.next_action || '',
      next_follow_up_date: initial.next_follow_up_date || null,
    } : {
      client_id: clientId,
      visit_date: new Date().toISOString().slice(0, 16),
    });
    setFollowUpAction('');
    setError(null);
  }, [open, initial, clientId]);

  if (!open) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload: VisitInsert = {
        ...form,
        client_id: clientId,
        visit_date: form.visit_date || new Date().toISOString(),
        next_action: followUpAction || form.next_action || null,
      };
      await onSubmit(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : '儲存失敗');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Calendar size={16} className="text-primary" /> {initial ? '編輯拜訪紀錄' : '新增拜訪紀錄'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">拜訪時間</label>
            <input
              type="datetime-local"
              value={form.visit_date?.slice(0, 16) || ''}
              onChange={e => setForm(prev => ({ ...prev, visit_date: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">推廣產品</label>
              <input
                value={form.product_discussed || ''}
                onChange={e => setForm(prev => ({ ...prev, product_discussed: e.target.value }))}
                placeholder="例：法國奶油"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">面向對象</label>
              <select
                value={form.target_role || ''}
                onChange={e => setForm(prev => ({ ...prev, target_role: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              >
                <option value="">選擇對象</option>
                {(Object.entries(ROLE_LABELS) as [RoleKey, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">拜訪結果</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'positive', label: '✅ 正向', style: 'bg-praise-bg border-praise-border text-foreground' },
                { key: 'neutral', label: '〰️ 中性', style: 'bg-secondary border-border text-muted-foreground' },
                { key: 'negative', label: '❌ 需跟進', style: 'bg-badge-closing border-badge-closing text-badge-closing-text' },
              ] as const).map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, outcome: opt.key }))}
                  className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                    form.outcome === opt.key ? opt.style + ' shadow-sm' : 'bg-card border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">客戶反應摘要</label>
            <textarea
              value={form.client_reaction || ''}
              onChange={e => setForm(prev => ({ ...prev, client_reaction: e.target.value }))}
              rows={2}
              placeholder="客戶當下的反應、態度、興趣..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">關鍵發現 / 需求</label>
            <textarea
              value={form.key_findings || ''}
              onChange={e => setForm(prev => ({ ...prev, key_findings: e.target.value }))}
              rows={3}
              placeholder="客戶提到的痛點、需求、競品、決策考量..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="border-t border-border pt-3">
            <label className="block text-sm font-medium text-foreground mb-1">下一步行動</label>
            <input
              value={followUpAction}
              onChange={e => setFollowUpAction(e.target.value)}
              placeholder="例：下週帶樣品過去、確認報價"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm mb-2"
            />
            <label className="block text-xs text-muted-foreground mb-1">預計跟進日期（選填）</label>
            <input
              type="date"
              value={form.next_follow_up_date || ''}
              onChange={e => setForm(prev => ({ ...prev, next_follow_up_date: e.target.value || null }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            />
            {followUpAction && (
              <p className="text-xs text-accent mt-2">
                💡 儲存後會自動在跟進清單建立待辦
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? '儲存中...' : '儲存拜訪'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitFormDialog;
