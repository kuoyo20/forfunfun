import type { ArticleListItem } from '../../types';
import ArticleCard from './ArticleCard';

export default function ArticleList({ articles }: { articles: ArticleListItem[] }) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">尚無文章</p>
        <p className="text-sm mt-2">點擊右上角「新增文章」開始寫作</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
