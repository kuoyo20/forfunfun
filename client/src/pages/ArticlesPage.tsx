import { useState } from 'react';
import { Search } from 'lucide-react';
import Header from '../components/layout/Header';
import ArticleList from '../components/articles/ArticleList';
import CategoryFilter from '../components/articles/CategoryFilter';
import { useArticleList } from '../hooks/useArticles';

export default function ArticlesPage() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const { articles, total, loading } = useArticleList({ category: category || undefined, search: search || undefined });

  return (
    <>
      <Header title="文章管理" />
      <div className="p-8 flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <CategoryFilter value={category} onChange={setCategory} />
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋文章..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        {loading ? (
          <div className="text-center py-16 text-gray-400">載入中...</div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">共 {total} 篇文章</p>
            <ArticleList articles={articles} />
          </>
        )}
      </div>
    </>
  );
}
