import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, History, Download, Trash2 } from 'lucide-react';
import api from '../api/client';
import { useArticle } from '../hooks/useArticles';
import { useVersions } from '../hooks/useVersions';
import TipTapEditor from '../components/editor/TipTapEditor';
import AiPanel from '../components/editor/AiPanel';
import VersionDrawer from '../components/editor/VersionDrawer';
import { CATEGORIES, PUBLICATIONS } from '../types';

export default function ArticleEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const articleId = isNew ? null : Number(id);

  const { article, loading, save, setArticle } = useArticle(articleId);
  const { versions, createVersion, restoreVersion } = useVersions(articleId);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('blog');
  const [status, setStatus] = useState('draft');
  const [publication, setPublication] = useState('');
  const [tags, setTags] = useState('');
  const [showAi, setShowAi] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const editorContentRef = useRef<string>('');

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setCategory(article.category);
      setStatus(article.status);
      setPublication(article.publication || '');
      setTags(JSON.parse(article.tags || '[]').join(', '));
      editorContentRef.current = article.content_html;
    }
  }, [article]);

  const handleCreate = useCallback(async () => {
    const { data } = await api.post('/articles', {
      title: title || '無標題',
      category,
      status,
      publication: publication || null,
      tags: JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)),
    });
    navigate(`/articles/${data.id}`, { replace: true });
  }, [title, category, status, publication, tags, navigate]);

  const handleEditorUpdate = useCallback(async (data: { html: string; text: string; json: string }) => {
    if (!articleId) return;
    setSaving(true);
    const wordCount = data.text.replace(/\s/g, '').length;
    await save({
      content_html: data.html,
      content_md: data.text,
      content_json: data.json,
      word_count: wordCount,
    });
    setSaving(false);
    setLastSaved(new Date());
  }, [articleId, save]);

  const handleMetaSave = useCallback(async () => {
    if (isNew) {
      await handleCreate();
      return;
    }
    if (!articleId) return;
    setSaving(true);
    await save({
      title,
      category: category as 'blog' | 'social_media' | 'column' | 'book_chapter',
      status: status as 'draft' | 'published' | 'archived',
      publication: publication || null,
      tags: JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)),
    });
    setSaving(false);
    setLastSaved(new Date());
  }, [isNew, articleId, title, category, status, publication, tags, save, handleCreate]);

  const handleRestoreVersion = async (versionId: number) => {
    const restored = await restoreVersion(versionId);
    if (restored) setArticle(restored);
  };

  const handleExport = (format: 'pdf' | 'docx') => {
    if (!articleId) return;
    window.open(`/api/export/article/${articleId}/${format}`, '_blank');
  };

  const handleDelete = async () => {
    if (!articleId || !confirm('確定要刪除此文章嗎？')) return;
    await api.delete(`/articles/${articleId}`);
    navigate('/articles');
  };

  const handleInsertAi = (text: string) => {
    // The AI result will be appended as a new paragraph
    if (article) {
      const newHtml = (article.content_html || '') + `<p>${text}</p>`;
      setArticle({ ...article, content_html: newHtml });
    }
  };

  // Poll selected text from editor
  useEffect(() => {
    const interval = setInterval(() => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim());
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">載入中...</div>;

  return (
    <div className="flex flex-1 h-screen overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/articles')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="文章標題"
              className="text-xl font-bold border-none focus:outline-none bg-transparent w-96"
            />
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-gray-400">
                {saving ? '儲存中...' : `已儲存 ${lastSaved.toLocaleTimeString('zh-TW')}`}
              </span>
            )}
            <button onClick={handleMetaSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
              <Save className="w-4 h-4" />
              {isNew ? '建立' : '儲存'}
            </button>
            {!isNew && (
              <>
                <button onClick={() => setShowAi(!showAi)} className={`p-2 rounded-lg ${showAi ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>
                  <Sparkles className="w-4 h-4" />
                </button>
                <button onClick={() => setShowVersions(!showVersions)} className={`p-2 rounded-lg ${showVersions ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}>
                  <History className="w-4 h-4" />
                </button>
                <div className="relative group">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Download className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block z-10">
                    <button onClick={() => handleExport('pdf')} className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50">匯出 PDF</button>
                    <button onClick={() => handleExport('docx')} className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50">匯出 Word</button>
                  </div>
                </div>
                <button onClick={handleDelete} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Metadata bar */}
        <div className="flex items-center gap-4 px-6 py-2 border-b border-gray-100 bg-gray-50 text-sm">
          <select value={category} onChange={e => setCategory(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
            <option value="draft">草稿</option>
            <option value="published">已發布</option>
          </select>
          {(category === 'column') && (
            <select value={publication} onChange={e => setPublication(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
              <option value="">選擇刊物</option>
              {PUBLICATIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="標籤（逗號分隔）"
            className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 bg-white"
          />
          {article && <span className="text-gray-400">{article.word_count} 字</span>}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-6">
          {!isNew && article ? (
            <TipTapEditor
              content={article.content_html || ''}
              onUpdate={handleEditorUpdate}
            />
          ) : isNew ? (
            <div className="text-center py-16 text-gray-400">
              <p>請先按「建立」按鈕來建立文章，之後即可開始編輯</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Side panels */}
      {showAi && !isNew && (
        <AiPanel
          selectedText={selectedText}
          onInsert={handleInsertAi}
          onClose={() => setShowAi(false)}
        />
      )}
      {showVersions && !isNew && (
        <VersionDrawer
          versions={versions}
          onCreateVersion={createVersion}
          onRestoreVersion={handleRestoreVersion}
          onClose={() => setShowVersions(false)}
        />
      )}
    </div>
  );
}
