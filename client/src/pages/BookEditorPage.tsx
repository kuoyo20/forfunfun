import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Download, Trash2 } from 'lucide-react';
import api from '../api/client';
import { useBook } from '../hooks/useBooks';
import { useArticleList } from '../hooks/useArticles';
import ChapterItem from '../components/books/ChapterItem';
import { BOOK_STATUS_MAP } from '../types';

export default function BookEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bookId = Number(id);
  const { book, loading, refresh } = useBook(bookId);
  const { articles } = useArticleList({});

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [showAddArticle, setShowAddArticle] = useState(false);

  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setDescription(book.description);
      setStatus(book.status);
    }
  }, [book]);

  const handleSave = async () => {
    await api.put(`/books/${bookId}`, { title, description, status });
    refresh();
  };

  const handleAddChapter = async (articleId: number) => {
    await api.post(`/books/${bookId}/chapters`, { article_id: articleId });
    setShowAddArticle(false);
    refresh();
  };

  const handleRemoveChapter = async (chapterId: number) => {
    if (!confirm('確定要移除此章節嗎？')) return;
    await api.delete(`/books/${bookId}/chapters/${chapterId}`);
    refresh();
  };

  const handleExport = (format: 'pdf' | 'docx') => {
    window.open(`/api/export/book/${bookId}/${format}`, '_blank');
  };

  const handleDelete = async () => {
    if (!confirm('確定要刪除此書籍嗎？')) return;
    await api.delete(`/books/${bookId}`);
    navigate('/books');
  };

  const totalWords = book?.chapters?.reduce((sum, ch) => sum + ch.word_count, 0) || 0;
  const existingArticleIds = new Set(book?.chapters?.map(ch => ch.article_id) || []);
  const availableArticles = articles.filter(a => !existingArticleIds.has(a.id));

  if (loading) return <div className="p-8 text-center text-gray-400">載入中...</div>;
  if (!book) return <div className="p-8 text-center text-gray-400">書籍不存在</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/books')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="書籍標題"
            className="text-xl font-bold border-none focus:outline-none bg-transparent w-96"
          />
        </div>
        <div className="flex items-center gap-2">
          <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white">
            {Object.entries(BOOK_STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            <Save className="w-4 h-4" />
            儲存
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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">書籍簡介</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="描述這本書的主題和內容..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm text-gray-500">
            <span>共 {book.chapters?.length || 0} 章</span>
            <span>共 {totalWords.toLocaleString()} 字</span>
          </div>

          {/* Chapters */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">章節列表</h3>
              <button
                onClick={() => setShowAddArticle(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm"
              >
                <Plus className="w-4 h-4" />
                新增章節
              </button>
            </div>

            {book.chapters && book.chapters.length > 0 ? (
              <div className="space-y-2">
                {book.chapters.map(chapter => (
                  <ChapterItem
                    key={chapter.id}
                    chapter={chapter}
                    onRemove={handleRemoveChapter}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                <p>尚無章節</p>
                <p className="text-sm mt-1">從你的文章中新增章節到這本書</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add article modal */}
      {showAddArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddArticle(false)}>
          <div className="bg-white rounded-xl w-[500px] max-h-[600px] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">選擇文章加入書籍</h3>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {availableArticles.length === 0 ? (
                <p className="text-center text-gray-400 py-8">沒有可用的文章</p>
              ) : (
                <div className="space-y-2">
                  {availableArticles.map(article => (
                    <button
                      key={article.id}
                      onClick={() => handleAddChapter(article.id)}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                    >
                      <p className="font-medium text-gray-800">{article.title || '無標題'}</p>
                      <p className="text-xs text-gray-400 mt-1">{article.word_count} 字</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button onClick={() => setShowAddArticle(false)} className="w-full py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
