import { useNavigate } from 'react-router-dom';
import { FileText, Clock } from 'lucide-react';
import { CATEGORIES, STATUS_MAP } from '../../types';
import type { ArticleListItem } from '../../types';

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
};

export default function ArticleCard({ article }: { article: ArticleListItem }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/articles/${article.id}`)}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          <span className="text-xs text-gray-500">{CATEGORIES[article.category] || article.category}</span>
          {article.publication && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
              {article.publication}
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[article.status] || ''}`}>
          {STATUS_MAP[article.status] || article.status}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
        {article.title || '無標題'}
      </h3>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{article.word_count} 字</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(article.updated_at).toLocaleDateString('zh-TW')}
        </span>
      </div>
    </div>
  );
}
