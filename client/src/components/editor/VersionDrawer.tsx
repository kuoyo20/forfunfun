import { useState } from 'react';
import { History, X, RotateCcw, Plus } from 'lucide-react';
import type { Version } from '../../types';

interface Props {
  versions: Version[];
  onCreateVersion: (note?: string) => void;
  onRestoreVersion: (versionId: number) => void;
  onClose: () => void;
}

export default function VersionDrawer({ versions, onCreateVersion, onRestoreVersion, onClose }: Props) {
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState<number | null>(null);

  const handleCreate = () => {
    onCreateVersion(note || undefined);
    setNote('');
  };

  return (
    <div className="w-72 border-l border-gray-200 bg-white flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold">版本紀錄</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="版本備註（選填）"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleCreate}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {versions.length === 0 ? (
          <p className="p-4 text-sm text-gray-400 text-center">尚無版本紀錄</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {versions.map(v => (
              <div key={v.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{v.title || '無標題'}</p>
                    {v.note && <p className="text-xs text-indigo-500 mt-0.5">{v.note}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(v.created_at).toLocaleString('zh-TW')}
                    </p>
                  </div>
                  {confirming === v.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => { onRestoreVersion(v.id); setConfirming(null); }}
                        className="text-xs px-2 py-1 bg-red-500 text-white rounded"
                      >
                        確認
                      </button>
                      <button
                        onClick={() => setConfirming(null)}
                        className="text-xs px-2 py-1 bg-gray-200 rounded"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirming(v.id)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      title="還原此版本"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
