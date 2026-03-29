import { useState } from 'react';
import { Sparkles, X, Copy, Check } from 'lucide-react';
import { useAi } from '../../hooks/useAi';

interface Props {
  selectedText: string;
  onInsert: (text: string) => void;
  onClose: () => void;
}

const ACTIONS = [
  { key: 'summarize', label: '摘要' },
  { key: 'rewrite', label: '重寫' },
  { key: 'expand', label: '擴展' },
  { key: 'continue', label: '續寫' },
  { key: 'title-suggest', label: '標題建議' },
  { key: 'adjust-tone', label: '調整語氣' },
];

const TONES = ['正式', '輕鬆', '新聞報導', '學術', '幽默', '感性'];

export default function AiPanel({ selectedText, onInsert, onClose }: Props) {
  const { result, loading, error, run, setResult } = useAi();
  const [action, setAction] = useState('rewrite');
  const [tone, setTone] = useState('正式');
  const [customPrompt, setCustomPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const handleRun = () => {
    const text = selectedText || '（請先在編輯器中選取文字）';
    const options: { tone?: string; prompt?: string } = {};
    if (action === 'adjust-tone') options.tone = tone;
    if (customPrompt) options.prompt = customPrompt;
    run(action, text, options);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold">AI 助手</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">操作</label>
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map(a => (
              <button
                key={a.key}
                onClick={() => setAction(a.key)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  action === a.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {action === 'adjust-tone' && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">語氣</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1 rounded-full text-xs ${
                    tone === t ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">自訂指令（選填）</label>
          <textarea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="例如：用商周專欄的風格改寫..."
            className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">選取的文字：</p>
          <p className="text-sm text-gray-700 line-clamp-4">
            {selectedText || '（請在編輯器中選取文字）'}
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={loading || !selectedText}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? '生成中...' : '執行'}
        </button>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
        )}

        {result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">結果</p>
              <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg text-sm text-gray-800 whitespace-pre-wrap max-h-60 overflow-auto">
              {result}
            </div>
            <button
              onClick={() => { onInsert(result); setResult(''); }}
              className="w-full py-2 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm"
            >
              插入到編輯器
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
