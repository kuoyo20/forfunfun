import { useNavigate } from 'react-router-dom';
import { FileText, BookOpen, PenTool, TrendingUp } from 'lucide-react';
import { useArticleList } from '../hooks/useArticles';
import { useBookList } from '../hooks/useBooks';
import { CATEGORIES } from '../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { articles, total } = useArticleList({});
  const { books } = useBookList();

  const totalWords = articles.reduce((sum, a) => sum + a.word_count, 0);
  const draftCount = articles.filter(a => a.status === 'draft').length;
  const recentArticles = articles.slice(0, 5);

  const stats = [
    { label: '文章總數', value: total, icon: FileText, color: 'bg-blue-50 text-blue-600' },
    { label: '總字數', value: totalWords.toLocaleString(), icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { label: '草稿', value: draftCount, icon: PenTool, color: 'bg-yellow-50 text-yellow-600' },
    { label: '書籍', value: books.length, icon: BookOpen, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <>
      <header className="px-8 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-2xl font-bold text-gray-800">歡迎回來</h2>
        <p className="text-sm text-gray-500 mt-1">WriteFlow — 你的個人寫作平台</p>
      </header>
      <div className="p-8 flex-1 overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent articles */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">最近文章</h3>
              <button onClick={() => navigate('/articles')} className="text-sm text-indigo-600 hover:underline">
                查看全部
              </button>
            </div>
            {recentArticles.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">尚無文章</p>
            ) : (
              <div className="space-y-3">
                {recentArticles.map(a => (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/articles/${a.id}`)}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{a.title || '無標題'}</p>
                      <p className="text-xs text-gray-400">
                        {CATEGORIES[a.category]} · {a.word_count} 字
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(a.updated_at).toLocaleDateString('zh-TW')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">快速操作</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/articles/new')}
                className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-left"
              >
                <PenTool className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="font-medium">撰寫新文章</p>
                  <p className="text-xs text-gray-400">開始一篇新的部落格、專欄或社群文章</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/books')}
                className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-left"
              >
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="font-medium">編纂書籍</p>
                  <p className="text-xs text-gray-400">將你的文章整理成書</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
