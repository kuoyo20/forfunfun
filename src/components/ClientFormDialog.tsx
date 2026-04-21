import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Client, ClientInsert } from '@/integrations/supabase/types';

interface Props {
  open: boolean;
  initial?: Client | null;
  onClose: () => void;
  onSubmit: (data: ClientInsert) => Promise<void>;
}

const emptyForm: ClientInsert = {
  name: '',
  industry: '',
  address: '',
  phone: '',
  contact_person: '',
  contact_role: '',
  status: 'prospect',
  tags: [],
  notes: '',
};

const ClientFormDialog = ({ open, initial, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<ClientInsert>(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        name: initial.name,
        industry: initial.industry || '',
        address: initial.address || '',
        phone: initial.phone || '',
        contact_person: initial.contact_person || '',
        contact_role: initial.contact_role || '',
        status: initial.status,
        tags: initial.tags || [],
        notes: initial.notes || '',
      } : emptyForm);
      setTagInput('');
      setError(null);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.name?.trim()) {
      setError('請輸入客戶名稱');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (e) {
      setError(e instanceof Error ? e.message : '儲存失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || form.tags?.includes(t)) return;
    setForm(prev => ({ ...prev, tags: [...(prev.tags || []), t] }));
    setTagInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">{initial ? '編輯客戶' : '新增客戶'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">客戶名稱 *</label>
            <input
              value={form.name || ''}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例：吳寶春麥方店"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">產業</label>
              <input
                value={form.industry || ''}
                onChange={e => setForm(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="例：烘焙 / 餐飲"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">狀態</label>
              <select
                value={form.status || 'prospect'}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value as Client['status'] }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              >
                <option value="prospect">開發中</option>
                <option value="active">合作中</option>
                <option value="inactive">暫停</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">聯絡人</label>
              <input
                value={form.contact_person || ''}
                onChange={e => setForm(prev => ({ ...prev, contact_person: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">職稱</label>
              <input
                value={form.contact_role || ''}
                onChange={e => setForm(prev => ({ ...prev, contact_role: e.target.value }))}
                placeholder="例：老闆 / 主廚 / 採購"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">電話</label>
            <input
              value={form.phone || ''}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">地址</label>
            <input
              value={form.address || ''}
              onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">標籤</label>
            <div className="flex gap-2 mb-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="例：VIP、重點開發"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-muted"
              >
                加入
              </button>
            </div>
            {form.tags && form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tag) }))}
                      className="hover:text-destructive"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">備註</label>
            <textarea
              value={form.notes || ''}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="客戶特點、偏好、注意事項..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
            />
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
            {submitting ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientFormDialog;
