import { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import api from '../api/client';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    ai_provider: 'openai',
    ai_api_key: '',
    ai_base_url: 'https://api.openai.com/v1',
    ai_model: 'gpt-4o',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setSettings(prev => ({ ...prev, ...data }));
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await api.put('/settings', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">載入中...</div>;

  return (
    <>
      <header className="px-8 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-2xl font-bold text-gray-800">設定</h2>
      </header>
      <div className="p-8 flex-1 overflow-auto">
        <div className="max-w-2xl space-y-8">
          {/* AI Configuration */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">AI 設定</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AI 服務提供商</label>
                <select
                  value={settings.ai_provider}
                  onChange={e => setSettings({ ...settings, ai_provider: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="ollama">Ollama (本機)</option>
                  <option value="custom">自訂</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={settings.ai_api_key}
                  onChange={e => setSettings({ ...settings, ai_api_key: e.target.value })}
                  placeholder="sk-..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">API Key 會安全地儲存在本機資料庫中</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
                <input
                  type="text"
                  value={settings.ai_base_url}
                  onChange={e => setSettings({ ...settings, ai_base_url: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  如果使用 Ollama，請填入 http://localhost:11434/v1
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模型名稱</label>
                <input
                  type="text"
                  value={settings.ai_model}
                  onChange={e => setSettings({ ...settings, ai_model: e.target.value })}
                  placeholder="gpt-4o"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  例如：gpt-4o、claude-sonnet-4-6、llama3 等
                </p>
              </div>
            </div>
          </section>

          {/* Save */}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? '已儲存' : '儲存設定'}
          </button>
        </div>
      </div>
    </>
  );
}
